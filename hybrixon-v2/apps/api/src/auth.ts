import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ApiUser } from "@hybrixon/contracts";
import { config } from "./config.js";
import { refreshSessions, type User, users } from "./db/schema.js";
import { cdnUrl, db } from "./services.js";

export type AccessClaims = {
  sub: number;
  username: string;
  role: "user" | "admin";
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessClaims;
    user: AccessClaims;
  }
}

export function publicUser(user: User): ApiUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role,
    avatarUrl: cdnUrl(user.avatarObjectKey),
    bio: user.bio,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPasswordAndUpgrade(
  user: User,
  password: string,
): Promise<boolean> {
  if (user.passwordHash.startsWith("$argon2")) {
    return argon2.verify(user.passwordHash, password);
  }
  // PHP password_hash() bcrypt strings use $2y$; bcryptjs expects $2b$.
  const legacy = user.passwordHash.replace(/^\$2y\$/, "$2b$");
  const valid = await bcrypt.compare(password, legacy);
  if (valid) {
    await db.update(users)
      .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }
  return valid;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokens(
  app: FastifyInstance,
  user: User,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = app.jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    { expiresIn: config.ACCESS_TOKEN_TTL },
  );
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 86_400_000);
  await db.insert(refreshSessions).values({
    userId: user.id,
    tokenHash: tokenHash(refreshToken),
    deviceName: deviceName?.slice(0, 160),
    expiresAt,
  });
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(
  app: FastifyInstance,
  refreshToken: string,
  deviceName?: string,
): Promise<{ user: User; accessToken: string; refreshToken: string } | null> {
  const [session] = await db.select()
    .from(refreshSessions)
    .where(and(
      eq(refreshSessions.tokenHash, tokenHash(refreshToken)),
      isNull(refreshSessions.revokedAt),
      gt(refreshSessions.expiresAt, new Date()),
    ))
    .limit(1);
  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return null;
  await db.update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(eq(refreshSessions.id, session.id));
  return { user, ...(await issueTokens(app, user, deviceName)) };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await db.update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(eq(refreshSessions.tokenHash, tokenHash(refreshToken)));
}

export async function requireAuth(request: FastifyRequest): Promise<void> {
  await request.jwtVerify();
}
