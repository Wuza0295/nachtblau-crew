/** Recently viewed cards. */

const KEY = "autic-recent-v1";
const MAX = 12;

export function pushRecent(cardId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    let ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    ids = [cardId, ...ids.filter((id) => id !== cardId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
