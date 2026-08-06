export type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  isAdult: boolean;
  ageVerified: boolean;
  agePending: boolean;
  createdAt: string;
};

export type Post = {
  id: number;
  username: string;
  body: string;
  isAdult: boolean;
  likeCount: number;
  createdAt: string;
  imageUrl: string | null;
};

type ApiOk<T> = T & { ok: true };
type ApiErr = { ok: false; error: string; errors?: string[] };

let csrf = "";

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as ApiOk<T> | ApiErr;
  if (!res.ok || (data as ApiErr).ok === false) {
    throw new Error((data as ApiErr).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function apiGetMe() {
  const data = await parse<{
    user: User | null;
    csrf: string;
    brand: { name: string; tagline: string };
  }>(await fetch("/api/me", { credentials: "same-origin" }));
  csrf = data.csrf;
  return data;
}

export async function apiRefreshCsrf() {
  const data = await parse<{ csrf: string }>(
    await fetch("/api/csrf", { credentials: "same-origin" })
  );
  csrf = data.csrf;
  return csrf;
}

export async function apiLogin(login: string, password: string) {
  if (!csrf) await apiRefreshCsrf();
  return parse<{ user: User }>(
    await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify({ login, password }),
    })
  );
}

export async function apiLogout() {
  if (!csrf) await apiRefreshCsrf();
  return parse<{ ok: true }>(
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrf },
    })
  );
}

export async function apiRegister(input: {
  username: string;
  email: string;
  password: string;
  birthdate: string;
  legalOk: boolean;
}) {
  if (!csrf) await apiRefreshCsrf();
  return parse<{ user: User }>(
    await fetch("/api/register", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify(input),
    })
  );
}

export async function apiFeed() {
  return parse<{ posts: Post[]; canSeeAdult: boolean }>(
    await fetch("/api/feed", { credentials: "same-origin" })
  );
}

export async function apiCreatePost(form: FormData) {
  if (!csrf) await apiRefreshCsrf();
  return parse<{ ok: true }>(
    await fetch("/api/posts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrf },
      body: form,
    })
  );
}

export async function apiLike(postId: number) {
  if (!csrf) await apiRefreshCsrf();
  return parse<{ ok: true }>(
    await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrf },
    })
  );
}

export function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} Std.`;
  return `${Math.floor(diff / 86400)} T.`;
}
