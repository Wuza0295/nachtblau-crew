import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/** Vergleichswert, damit fehlende Konten ähnlich lange brauchen wie falsche Passwörter. */
const DUMMY_PASSWORD_HASH = hashPassword("nachtblau-dummy-password");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  const actual = storedHash && storedHash.length > 0 ? storedHash : DUMMY_PASSWORD_HASH;
  const parts = actual.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) {
    return false;
  }
  const derived = scryptSync(password, parts[1], KEY_LENGTH);
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length !== derived.length) return false;
  const matches = timingSafeEqual(expected, derived);
  return Boolean(storedHash) && matches;
}
