import { describe, expect, it } from "vitest";
import { hashEmailToken } from "./_core/emailTokens";
import { hashPassword, verifyPassword } from "./_core/passwords";

describe("Passwörter", () => {
  it("speichert keinen Klartext und prüft das Passwort", () => {
    const password = "Nachtblau1";
    const stored = hashPassword(password);
    expect(stored).not.toContain(password);
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword("falsch", stored)).toBe(false);
    expect(verifyPassword(password, null)).toBe(false);
  });
});

describe("Bestätigungstoken", () => {
  it("speichert nur den Hash, nicht den Link-Token", () => {
    const raw = "geheimes-token";
    const hash = hashEmailToken(raw);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(raw);
    expect(hashEmailToken(raw)).toBe(hash);
  });
});
