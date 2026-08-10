import { eq, ilike, or } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  type AuthResponse,
} from "@hybrixon/contracts";
import {
  hashPassword,
  issueTokens,
  publicUser,
  requireAuth,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPasswordAndUpgrade,
} from "../auth.js";
import { config } from "../config.js";
import { users } from "../db/schema.js";
import { db } from "../services.js";

const refreshSchema = z.object({ refreshToken: z.string().min(40).optional() });

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie("hybrixon_refresh", token, {
    path: "/v2/auth",
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: config.REFRESH_TOKEN_DAYS * 86_400,
  });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", {
    config: { rateLimit: { max: 8, timeWindow: "1 hour" } },
  }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(or(
        ilike(users.username, input.username),
        ilike(users.email, input.email),
      ))
      .limit(1);
    if (existing.length) {
      return reply.code(409).send({ error: "Benutzername oder E-Mail ist bereits vergeben." });
    }
    const [user] = await db.insert(users).values({
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      birthdate: input.birthdate,
      displayName: input.username,
    }).returning();
    if (!user) throw new Error("Benutzer konnte nicht erstellt werden.");
    const tokens = await issueTokens(app, user, request.headers["user-agent"]);
    setRefreshCookie(reply, tokens.refreshToken);
    const response: AuthResponse = {
      user: publicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    return reply.code(201).send(response);
  });

  app.post("/auth/login", {
    config: { rateLimit: { max: 12, timeWindow: "15 minutes" } },
  }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const [user] = await db.select().from(users).where(or(
      ilike(users.username, input.login),
      ilike(users.email, input.login),
    )).limit(1);
    if (!user || !(await verifyPasswordAndUpgrade(user, input.password))) {
      return reply.code(401).send({ error: "Anmeldedaten sind falsch." });
    }
    const tokens = await issueTokens(app, user, request.headers["user-agent"]);
    setRefreshCookie(reply, tokens.refreshToken);
    const response: AuthResponse = {
      user: publicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    return response;
  });

  app.post("/auth/refresh", async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const token = body.refreshToken ?? request.cookies.hybrixon_refresh;
    if (!token) return reply.code(401).send({ error: "Refresh-Token fehlt." });
    const rotated = await rotateRefreshToken(app, token, request.headers["user-agent"]);
    if (!rotated) return reply.code(401).send({ error: "Sitzung ist abgelaufen." });
    setRefreshCookie(reply, rotated.refreshToken);
    const response: AuthResponse = {
      user: publicUser(rotated.user),
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };
    return response;
  });

  app.post("/auth/logout", async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const token = body.refreshToken ?? request.cookies.hybrixon_refresh;
    if (token) await revokeRefreshToken(token);
    reply.clearCookie("hybrixon_refresh", { path: "/v2/auth" });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, request.user.sub)).limit(1);
    if (!user) return reply.code(404).send({ error: "Benutzer nicht gefunden." });
    return { user: publicUser(user) };
  });
}
