import "dotenv/config";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import pg from "pg";
import { z } from "zod";

const env = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default("eu-central-1"),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.string().default("true"),
  MEDIA_TMP_DIR: z.string().default(os.tmpdir()),
  MEDIA_HLS_SEGMENT_SECONDS: z.coerce.number().int().min(2).max(20).default(6),
  MEDIA_VIDEO_CRF: z.coerce.number().int().min(16).max(35).default(23),
}).parse(process.env);

const { Pool } = pg;
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE !== "false",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

type AssetRow = {
  id: string;
  owner_id: number;
  object_key: string;
  kind: "image" | "video";
  mime: string;
};

type Probe = {
  format?: { duration?: string };
  streams?: Array<{
    codec_type?: string;
    width?: number;
    height?: number;
  }>;
};

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + String(chunk)).slice(-8_000);
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exit ${code}: ${stderr}`));
    });
  });
}

async function probe(file: string): Promise<Probe> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      file,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe: ${stderr}`));
      try {
        resolve(JSON.parse(stdout) as Probe);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function download(key: string, destination: string): Promise<void> {
  const result = await s3.send(new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  }));
  if (!result.Body) throw new Error("S3 object body fehlt");
  await pipeline(result.Body as NodeJS.ReadableStream, createWriteStream(destination));
}

function contentType(file: string): string {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (file.endsWith(".ts")) return "video/mp2t";
  if (file.endsWith(".jpg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function uploadFile(file: string, key: string): Promise<void> {
  const bytes = await readFile(file);
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: contentType(file),
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

async function processAsset(asset: AssetRow): Promise<{
  posterKey: string | null;
  optimizedKey: string | null;
  hlsManifestKey: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}> {
  await mkdir(env.MEDIA_TMP_DIR, { recursive: true });
  const work = await mkdtemp(path.join(env.MEDIA_TMP_DIR, "hybrixon-"));
  const source = path.join(work, "source");
  try {
    await download(asset.object_key, source);
    const metadata = await probe(source);
    const videoStream = metadata.streams?.find((stream) => stream.codec_type === "video");
    const durationSeconds = metadata.format?.duration
      ? Math.max(0, Math.round(Number(metadata.format.duration)))
      : null;
    const base = `users/${asset.owner_id}/${asset.id}/derived`;

    if (asset.kind === "image") {
      const optimized = path.join(work, "image.webp");
      await run("ffmpeg", [
        "-y", "-v", "error", "-i", source,
        "-vf", "scale='min(2048,iw)':-2",
        "-quality", "82",
        optimized,
      ]);
      const optimizedKey = `${base}/image.webp`;
      await uploadFile(optimized, optimizedKey);
      return {
        posterKey: optimizedKey,
        optimizedKey,
        hlsManifestKey: null,
        durationSeconds: null,
        width: videoStream?.width ?? null,
        height: videoStream?.height ?? null,
      };
    }

    const poster = path.join(work, "poster.jpg");
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-ss", durationSeconds && durationSeconds > 2 ? "1" : "0",
      "-i", source,
      "-frames:v", "1",
      "-vf", "scale='min(1280,iw)':-2",
      "-q:v", "3",
      poster,
    ]);
    const hls = path.join(work, "hls");
    await mkdir(hls);
    await run("ffmpeg", [
      "-y", "-v", "error", "-i", source,
      "-vf", "scale='min(1280,iw)':-2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", String(env.MEDIA_VIDEO_CRF),
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-hls_time", String(env.MEDIA_HLS_SEGMENT_SECONDS),
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(hls, "segment_%05d.ts"),
      path.join(hls, "index.m3u8"),
    ]);

    const posterKey = `${base}/poster.jpg`;
    await uploadFile(poster, posterKey);
    for (const name of await readdir(hls)) {
      const file = path.join(hls, name);
      if ((await stat(file)).isFile()) {
        await uploadFile(file, `${base}/hls/${name}`);
      }
    }
    return {
      posterKey,
      optimizedKey: null,
      hlsManifestKey: `${base}/hls/index.m3u8`,
      durationSeconds,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const worker = new Worker<{ assetId: string }>(
  "media-transcode",
  async (job) => {
    const result = await pool.query<AssetRow>(
      `select id, owner_id, object_key, kind, mime
       from media_assets where id = $1 limit 1`,
      [job.data.assetId],
    );
    const asset = result.rows[0];
    if (!asset) throw new Error(`asset ${job.data.assetId} not found`);
    await pool.query(
      `update media_assets
       set status = 'processing', error = null, updated_at = now()
       where id = $1`,
      [asset.id],
    );
    try {
      const output = await processAsset(asset);
      await pool.query(
        `update media_assets set
          status = 'ready',
          poster_key = $2,
          optimized_key = $3,
          hls_manifest_key = $4,
          duration_seconds = $5,
          width = $6,
          height = $7,
          error = null,
          updated_at = now()
         where id = $1`,
        [
          asset.id,
          output.posterKey,
          output.optimizedKey,
          output.hlsManifestKey,
          output.durationSeconds,
          output.width,
          output.height,
        ],
      );
      return output;
    } catch (error) {
      await pool.query(
        `update media_assets
         set status = 'failed', error = $2, updated_at = now()
         where id = $1`,
        [asset.id, error instanceof Error ? error.message.slice(0, 1_000) : "Unbekannter Fehler"],
      );
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: { max: 4, duration: 1_000 },
  },
);

worker.on("completed", (job) => console.info("media ready", job.id));
worker.on("failed", (job, error) => console.error("media failed", job?.id, error));

async function shutdown(): Promise<void> {
  await worker.close();
  await redis.quit();
  await pool.end();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
console.info("Hybrixon media worker ready");
