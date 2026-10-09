import { createHash, randomBytes } from "node:crypto";
import { EMAIL_VERIFICATION_TTL_MS } from "@shared/emailAuth";

export function hashEmailToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createEmailVerificationToken(now = Date.now()): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = randomBytes(32).toString("base64url");
  return {
    raw,
    hash: hashEmailToken(raw),
    expiresAt: new Date(now + EMAIL_VERIFICATION_TTL_MS),
  };
}
