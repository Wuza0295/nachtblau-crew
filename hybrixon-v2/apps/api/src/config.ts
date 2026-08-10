import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess(
  (value) => value === true || value === "true" || value === "1",
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  PUBLIC_API_URL: z.url().default("http://localhost:8080/v2"),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default("eu-central-1"),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: booleanFromEnv.default(true),
  CDN_BASE_URL: z.url(),
  MEDIA_TMP_DIR: z.string().default("/tmp/hybrixon-media"),
  MEDIA_HLS_SEGMENT_SECONDS: z.coerce.number().int().min(2).max(20).default(6),
  MEDIA_VIDEO_CRF: z.coerce.number().int().min(16).max(35).default(23),
  LEGACY_SQLITE_PATH: z.string().optional(),
  LEGACY_UPLOADS_PATH: z.string().optional(),
});

export const config = schema.parse(process.env);
export const corsOrigins = config.CORS_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
