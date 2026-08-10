import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Upload } from "@aws-sdk/lib-storage";
import { config } from "./config.js";
import { closeServices, mediaQueue, pool, s3 } from "./services.js";

type LegacyRow = Record<string, unknown>;

if (!config.LEGACY_SQLITE_PATH || !config.LEGACY_UPLOADS_PATH) {
  throw new Error("LEGACY_SQLITE_PATH and LEGACY_UPLOADS_PATH are required");
}

const sqlite = new DatabaseSync(config.LEGACY_SQLITE_PATH, { readOnly: true });

function tableExists(name: string): boolean {
  return Boolean(sqlite.prepare(
    "select 1 from sqlite_master where type = 'table' and name = ?",
  ).get(name));
}

function rows(name: string): LegacyRow[] {
  if (!tableExists(name)) return [];
  return sqlite.prepare(`select * from "${name}"`).all() as LegacyRow[];
}

function dateValue(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  const normalized = String(value).includes("T")
    ? String(value)
    : `${String(value).replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function mimeFromPath(file: string): string {
  const ext = path.extname(file).toLowerCase();
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  }[ext] ?? "application/octet-stream";
}

async function uploadLegacy(
  relativePath: string,
  ownerId: number,
  assetId: string,
): Promise<{ key: string; size: number }> {
  const source = path.join(config.LEGACY_UPLOADS_PATH!, relativePath);
  if (!existsSync(source)) throw new Error(`Legacy-Datei fehlt: ${source}`);
  const key = `users/${ownerId}/${assetId}/source${path.extname(relativePath).toLowerCase()}`;
  await new Upload({
    client: s3,
    params: {
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: createReadStream(source),
      ContentType: mimeFromPath(source),
      CacheControl: "private, max-age=3600",
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024,
  }).done();
  return { key, size: statSync(source).size };
}

async function migrate(): Promise<void> {
  console.info("Migrating users…");
  for (const user of rows("users")) {
    const id = Number(user.id);
    await pool.query(
      `insert into users (
        id, username, email, password_hash, birthdate, display_name, bio, role,
        is_adult_verified, dm_privacy, legacy_id, created_at, updated_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$1,$11,$11)
      on conflict (legacy_id) do update set
        username = excluded.username,
        email = excluded.email,
        display_name = excluded.display_name,
        bio = excluded.bio,
        role = excluded.role,
        is_adult_verified = excluded.is_adult_verified,
        dm_privacy = excluded.dm_privacy,
        updated_at = now()`,
      [
        id,
        String(user.username),
        String(user.email).toLowerCase(),
        String(user.password_hash),
        String(user.birthdate),
        String(user.display_name || user.username),
        String(user.bio || ""),
        Number(user.is_admin) ? "admin" : "user",
        Boolean(user.age_verified_at),
        ["everyone", "friends", "followers", "none"].includes(String(user.privacy_dms))
          ? String(user.privacy_dms)
          : "everyone",
        dateValue(user.created_at),
      ],
    );
  }

  console.info("Migrating posts…");
  for (const post of rows("posts")) {
    await pool.query(
      `insert into posts (
        id, author_id, body, visibility, is_adult, legacy_id, created_at, updated_at
      ) values ($1,$2,$3,'public',$4,$1,$5,$6)
      on conflict (legacy_id) do update set
        body = excluded.body,
        is_adult = excluded.is_adult,
        updated_at = excluded.updated_at`,
      [
        Number(post.id),
        Number(post.user_id),
        String(post.body || ""),
        Boolean(post.is_adult),
        dateValue(post.created_at),
        dateValue(post.updated_at || post.created_at),
      ],
    );
  }

  console.info("Copying media to S3…");
  for (const media of rows("post_media")) {
    const legacyId = Number(media.id);
    const duplicate = await pool.query("select id from media_assets where legacy_id = $1", [legacyId]);
    if (duplicate.rowCount) continue;
    const post = await pool.query<{ author_id: number }>(
      "select author_id from posts where legacy_id = $1",
      [Number(media.post_id)],
    );
    const ownerId = post.rows[0]?.author_id;
    if (!ownerId) {
      console.warn("Skipping orphan media", legacyId);
      continue;
    }
    const assetId = randomUUID();
    try {
      const relative = String(media.path);
      const uploaded = await uploadLegacy(relative, ownerId, assetId);
      await pool.query(
        `insert into media_assets (
          id, owner_id, post_id, sort_order, kind, status, mime, original_name,
          object_key, size, duration_seconds, legacy_id, created_at, updated_at
        ) values (
          $1,$2,(select id from posts where legacy_id = $3),$4,$5,'uploaded',
          $6,$7,$8,$9,$10,$11,$12,$12
        )`,
        [
          assetId,
          ownerId,
          Number(media.post_id),
          Number(media.sort_order || 0),
          String(media.kind) === "video" ? "video" : "image",
          String(media.mime || mimeFromPath(relative)),
          path.basename(relative),
          uploaded.key,
          uploaded.size,
          media.duration_sec == null ? null : Number(media.duration_sec),
          legacyId,
          dateValue(media.created_at),
        ],
      );
      // The normal worker performs thumbnails/HLS after migration.
      await mediaQueue.add("transcode", { assetId }, { jobId: assetId });
    } catch (error) {
      console.error("Media migration failed", legacyId, error);
    }
  }

  const simpleCopies: Array<{
    source: string;
    sql: string;
    values: (row: LegacyRow) => unknown[];
  }> = [
    {
      source: "reactions",
      sql: `insert into reactions (post_id,user_id,created_at)
            values ((select id from posts where legacy_id=$1),$2,$3)
            on conflict do nothing`,
      values: (row) => [Number(row.post_id), Number(row.user_id), dateValue(row.created_at)],
    },
    {
      source: "follows",
      sql: `insert into follows (follower_id,following_id,created_at)
            values ($1,$2,$3) on conflict do nothing`,
      values: (row) => [Number(row.follower_id), Number(row.following_id), dateValue(row.created_at)],
    },
    {
      source: "comments",
      sql: `insert into comments (id,post_id,author_id,body,created_at)
            values ($1,(select id from posts where legacy_id=$2),$3,$4,$5)
            on conflict (id) do nothing`,
      values: (row) => [
        Number(row.id),
        Number(row.post_id),
        Number(row.user_id),
        String(row.body || ""),
        dateValue(row.created_at),
      ],
    },
  ];
  for (const copy of simpleCopies) {
    console.info(`Migrating ${copy.source}…`);
    for (const row of rows(copy.source)) {
      await pool.query(copy.sql, copy.values(row));
    }
  }

  console.info("Migrating direct messages…");
  for (const thread of rows("dm_threads")) {
    await pool.query(
      `insert into dm_threads (id,user_a_id,user_b_id,created_at,updated_at)
       values ($1,$2,$3,$4,$5) on conflict (id) do nothing`,
      [
        Number(thread.id),
        Number(thread.user_a),
        Number(thread.user_b),
        dateValue(thread.created_at),
        dateValue(thread.updated_at || thread.created_at),
      ],
    );
  }
  for (const message of rows("dm_messages")) {
    await pool.query(
      `insert into dm_messages (id,thread_id,sender_id,body,created_at)
       values ($1,$2,$3,$4,$5) on conflict (id) do nothing`,
      [
        Number(message.id),
        Number(message.thread_id),
        Number(message.sender_id),
        String(message.body || ""),
        dateValue(message.created_at),
      ],
    );
  }

  for (const table of ["users", "posts", "comments", "dm_threads", "dm_messages"]) {
    await pool.query(
      `select setval(pg_get_serial_sequence($1, 'id'),
        greatest(coalesce((select max(id) from ${table}), 1), 1), true)`,
      [table],
    );
  }
  console.info("Legacy migration finished.");
}

try {
  await migrate();
} finally {
  sqlite.close();
  await closeServices();
}
