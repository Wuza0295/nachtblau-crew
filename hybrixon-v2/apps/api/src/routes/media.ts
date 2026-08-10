import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import path from "node:path";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  MULTIPART_PART_BYTES,
  completeUploadSchema,
  initiateUploadSchema,
  type ApiMedia,
} from "@hybrixon/contracts";
import { requireAuth } from "../auth.js";
import { config } from "../config.js";
import { mediaAssets, type MediaAsset } from "../db/schema.js";
import { db, mediaQueue, s3 } from "../services.js";

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoMimes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const assetParams = z.object({ id: z.uuid() });
const partParams = z.object({
  id: z.uuid(),
  partNumber: z.coerce.number().int().min(1).max(10_000),
});
const mediaContentQuery = z.object({
  variant: z.enum(["original", "poster", "playback", "segment"]),
  expires: z.coerce.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
  name: z.string().regex(/^segment_[0-9]{5}\.ts$/).optional(),
});

type MediaVariant = z.infer<typeof mediaContentQuery>["variant"];

function mediaCapability(
  assetId: string,
  variant: MediaVariant,
  expires: number,
  name?: string,
): string {
  return `${assetId}:${variant}:${expires}:${name ?? ""}`;
}

function signMediaCapability(
  assetId: string,
  variant: MediaVariant,
  expires: number,
  name?: string,
): string {
  return createHmac("sha256", config.JWT_SECRET)
    .update(mediaCapability(assetId, variant, expires, name))
    .digest("hex");
}

function mediaAccessUrl(
  assetId: string,
  variant: MediaVariant,
  expires = Math.floor(Date.now() / 1_000) + 7_200,
  name?: string,
): string {
  const url = new URL(
    `${config.PUBLIC_API_URL.replace(/\/+$/, "")}/media/${assetId}/content`,
  );
  url.searchParams.set("variant", variant);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signMediaCapability(assetId, variant, expires, name));
  if (name) url.searchParams.set("name", name);
  return url.toString();
}

function validMediaCapability(
  assetId: string,
  variant: MediaVariant,
  expires: number,
  signature: string,
  name?: string,
): boolean {
  const now = Math.floor(Date.now() / 1_000);
  if (expires <= now || expires > now + 7_300) return false;
  const expected = Buffer.from(signMediaCapability(assetId, variant, expires, name), "hex");
  const provided = Buffer.from(signature, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function serializeMedia(asset: MediaAsset): ApiMedia {
  const available = asset.status !== "initiated" && asset.status !== "failed";
  return {
    id: asset.id,
    kind: asset.kind,
    status: asset.status,
    mime: asset.mime,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationSeconds,
    originalUrl: available ? mediaAccessUrl(asset.id, "original") : null,
    posterUrl: asset.posterKey ? mediaAccessUrl(asset.id, "poster") : null,
    playbackUrl: available ? mediaAccessUrl(asset.id, "playback") : null,
  };
}

async function ownedAsset(id: string, ownerId: number): Promise<MediaAsset | undefined> {
  const [asset] = await db.select().from(mediaAssets).where(and(
    eq(mediaAssets.id, id),
    eq(mediaAssets.ownerId, ownerId),
  )).limit(1);
  return asset;
}

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  app.get("/media/:id/content", async (request, reply) => {
    const { id } = assetParams.parse(request.params);
    const query = mediaContentQuery.parse(request.query);
    if (!validMediaCapability(
      id,
      query.variant,
      query.expires,
      query.signature,
      query.name,
    )) {
      return reply.code(403).send({ error: "Medienlink ist ungültig oder abgelaufen." });
    }
    const [asset] = await db.select().from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);
    if (!asset || asset.status === "failed" || asset.status === "initiated") {
      return reply.code(404).send({ error: "Medium ist nicht verfügbar." });
    }

    if (query.variant === "playback" && asset.hlsManifestKey) {
      const result = await s3.send(new GetObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: asset.hlsManifestKey,
      }));
      if (!result.Body) return reply.code(404).send({ error: "Stream fehlt." });
      const manifest = await result.Body.transformToString();
      const rewritten = manifest.split("\n").map((line) => {
        const value = line.trim();
        if (!value || value.startsWith("#")) return line;
        const name = path.basename(value);
        if (!/^segment_[0-9]{5}\.ts$/.test(name)) return line;
        return mediaAccessUrl(asset.id, "segment", query.expires, name);
      }).join("\n");
      return reply
        .header("Cache-Control", "private, max-age=60")
        .type("application/vnd.apple.mpegurl")
        .send(rewritten);
    }

    let key: string | null;
    if (query.variant === "poster") {
      key = asset.posterKey;
    } else if (query.variant === "segment") {
      key = asset.hlsManifestKey && query.name
        ? `${path.posix.dirname(asset.hlsManifestKey)}/${query.name}`
        : null;
    } else {
      key = asset.kind === "image"
        ? asset.optimizedKey ?? asset.objectKey
        : asset.objectKey;
    }
    if (!key) return reply.code(404).send({ error: "Medienvariante fehlt." });

    const remaining = Math.max(1, query.expires - Math.floor(Date.now() / 1_000));
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
      ResponseContentType: query.variant === "poster"
        ? "image/jpeg"
        : query.variant === "segment"
          ? "video/mp2t"
          : asset.mime,
    }), { expiresIn: Math.min(3_600, remaining) });
    return reply
      .header("Cache-Control", "private, no-store")
      .redirect(url);
  });

  app.post("/media/multipart", { preHandler: requireAuth }, async (request, reply) => {
    const input = initiateUploadSchema.parse(request.body);
    const allowed = input.kind === "video" ? videoMimes : imageMimes;
    if (!allowed.has(input.mime.toLowerCase())) {
      return reply.code(415).send({ error: "Dateityp wird nicht unterstützt." });
    }

    const id = randomUUID();
    const safeExt = path.extname(input.filename).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 10);
    const objectKey = `users/${request.user.sub}/${id}/source${safeExt || ""}`;
    const multipart = await s3.send(new CreateMultipartUploadCommand({
      Bucket: config.S3_BUCKET,
      Key: objectKey,
      ContentType: input.mime,
      Metadata: {
        owner: String(request.user.sub),
        asset: id,
        original: encodeURIComponent(input.filename).slice(0, 1_000),
      },
    }));
    if (!multipart.UploadId) throw new Error("S3 hat keine Upload-ID geliefert.");

    const [asset] = await db.insert(mediaAssets).values({
      id,
      ownerId: request.user.sub,
      kind: input.kind,
      mime: input.mime.toLowerCase(),
      originalName: input.filename,
      objectKey,
      uploadId: multipart.UploadId,
      size: input.size,
      checksumSha256: input.checksumSha256,
    }).returning();
    if (!asset) throw new Error("Upload konnte nicht angelegt werden.");
    return reply.code(201).send({
      media: serializeMedia(asset),
      uploadId: multipart.UploadId,
      partSize: MULTIPART_PART_BYTES,
    });
  });

  app.post("/media/:id/parts/:partNumber", { preHandler: requireAuth }, async (request, reply) => {
    const params = partParams.parse(request.params);
    const asset = await ownedAsset(params.id, request.user.sub);
    if (!asset) return reply.code(404).send({ error: "Upload nicht gefunden." });
    if (asset.status !== "initiated" || !asset.uploadId) {
      return reply.code(409).send({ error: "Upload ist nicht mehr offen." });
    }
    const command = new UploadPartCommand({
      Bucket: config.S3_BUCKET,
      Key: asset.objectKey,
      UploadId: asset.uploadId,
      PartNumber: params.partNumber,
      ContentLength: undefined,
    });
    return {
      url: await getSignedUrl(s3, command, { expiresIn: 900 }),
      expiresIn: 900,
    };
  });

  app.post("/media/:id/complete", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = assetParams.parse(request.params);
    const input = completeUploadSchema.parse(request.body);
    const asset = await ownedAsset(id, request.user.sub);
    if (!asset) return reply.code(404).send({ error: "Upload nicht gefunden." });
    if (asset.status !== "initiated" || !asset.uploadId) {
      return reply.code(409).send({ error: "Upload ist bereits abgeschlossen." });
    }
    await s3.send(new CompleteMultipartUploadCommand({
      Bucket: config.S3_BUCKET,
      Key: asset.objectKey,
      UploadId: asset.uploadId,
      MultipartUpload: {
        Parts: input.parts.map((part) => ({
          PartNumber: part.partNumber,
          ETag: part.etag.startsWith('"') ? part.etag : `"${part.etag}"`,
        })),
      },
    }));
    const [updated] = await db.update(mediaAssets).set({
      status: "processing",
      uploadId: null,
      updatedAt: new Date(),
    }).where(eq(mediaAssets.id, id)).returning();
    await mediaQueue.add("transcode", { assetId: id }, { jobId: id });
    if (!updated) throw new Error("Uploadstatus konnte nicht gespeichert werden.");
    return reply.code(202).send({ media: serializeMedia(updated) });
  });

  app.post("/media/:id/abort", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = assetParams.parse(request.params);
    const asset = await ownedAsset(id, request.user.sub);
    if (!asset) return reply.code(404).send({ error: "Upload nicht gefunden." });
    if (asset.uploadId) {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: config.S3_BUCKET,
        Key: asset.objectKey,
        UploadId: asset.uploadId,
      })).catch(() => undefined);
    }
    await db.update(mediaAssets).set({
      status: "failed",
      uploadId: null,
      error: "Vom Benutzer abgebrochen",
      updatedAt: new Date(),
    }).where(eq(mediaAssets.id, id));
    return { ok: true };
  });

  app.get("/media/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = assetParams.parse(request.params);
    const asset = await ownedAsset(id, request.user.sub);
    if (!asset) return reply.code(404).send({ error: "Medium nicht gefunden." });
    return { media: serializeMedia(asset) };
  });
}
