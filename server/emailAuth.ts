import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import {
  EMAIL_NOT_VERIFIED,
  type ConfirmationDelivery,
  normalizeEmail,
  type LoginInput,
  type RegisterInput,
} from "@shared/emailAuth";
import type { User } from "../drizzle/schema";
import {
  consumeVerificationToken,
  createLocalUser,
  getUserByEmail,
  markUserSignedIn,
  replaceVerificationToken,
} from "./db";
import { resolveAppOrigin } from "./_core/appOrigin";
import { createEmailVerificationToken, hashEmailToken } from "./_core/emailTokens";
import { ENV } from "./_core/env";
import { isSmtpConfigured, sendVerificationEmail } from "./_core/mail";
import { hashPassword, verifyPassword } from "./_core/passwords";

const INVALID_LOGIN = "E-Mail oder Passwort ist falsch.";
const INVALID_TOKEN = "Der Bestätigungslink ist ungültig oder abgelaufen.";

function databaseError(error: unknown): never {
  console.error("[Auth] Datenbankfehler", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Die Anmeldung ist gerade nicht möglich. Bitte versuche es später erneut.",
  });
}

async function deliverConfirmation(user: User, origin: string): Promise<ConfirmationDelivery> {
  const token = createEmailVerificationToken();
  const confirmUrl = `${origin}/email-bestaetigen?token=${encodeURIComponent(token.raw)}`;

  try {
    await replaceVerificationToken(user.id, token.hash, token.expiresAt);
  } catch (error) {
    databaseError(error);
  }

  let emailSent = false;
  if (isSmtpConfigured()) {
    try {
      emailSent = await sendVerificationEmail({
        to: user.email ?? "",
        confirmUrl,
      });
    } catch (error) {
      console.error("[E-Mail] Versand fehlgeschlagen", error);
      emailSent = false;
    }
  }

  if (!emailSent) {
    console.info(
      `[E-Mail] SMTP nicht konfiguriert oder Versand fehlgeschlagen. Bestätigungslink für ${user.email}: ${confirmUrl}`
    );
  }

  return {
    pendingConfirmation: true,
    emailSent,
    devConfirmationUrl: !emailSent && !ENV.isProduction ? confirmUrl : null,
  };
}

export async function registerWithPassword(
  input: RegisterInput,
  req: Request
): Promise<ConfirmationDelivery> {
  const email = normalizeEmail(input.email);
  let existing: User | undefined;
  try {
    existing = await getUserByEmail(email);
  } catch (error) {
    databaseError(error);
  }

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Zu dieser E-Mail gibt es bereits ein Konto. Melde dich an oder fordere einen neuen Bestätigungslink an.",
    });
  }

  const openId = `local_${randomBytes(16).toString("hex")}`;
  let user: User;
  try {
    user = await createLocalUser({
      openId,
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Duplicate") || message.includes("users_email_unique")) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Zu dieser E-Mail gibt es bereits ein Konto. Melde dich an oder fordere einen neuen Bestätigungslink an.",
      });
    }
    databaseError(error);
  }

  return deliverConfirmation(user, resolveAppOrigin(req));
}

export async function loginWithPassword(input: LoginInput): Promise<User> {
  const email = normalizeEmail(input.email);
  let user: User | undefined;
  try {
    user = await getUserByEmail(email);
  } catch (error) {
    databaseError(error);
  }

  const passwordOk = verifyPassword(input.password, user?.passwordHash);
  const isPasswordAccount = Boolean(user && user.loginMethod === "password" && user.passwordHash);
  if (!user || !isPasswordAccount || !passwordOk) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN });
  }

  if (!user.emailVerified) {
    throw new TRPCError({ code: "FORBIDDEN", message: EMAIL_NOT_VERIFIED });
  }

  try {
    await markUserSignedIn(user.id);
  } catch (error) {
    console.error("[Auth] lastSignedIn konnte nicht gesetzt werden", error);
  }

  return user;
}

export async function confirmEmailAddress(token: string): Promise<{ alreadyConfirmed: boolean }> {
  const hash = hashEmailToken(token.trim());
  let result: "confirmed" | "already" | "invalid";
  try {
    result = await consumeVerificationToken(hash);
  } catch (error) {
    databaseError(error);
  }

  if (result === "invalid") {
    throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_TOKEN });
  }

  return { alreadyConfirmed: result === "already" };
}

export async function resendConfirmationEmail(
  emailInput: string,
  req: Request
): Promise<ConfirmationDelivery> {
  const email = normalizeEmail(emailInput);
  let user: User | undefined;
  try {
    user = await getUserByEmail(email);
  } catch (error) {
    databaseError(error);
  }

  if (!user || user.loginMethod !== "password" || !user.passwordHash || user.emailVerified) {
    return {
      pendingConfirmation: true,
      emailSent: false,
      devConfirmationUrl: null,
    };
  }

  return deliverConfirmation(user, resolveAppOrigin(req));
}
