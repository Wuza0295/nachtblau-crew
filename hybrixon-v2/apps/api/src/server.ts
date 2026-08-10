import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { ZodError } from "zod";
import { config, corsOrigins } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { deviceRoutes } from "./routes/devices.js";
import { mediaRoutes } from "./routes/media.js";
import { postRoutes } from "./routes/posts.js";
import {
  closeServices,
  pool,
  redis,
  s3,
} from "./services.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "development" ? "debug" : "info",
    redact: ["req.headers.authorization", "req.headers.cookie"],
  },
  bodyLimit: 1_048_576,
  trustProxy: true,
  requestIdHeader: "x-request-id",
});

await app.register(cookie);
await app.register(jwt, { secret: config.JWT_SECRET });
await app.register(rateLimit, {
  max: 300,
  timeWindow: "1 minute",
  redis,
});
await app.register(cors, {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin nicht erlaubt"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  exposedHeaders: ["etag", "x-request-id"],
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: "Eingaben sind ungültig.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  const known = error instanceof Error ? error : new Error(String(error));
  const withStatus = known as Error & { statusCode?: number };
  const status = typeof withStatus.statusCode === "number" ? withStatus.statusCode : 500;
  if (status >= 500) request.log.error(known);
  return reply.code(status).send({
    error: status >= 500 ? "Interner Serverfehler." : known.message,
    requestId: request.id,
  });
});

app.get("/v2/health", async (_request, reply) => {
  const started = performance.now();
  await Promise.all([
    pool.query("select 1"),
    redis.ping(),
  ]);
  return reply.send({
    ok: true,
    version: "2.0.0",
    database: "postgresql",
    queue: "redis",
    storage: "s3",
    latencyMs: Math.round(performance.now() - started),
    checkedAt: new Date().toISOString(),
  });
});

await app.register(authRoutes, { prefix: "/v2" });
await app.register(postRoutes, { prefix: "/v2" });
await app.register(mediaRoutes, { prefix: "/v2" });
await app.register(deviceRoutes, { prefix: "/v2" });

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }));
  }
  await s3.send(new PutBucketCorsCommand({
    Bucket: config.S3_BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD", "PUT"],
        AllowedOrigins: corsOrigins,
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3_600,
      }],
    },
  }));
}

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "graceful shutdown");
  await app.close();
  await closeServices();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

try {
  await ensureBucket();
  await app.listen({ host: "0.0.0.0", port: config.PORT });
} catch (error) {
  app.log.fatal(error);
  await closeServices();
  process.exit(1);
}

export { app };
