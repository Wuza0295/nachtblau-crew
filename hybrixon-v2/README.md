# Hybrixon v2

Additive successor platform for `webspace/hybrixon.com` and
`android/hybrixon`. The existing PHP/SQLite site and Android WebView app stay
available until each route has passed production verification.

## What is included

1. **Media platform**
   - Browser/app uploads go directly to S3-compatible storage using presigned
     multipart PUTs (8 MiB parts, resumable/retryable, no PHP 413 bottleneck).
   - Redis/BullMQ worker uses FFmpeg/ffprobe to create optimized images, video
     posters and HLS streams.
   - Immutable derived files are ready for CDN delivery.

2. **API + PostgreSQL**
   - Fastify/TypeScript API under `/v2`.
   - PostgreSQL schema and Drizzle migrations for users, sessions, posts,
     media, follows, reactions, comments, DMs and push devices.
   - Short-lived JWT access tokens, rotating refresh tokens, Argon2id passwords,
     rate limits and legacy bcrypt upgrade on login.
   - Read-only SQLite/S3 migration script; the source platform is not modified.

3. **React PWA**
   - Mobile-first feed, auth, profile and 15-file post composer.
   - Direct multipart upload progress, offline feed cache, install manifest and
     immutable media cache.

4. **Native Expo app**
   - Uses package/scheme `com.hybrixon.app` / `hybrixon://`, preserving current
     links when it replaces the WebView APK.
   - Native feed/media playback, persistent upload queue, OS background retry,
     secure token storage and Expo push registration.
   - Existing Java WebView source remains in `android/hybrixon` as rollback.

## Repository layout

```text
hybrixon-v2/
  apps/api       Fastify API + PostgreSQL migrations + legacy importer
  apps/worker    FFmpeg media worker
  apps/web       React/Vite PWA
  apps/mobile    Expo/React Native app
  packages/contracts  Shared validation, API types and multipart uploader
  compose.yaml   Local/VM PostgreSQL, Redis, MinIO, API, worker and web
```

## Local setup

Requirements: Node 22+, pnpm 10.4+, Docker with Compose and FFmpeg (worker
container includes FFmpeg).

```bash
cp .env.example .env
pnpm install
docker compose up --build
```

- Web: http://localhost:8081
- API health: http://localhost:8080/v2/health
- MinIO console: http://localhost:9001

Without Docker, type-check and build everything:

```bash
pnpm check
pnpm test
pnpm build
```

## Legacy migration

1. Put a consistent copy of the live SQLite DB and uploads directory on the new
   host. Use SQLite's backup command or stop writes briefly; do not copy only
   the main file while WAL writes are active.
2. Mount them read-only and configure:

```dotenv
LEGACY_SQLITE_PATH=/legacy/data/hybrixon.sqlite
LEGACY_UPLOADS_PATH=/legacy/uploads
```

3. Apply schema and import:

```bash
pnpm db:migrate
pnpm legacy:migrate
```

The importer is idempotent through `legacy_id`, preserves user/post IDs,
password hashes, reactions, follows, comments and DMs, copies media to S3 and
queues every copied asset for thumbnails/HLS. A legacy bcrypt password is
rehash-upgraded to Argon2id after the user's first v2 login.

## Production requirements

The current ALL-INKL shared webspace cannot run PostgreSQL, Redis, Node workers
or FFmpeg queues. Production therefore needs a container-capable VM/Kubernetes
service plus:

- managed PostgreSQL with daily backups and point-in-time recovery;
- Redis with persistence and `noeviction`;
- private S3-compatible bucket with lifecycle rules for abandoned multipart
  uploads;
- CDN in front of derived media (private origin; signed cookies/URLs when
  private posts are enabled);
- TLS/DNS for the PWA and API;
- Expo/EAS project ID and Android signing migration for `com.hybrixon.app`.

Never use the development MinIO anonymous-read policy for private production
media.

See `docs/ROLLOUT.md` for the no-removal rollout and rollback sequence.
