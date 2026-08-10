import type {
  ApiUser,
  AuthResponse,
  FeedResponse,
  MediaKind,
} from "@hybrixon/contracts";
import { uploadMediaMultipart } from "@hybrixon/contracts/upload";

export const API_URL = (import.meta.env.VITE_API_URL || "/v2").replace(/\/+$/, "");
let accessToken = localStorage.getItem("hybrixon_v2_access") ?? "";

export function hasSession(): boolean {
  return Boolean(accessToken);
}

export function clearSession(): void {
  accessToken = "";
  localStorage.removeItem("hybrixon_v2_access");
}

function saveSession(response: AuthResponse): AuthResponse {
  accessToken = response.accessToken;
  localStorage.setItem("hybrixon_v2_access", accessToken);
  return response;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (response.status === 401 && retry && path !== "/auth/refresh") {
    try {
      const refreshed = await request<AuthResponse>(
        "/auth/refresh",
        { method: "POST", body: "{}" },
        false,
      );
      saveSession(refreshed);
      return request<T>(path, init, false);
    } catch {
      clearSession();
    }
  }
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
}

export const api = {
  login(login: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }).then(saveSession);
  },
  register(input: {
    username: string;
    email: string;
    password: string;
    birthdate: string;
  }) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...input, legalAccepted: true }),
    }).then(saveSession);
  },
  me() {
    return request<{ user: ApiUser }>("/auth/me");
  },
  async logout() {
    await request("/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    clearSession();
  },
  feed(cursor?: string) {
    const query = new URLSearchParams({ limit: "20" });
    if (cursor) query.set("cursor", cursor);
    return request<FeedResponse>(`/posts?${query}`);
  },
  createPost(input: {
    body: string;
    isAdult: boolean;
    visibility: "public" | "followers" | "friends";
    mediaIds: string[];
  }) {
    return request<{ postId: number }>("/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  like(postId: number) {
    return request<{ liked: boolean }>(`/posts/${postId}/like`, {
      method: "POST",
      body: "{}",
    });
  },
};

export async function uploadFiles(
  files: File[],
  onProgress: (percent: number, label: string) => void,
): Promise<string[]> {
  if (!accessToken) throw new Error("Bitte zuerst anmelden.");
  const ids = new Array<string>(files.length);
  const loaded = new Array<number>(files.length).fill(0);
  let next = 0;
  const update = (index: number, bytes: number) => {
    loaded[index] = bytes;
    const total = files.reduce((sum, file) => sum + file.size, 0);
    const sent = loaded.reduce((sum, value) => sum + value, 0);
    onProgress(total ? Math.round((sent / total) * 100) : 0, `${index + 1}/${files.length}`);
  };
  const worker = async () => {
    while (next < files.length) {
      const index = next++;
      const file = files[index];
      if (!file) continue;
      const kind: MediaKind = file.type.startsWith("video/") ? "video" : "image";
      const media = await uploadMediaMultipart({
        apiBaseUrl: API_URL,
        accessToken,
        source: file,
        kind,
        parallelism: kind === "video" ? 4 : 2,
        onProgress: (bytes) => update(index, bytes),
      });
      ids[index] = media.id;
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker));
  return ids;
}
