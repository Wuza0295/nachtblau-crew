import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type {
  ApiUser,
  AuthResponse,
  FeedResponse,
  MediaKind,
} from "@hybrixon/contracts";
import { uploadMediaMultipart } from "@hybrixon/contracts/upload";

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL
  || Constants.expoConfig?.extra?.apiUrl
  || "https://api.hybrixon.com/v2"
).replace(/\/+$/, "");
const ACCESS = "hybrixon_access";
const REFRESH = "hybrixon_refresh";
export const UPLOAD_QUEUE = "hybrixon_upload_queue_v2";

async function tokens(): Promise<{ access: string; refresh: string }> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS),
    SecureStore.getItemAsync(REFRESH),
  ]);
  return { access: access ?? "", refresh: refresh ?? "" };
}

async function saveAuth(auth: AuthResponse): Promise<AuthResponse> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS, auth.accessToken),
    auth.refreshToken
      ? SecureStore.setItemAsync(REFRESH, auth.refreshToken)
      : Promise.resolve(),
  ]);
  return auth;
}

async function call<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const auth = await tokens();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(auth.access ? { Authorization: `Bearer ${auth.access}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (response.status === 401 && retry && auth.refresh) {
    const refreshed = await call<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refresh }),
    }, false);
    await saveAuth(refreshed);
    return call<T>(path, init, false);
  }
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
}

export const api = {
  register(input: {
    username: string;
    email: string;
    password: string;
    birthdate: string;
  }) {
    return call<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...input, legalAccepted: true }),
    }).then(saveAuth);
  },
  login(login: string, password: string) {
    return call<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }).then(saveAuth);
  },
  async logout() {
    const auth = await tokens();
    await call("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refresh }),
    }).catch(() => undefined);
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
    ]);
  },
  me() {
    return call<{ user: ApiUser }>("/auth/me");
  },
  feed() {
    return call<FeedResponse>("/posts?limit=30");
  },
  createPost(input: {
    body: string;
    mediaIds: string[];
    isAdult: boolean;
    visibility: "public" | "followers" | "friends";
  }) {
    return call<{ postId: number }>("/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  registerPush(token: string) {
    return call("/devices/push", {
      method: "POST",
      body: JSON.stringify({ platform: "android", token }),
    });
  },
};

export type QueuedFile = {
  uri: string;
  name: string;
  mime: string;
  size: number;
};

export type QueuedPost = {
  id: string;
  body: string;
  isAdult: boolean;
  visibility: "public" | "followers" | "friends";
  files: QueuedFile[];
  createdAt: string;
};

export async function enqueuePost(post: QueuedPost): Promise<void> {
  const queue = JSON.parse(await AsyncStorage.getItem(UPLOAD_QUEUE) ?? "[]") as QueuedPost[];
  queue.push(post);
  await AsyncStorage.setItem(UPLOAD_QUEUE, JSON.stringify(queue));
}

export async function processUploadQueue(
  onProgress?: (percent: number) => void,
): Promise<number> {
  const queue = JSON.parse(await AsyncStorage.getItem(UPLOAD_QUEUE) ?? "[]") as QueuedPost[];
  let completed = 0;
  while (queue.length) {
    const post = queue[0];
    if (!post) break;
    const auth = await tokens();
    if (!auth.access) throw new Error("Keine aktive Anmeldung.");
    const ids: string[] = [];
    for (const [index, file] of post.files.entries()) {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const source = Object.assign(blob, {
        name: file.name,
        type: file.mime,
        size: file.size || blob.size,
      });
      const kind: MediaKind = file.mime.startsWith("video/") ? "video" : "image";
      const media = await uploadMediaMultipart({
        apiBaseUrl: API_URL,
        accessToken: auth.access,
        source,
        kind,
        onProgress: (sent, total) => {
          const fileProgress = total ? sent / total : 0;
          onProgress?.(Math.round(((index + fileProgress) / Math.max(1, post.files.length)) * 100));
        },
      });
      ids.push(media.id);
    }
    await api.createPost({
      body: post.body,
      isAdult: post.isAdult,
      visibility: post.visibility,
      mediaIds: ids,
    });
    queue.shift();
    completed += 1;
    await AsyncStorage.setItem(UPLOAD_QUEUE, JSON.stringify(queue));
  }
  return completed;
}
