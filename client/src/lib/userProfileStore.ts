/** Trading profile required before buy/sell (Cardmarket-style). */

export interface TradingProfile {
  userId: number;
  displayName: string;
  country: string;
  city: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const KEY = "autic-trading-profile";

function profilesMap(): Record<string, TradingProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, TradingProfile>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, TradingProfile>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getTradingProfile(userId: number | undefined | null): TradingProfile | null {
  if (!userId) return null;
  return profilesMap()[String(userId)] ?? null;
}

export function isTradingProfileComplete(profile: TradingProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.displayName.trim().length >= 3 &&
    profile.country.trim().length >= 2 &&
    profile.city.trim().length >= 2
  );
}

export function saveTradingProfile(
  userId: number,
  input: { displayName: string; country: string; city: string; avatarUrl?: string }
): TradingProfile {
  const map = profilesMap();
  const existing = map[String(userId)];
  const now = new Date().toISOString();
  const profile: TradingProfile = {
    userId,
    displayName: input.displayName.trim(),
    country: input.country.trim().toUpperCase(),
    city: input.city.trim(),
    avatarUrl: input.avatarUrl || existing?.avatarUrl,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (!isTradingProfileComplete(profile)) {
    throw new Error("Bitte Benutzername, Land und Ort vollständig ausfüllen.");
  }
  map[String(userId)] = profile;
  writeMap(map);
  return profile;
}

export const COUNTRY_OPTIONS = [
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
  { value: "NL", label: "Niederlande" },
  { value: "BE", label: "Belgien" },
  { value: "FR", label: "Frankreich" },
  { value: "IT", label: "Italien" },
  { value: "ES", label: "Spanien" },
  { value: "PL", label: "Polen" },
  { value: "CZ", label: "Tschechien" },
  { value: "OTHER", label: "Andere" },
] as const;
