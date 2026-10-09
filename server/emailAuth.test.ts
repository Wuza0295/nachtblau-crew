import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { TRPCError } from "@trpc/server";
import { EMAIL_NOT_VERIFIED, loginSchema, registerSchema } from "@shared/emailAuth";
import type { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";

const mocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createLocalUser: vi.fn(),
  replaceVerificationToken: vi.fn(),
  consumeVerificationToken: vi.fn(),
  markUserSignedIn: vi.fn(),
  sendVerificationEmail: vi.fn(),
  isSmtpConfigured: vi.fn(),
}));

vi.mock("./db", () => ({
  getUserByEmail: mocks.getUserByEmail,
  createLocalUser: mocks.createLocalUser,
  replaceVerificationToken: mocks.replaceVerificationToken,
  consumeVerificationToken: mocks.consumeVerificationToken,
  markUserSignedIn: mocks.markUserSignedIn,
}));

vi.mock("./_core/mail", () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
  isSmtpConfigured: mocks.isSmtpConfigured,
}));

import { confirmEmailAddress, loginWithPassword, registerWithPassword, resendConfirmationEmail } from "./emailAuth";

const req = {
  protocol: "http",
  headers: { host: "localhost:3000" },
} as Request;

function user(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    openId: "local_test",
    name: "Ada",
    email: "ada@example.com",
    loginMethod: "password",
    role: "user",
    avatar: null,
    bio: null,
    handle: null,
    passwordHash: "scrypt$salt$hash",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe("Validierung", () => {
  it("erklärt Registrierungsfehler auf Deutsch", () => {
    const parsed = registerSchema.safeParse({
      name: "",
      email: "keine-mail",
      password: "kurz",
      passwordConfirm: "anders",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Bitte einen Namen eingeben.");
      expect(messages).toContain("Bitte eine gültige E-Mail-Adresse eingeben.");
      expect(messages).toContain("Das Passwort muss mindestens 8 Zeichen lang sein.");
      expect(messages).toContain("Die Passwörter stimmen nicht überein.");
    }
  });

  it("verlangt eine E-Mail bei der Anmeldung", () => {
    const parsed = loginSchema.safeParse({ email: "", password: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining(["Bitte eine E-Mail-Adresse eingeben.", "Bitte ein Passwort eingeben."])
      );
    }
  });
});

describe("E-Mail-Konto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSmtpConfigured.mockReturnValue(false);
    mocks.replaceVerificationToken.mockResolvedValue(undefined);
    mocks.markUserSignedIn.mockResolvedValue(undefined);
  });

  it("legt ein unbestätigtes Konto an und zeigt den Link nur ohne SMTP in der Entwicklung", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.createLocalUser.mockImplementation(async (data) => user({ passwordHash: data.passwordHash, email: data.email, name: data.name }));

    const result = await registerWithPassword(
      {
        name: "Ada Lovelace",
        email: "Ada@Example.com",
        password: "Nachtblau1",
        passwordConfirm: "Nachtblau1",
      },
      req
    );

    expect(mocks.createLocalUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        name: "Ada Lovelace",
      })
    );
    const stored = mocks.createLocalUser.mock.calls[0][0] as { passwordHash: string };
    expect(stored.passwordHash).not.toContain("Nachtblau1");
    expect(result.emailSent).toBe(false);
    expect(result.pendingConfirmation).toBe(true);
    expect(result.devConfirmationUrl).toContain("http://localhost:3000/email-bestaetigen?token=");
    const raw = new URL(result.devConfirmationUrl ?? "").searchParams.get("token") ?? "";
    const savedHash = mocks.replaceVerificationToken.mock.calls[0][1] as string;
    expect(savedHash).not.toBe(raw);
    expect(savedHash).toHaveLength(64);
  });

  it("behauptet keinen Versand, wenn SMTP fehlt", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.createLocalUser.mockResolvedValue(user());
    const result = await registerWithPassword(
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Nachtblau1",
        passwordConfirm: "Nachtblau1",
      },
      req
    );
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
    expect(result.emailSent).toBe(false);
  });

  it("verschickt die Mail, wenn SMTP konfiguriert ist, und gibt den Link nicht an den Client", async () => {
    mocks.isSmtpConfigured.mockReturnValue(true);
    mocks.sendVerificationEmail.mockResolvedValue(true);
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.createLocalUser.mockResolvedValue(user());

    const result = await registerWithPassword(
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Nachtblau1",
        passwordConfirm: "Nachtblau1",
      },
      req
    );

    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com" })
    );
    expect(result.emailSent).toBe(true);
    expect(result.devConfirmationUrl).toBeNull();
  });

  it("lehnt eine bereits vergebene E-Mail ab", async () => {
    mocks.getUserByEmail.mockResolvedValue(user());
    await expect(
      registerWithPassword(
        {
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: "Nachtblau1",
          passwordConfirm: "Nachtblau1",
        },
        req
      )
    ).rejects.toMatchObject({
      message: expect.stringContaining("bereits ein Konto"),
    });
  });

  it("lehnt die Anmeldung ohne bestätigte E-Mail ab", async () => {
    const { hashPassword } = await import("./_core/passwords");
    const passwordHash = hashPassword("Nachtblau1");
    mocks.getUserByEmail.mockResolvedValue(user({ passwordHash, emailVerified: false }));

    await expect(
      loginWithPassword({ email: "ada@example.com", password: "Nachtblau1" })
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      loginWithPassword({ email: "ada@example.com", password: "Nachtblau1" })
    ).rejects.toMatchObject({ message: EMAIL_NOT_VERIFIED });
  });

  it("meldet ein bestätigtes Konto an", async () => {
    const { hashPassword } = await import("./_core/passwords");
    const passwordHash = hashPassword("Nachtblau1");
    mocks.getUserByEmail.mockResolvedValue(user({ passwordHash, emailVerified: true }));

    const signedIn = await loginWithPassword({ email: "ada@example.com", password: "Nachtblau1" });
    expect(signedIn.emailVerified).toBe(true);
    expect(mocks.markUserSignedIn).toHaveBeenCalledWith(7);
  });

  it("verrät bei einem falschen Passwort nicht, ob die E-Mail fehlt", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    await expect(
      loginWithPassword({ email: "ada@example.com", password: "Nachtblau1" })
    ).rejects.toMatchObject({ message: "E-Mail oder Passwort ist falsch." });
  });

  it("bestätigt einen gültigen Token und lehnt einen verbrauchten ab", async () => {
    mocks.consumeVerificationToken.mockResolvedValueOnce("confirmed");
    await expect(confirmEmailAddress("token-123")).resolves.toEqual({ alreadyConfirmed: false });

    mocks.consumeVerificationToken.mockResolvedValueOnce("invalid");
    await expect(confirmEmailAddress("token-123")).rejects.toMatchObject({
      message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
    });
  });

  it("erzeugt für ein unbekanntes Konto keinen sichtbaren Link", async () => {
    mocks.getUserByEmail.mockResolvedValue(undefined);
    const result = await resendConfirmationEmail("niemand@example.com", req);
    expect(result.devConfirmationUrl).toBeNull();
    expect(result.emailSent).toBe(false);
  });
});

describe("Sitzungs-Cookie", () => {
  it("bleibt auf HTTP mit SameSite=Lax speicherbar", () => {
    expect(getSessionCookieOptions(req)).toMatchObject({
      sameSite: "lax",
      secure: false,
      httpOnly: true,
      path: "/",
    });
  });
});
