/** Local buyer/admin accounts for static hosting (no demo mode). */

export type LocalRole = "user" | "admin";

export interface LocalAccount {
  id: number;
  email: string;
  name: string;
  /** SHA-256 hex of password (browser SubtleCrypto) */
  passwordHash: string;
  role: LocalRole;
  createdAt: string;
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  openId: string;
  loginMethod: "local" | "oauth";
  role: LocalRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

const ACCOUNTS_KEY = "autic-accounts-v1";
const SESSION_KEY = "autic-session-v1";

/** Seed admin – only sellers; buyers register themselves. */
const SEED_ADMIN = {
  email: "admin@autic-treasures.com",
  name: "Autic Admin",
  /** password: AuticAdmin2026! */
  passwordHash:
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // placeholder overwritten on boot
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function nextId(accounts: LocalAccount[]): number {
  return accounts.reduce((max, a) => Math.max(max, a.id), 100) + 1;
}

let seedPromise: Promise<void> | null = null;

/** Ensure default admin exists (idempotent). */
export function ensureSeedAdmin(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!seedPromise) {
    seedPromise = (async () => {
      const accounts = readAccounts();
      const existing = accounts.find(
        (a) => a.email.toLowerCase() === SEED_ADMIN.email
      );
      const hash = await sha256("AuticAdmin2026!");
      if (!existing) {
        accounts.push({
          id: 1,
          email: SEED_ADMIN.email,
          name: SEED_ADMIN.name,
          passwordHash: hash,
          role: "admin",
          createdAt: new Date().toISOString(),
        });
        writeAccounts(accounts);
      } else if (existing.role !== "admin") {
        existing.role = "admin";
        existing.passwordHash = hash;
        writeAccounts(accounts);
      }
    })();
  }
  return seedPromise;
}

function toSession(account: LocalAccount): SessionUser {
  const now = new Date();
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    openId: `local:${account.id}`,
    loginMethod: "local",
    role: account.role,
    createdAt: new Date(account.createdAt),
    updatedAt: now,
    lastSignedIn: now,
  };
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionUser & {
      createdAt: string;
      updatedAt: string;
      lastSignedIn: string;
    };
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      lastSignedIn: new Date(s.lastSignedIn),
    };
  } catch {
    return null;
  }
}

function writeSession(user: SessionUser | null) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function registerAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<SessionUser> {
  await ensureSeedAdmin();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email.includes("@") || email.length < 5) {
    throw new Error("Bitte eine gültige E-Mail angeben");
  }
  if (name.length < 2) throw new Error("Bitte einen Namen angeben");
  if (input.password.length < 8) {
    throw new Error("Passwort mindestens 8 Zeichen");
  }

  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    throw new Error("Diese E-Mail ist bereits registriert");
  }

  const account: LocalAccount = {
    id: nextId(accounts),
    email,
    name,
    passwordHash: await sha256(input.password),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  writeAccounts(accounts);
  const session = toSession(account);
  writeSession(session);
  return session;
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  await ensureSeedAdmin();
  const email = input.email.trim().toLowerCase();
  const accounts = readAccounts();
  const account = accounts.find((a) => a.email === email);
  if (!account) throw new Error("E-Mail oder Passwort falsch");
  const hash = await sha256(input.password);
  if (hash !== account.passwordHash) {
    throw new Error("E-Mail oder Passwort falsch");
  }
  const session = toSession(account);
  writeSession(session);
  return session;
}

export function logoutLocal() {
  writeSession(null);
}

export function isAdminUser(user: { role?: string } | null | undefined): boolean {
  return user?.role === "admin";
}

const listeners = new Set<() => void>();
let authVersion = 0;

export function subscribeAuth(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAuthVersion() {
  return authVersion;
}

export function emitAuthChange() {
  authVersion += 1;
  listeners.forEach((l) => l());
}

/** Wrap login/register to notify subscribers. */
export async function registerAndNotify(
  input: Parameters<typeof registerAccount>[0]
) {
  const user = await registerAccount(input);
  emitAuthChange();
  return user;
}

export async function loginAndNotify(input: Parameters<typeof loginAccount>[0]) {
  const user = await loginAccount(input);
  emitAuthChange();
  return user;
}

export function logoutAndNotify() {
  logoutLocal();
  emitAuthChange();
}
