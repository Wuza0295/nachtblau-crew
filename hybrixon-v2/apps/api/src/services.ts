import { S3Client } from "@aws-sdk/client-s3";
import { Queue } from "bullmq";
import { drizzle } from "drizzle-orm/node-postgres";
import { Redis } from "ioredis";
import pg from "pg";
import { config } from "./config.js";
import * as schema from "./db/schema.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
});

export const db = drizzle(pool, { schema });

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const mediaQueue = new Queue("media-transcode", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 2_000,
  },
});

export const s3 = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  forcePathStyle: config.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
});

export function cdnUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return `${config.CDN_BASE_URL.replace(/\/+$/, "")}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function closeServices(): Promise<void> {
  await Promise.allSettled([
    mediaQueue.close(),
    redis.quit(),
    pool.end(),
  ]);
}
