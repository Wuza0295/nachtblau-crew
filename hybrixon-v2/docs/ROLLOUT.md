# Additive production rollout

The legacy PHP site and Java WebView app are not removed during this rollout.
Traffic moves only after data and feature checks pass.

## Phase 1 — infrastructure and shadow media

1. Provision PostgreSQL, Redis, private object storage and two worker-capable
   containers (`api`, `worker`) in an EU region.
2. Configure object lifecycle cleanup for incomplete multipart uploads after
   24 hours and source-media retention according to policy.
3. Deploy `/v2/health`; keep it inaccessible from the legacy routing path until
   health checks are green.
4. Run a read-only copy migration. Compare counts for users, posts, media,
   reactions, comments and DMs.
5. Let the media queue produce posters/HLS. Compare failed assets and retry.

Rollback: stop v2 containers. Legacy has not changed.

## Phase 2 — API mirror

1. Expose `api.hybrixon.com/v2`.
2. Run synthetic registration/login, 500 MB multipart upload, retry, post,
   preview, playback and push-device tests.
3. Add dual-write from legacy only after the migration import has been
   rehearsed. Until dual-write is enabled, periodically rerun the idempotent
   importer from a fresh SQLite backup.
4. Monitor API p95 latency, Postgres connections, Redis memory, multipart
   aborts, queue age, FFmpeg duration and failed transcodes.

Rollback: stop dual-write and API traffic; legacy remains authoritative.

## Phase 3 — PWA canary

1. Deploy the PWA to `next.hybrixon.com`.
2. Test Android Chrome, iOS Safari and desktop with real accounts.
3. Enable it for admins, then an opt-in user cohort.
4. Validate all currently used privacy, moderation, age and admin workflows
   before increasing traffic.
5. Preserve `https://hybrixon.com/` PHP routing during the canary.

Rollback: remove the canary link/DNS target. No data rollback is needed while
legacy remains authoritative.

## Phase 4 — native app

1. Run `eas init` and replace `SET_AFTER_EAS_INIT` in `apps/mobile/app.json`.
2. Import the existing Android signing key so the app with package
   `com.hybrixon.app` upgrades in place.
3. Build an internal APK:

   ```bash
   cd apps/mobile
   eas build --platform android --profile preview
   ```

4. Verify deep links, notification permission, foreground upload, background
   queue retry, app restart, 15-file posts and 500 MB videos.
5. Publish as a staged rollout. Keep the WebView APK source/build available.

Rollback: halt the staged rollout and republish the last WebView version using
the same signing key/version progression.

## Final cutover gate

Do not redirect the main domain or retire SQLite until:

- two independently restorable PostgreSQL backups have been tested;
- migration count/checksum reports match;
- no critical legacy-only route remains;
- media backlog is zero and failed assets are accounted for;
- Android upgrade and deep links work on physical devices;
- privacy/adult/moderation behavior has human acceptance;
- rollback has been rehearsed.
