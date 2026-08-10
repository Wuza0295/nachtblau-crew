import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { pushDevices } from "../db/schema.js";
import { db } from "../services.js";

const pushSchema = z.object({
  platform: z.enum(["android", "ios", "web"]),
  token: z.string().min(20).max(4_096),
});

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  app.post("/devices/push", { preHandler: requireAuth }, async (request, reply) => {
    const input = pushSchema.parse(request.body);
    const [device] = await db.insert(pushDevices).values({
      userId: request.user.sub,
      platform: input.platform,
      token: input.token,
    }).onConflictDoUpdate({
      target: pushDevices.token,
      set: {
        userId: request.user.sub,
        platform: input.platform,
        updatedAt: new Date(),
      },
    }).returning();
    return reply.code(201).send({ deviceId: device?.id });
  });

  app.delete("/devices/push", { preHandler: requireAuth }, async (request) => {
    const input = pushSchema.pick({ token: true }).parse(request.body);
    await db.delete(pushDevices).where(eq(pushDevices.token, input.token));
    return { ok: true };
  });
}
