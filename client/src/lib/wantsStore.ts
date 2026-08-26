/** Wants / Merkliste (Cardmarket Wants List inspired). */

const KEY = "autic-wants-v1";

const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeWants(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getWantsVersion() {
  return version;
}

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  emit();
}

export function getWants(): string[] {
  return read();
}

export function isWanted(cardId: string): boolean {
  return read().includes(cardId);
}

export function toggleWant(cardId: string): boolean {
  const ids = read();
  const idx = ids.indexOf(cardId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    write(ids);
    return false;
  }
  ids.unshift(cardId);
  write(ids);
  return true;
}

export function removeWant(cardId: string) {
  write(read().filter((id) => id !== cardId));
}
