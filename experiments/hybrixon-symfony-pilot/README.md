# Hybrixon Symfony 7.4 pilot

This is a deliberately isolated engine evaluation. It lives outside
`webspace/hybrixon.com/`, so the current portal, its PHP pages, SQLite data,
themes, API routes, and deploy sync are untouched.

## Scope

- One read-only `GET /health` route, returning a small pilot-specific JSON
  response.
- Symfony FrameworkBundle 7.4 LTS on the repository's existing PHP 8.5 floor.
- No database connection, authentication changes, write actions, or copied
  production code.
- This route is not yet API-compatible with the live `/api/health` response.

## Local run

From this directory, with PHP 8.5 and Composer installed:

```sh
composer install
APP_ENV=dev APP_DEBUG=1 APP_SECRET=local-pilot-secret php -S 127.0.0.1:8001 -t public public/index.php
```

Open `http://127.0.0.1:8001/health`. Composer's Symfony Runtime plugin creates
`vendor/autoload_runtime.php` during installation.

## Staging gate before any live integration

1. Confirm the ALL-INKL plan supports SSH/Composer and test a separate staging
   directory/subdomain. Do not sync this folder to the live document root.
2. Install dependencies on staging and verify `GET /health`, PHP version,
   response headers, and error logging.
3. Add a compatibility test for the current `/api/health` payload and compare
   it with the PHP implementation before considering route replacement.
4. Verify sign-in, feeds, posting, reactions, media, moderation, notifications,
   messaging, settings, and all 22 themes against the current PHP portal.
5. Only after those checks pass should a separate, reviewable migration step be
   proposed. Keep SQLite and existing PHP routes as the source of truth until
   there is evidence that the pilot is safe.

## Rollback

The pilot is isolated. Remove its staging directory or disable its staging
vhost; the production PHP portal and database do not depend on it.
