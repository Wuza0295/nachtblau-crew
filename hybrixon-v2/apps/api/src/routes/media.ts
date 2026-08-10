import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
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
import { cdnUrl, db, mediaQueue, s3 } from "../services.js";

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoMimes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const assetParams = z.object({ id: z.uuid() });
const partParams = z.object({
  id: z.uuid(),
  partNumber: z.coerce.number().int().min(1).max(10_000),
});

export function serializeMedia(asset: MediaAsset): ApiMedia {
  return {
    id: asset.id,
    kind: asset.kind,
    status: asset.status,
    mime: asset.mime,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationSeconds,
    originalUrl: cdnUrl(asset.optimizedKey ?? asset.objectKey),
    posterUrl: cdnUrl(asset.posterKey),
    playbackUrl: cdnUrl(asset.hlsManifestKey ?? asset.optimizedKey ?? asset.objectKey),
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
