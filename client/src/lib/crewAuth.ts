import type { ConfirmationDelivery } from "@shared/emailAuth";

export type CrewUser = {
  id: number;
  name: string;
  email: string;
};

export class CrewAuthError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "CrewAuthError";
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = {
  error?: string;
  code?: string;
};

async function crewRequest<T>(action: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const method = init?.method ?? "POST";
  const response = await fetch(`/api/crew/auth.php?action=${encodeURIComponent(action)}`, {
    method,
    credentials: "include",
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(init?.body ?? { action }) : undefined,
  });

  let payload: (T & ErrorBody) | null = null;
  try {
    payload = (await response.json()) as T & ErrorBody;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new CrewAuthError(
      payload?.error || "Die Anmeldung ist gerade nicht möglich. Bitte versuche es später erneut.",
      response.status,
      payload?.code ?? null
    );
  }

  if (!payload) {
    throw new CrewAuthError("Die Antwort des Servers war ungültig.", response.status, null);
  }

  return payload;
}

export function crewMe(): Promise<CrewUser | null> {
  return crewRequest<{ user: CrewUser | null }>("me", { method: "GET" }).then((result) => result.user);
}

export function crewRegister(body: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<ConfirmationDelivery> {
  return crewRequest<ConfirmationDelivery>("register", { body });
}

export function crewLogin(body: { email: string; password: string }): Promise<{ user: CrewUser }> {
  return crewRequest<{ user: CrewUser }>("login", { body });
}

export function crewLogout(): Promise<{ success: true }> {
  return crewRequest<{ success: true }>("logout", { body: {} });
}

export function crewConfirm(token: string): Promise<{ alreadyConfirmed: boolean }> {
  return crewRequest<{ alreadyConfirmed: boolean }>("confirm", { body: { token } });
}

export function crewResend(email: string): Promise<ConfirmationDelivery> {
  return crewRequest<ConfirmationDelivery>("resend", { body: { email } });
}
