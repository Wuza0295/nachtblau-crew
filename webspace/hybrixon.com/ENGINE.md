# Hybrixon Engine

## Stack (bewusst beibehalten)

- **PHP ≥ 8.5** auf ALL-INKL (`AddHandler php85-cgi`, Live aktuell 8.5.x)
- **SQLite** (`data/hybrixon.sqlite`) mit inkrementellen Migrationen (`HYBRIXON_SCHEMA_VERSION`)
- **Klassische PHP-Seiten** unter `/` + JSON unter `/api/`
- **Composer**: nur `minishlink/web-push` (optional; ohne `vendor/` bleibt Push aus)

Engine-ID: `HYBRIXON_ENGINE` in `includes/config.php` (aktuell `hybrixon-php85-r3`).

## Was „Engine-Upgrade“ hier bedeutet

Sinnvoll und sicher:

- PHP-8.5-Floor erzwingen und Health prüfen (`/api/health`)
- Runtime härten (Security-Header, HSTS, Session-Cookies)
- Asset-Cache zentralisieren (`HYBRIXON_ASSET_*`) ohne Optik-Änderung
- SQLite-Indizes + Request-Caches für Feed/Follows/Friends/Blocks (kein Rewrite)
- Hosting-Fitness-Signale (DB-Größe, Latenz, Composer-Vendor)

**Nicht** sinnvoll ohne Feature-/Inhaltsverlust:

- Rewrite nach React/Next/Vite-SPA
- destruktiver DB-Schema-Wechsel weg von SQLite
- Entfernen von Themes, Dual-Tone, Sidebar-Logo, Gefolgt-Feed usw.

Der Portal-Inhalt, die UI und die bestehenden Features leben in den PHP-Seiten (`index.php`, `settings.php`, `includes/*`). Eine neue Frontend-Engine würde diese Oberfläche neu bauen müssen und riskiert Regressionen.

## Performance (r3)

Gemessen / angestrebt ohne Rewrite:

| Hebel | Was | Wo |
| --- | --- | --- |
| Indizes | `posts(created_at)`, Reactions/Comments, Follows, Blocks, Notifications … | `includes/db.php` Migration |
| Feed N+1 | Request-Caches für Following/Friends/Blocks; SQL-Filter für Scope | `social.php` / `friends.php` / `blocks.php` / `posts.php` |
| Assets | `?v=` aus `HYBRIXON_ASSET_*`, `.htaccess` `Cache-Control` 7d + `ExpiresByType` | `config.php`, `.htaccess`, `sw.js` |
| OPCache | Host-seitig aktiv (ALL-INKL); keine App-Änderung nötig | `.user.ini` nur Upload-Limits |

Baseline vor Sync (Cloud-Agent, `2026-10-09`): Live-Health noch `hybrixon-php85`, Home TTFB ~0.5s, CSS `max-age=172800` (älteres `.htaccess`). Nach Deploy von r3: Health `hybrixon-php85-r3`, CSS sollte `max-age=604800` zeigen.

## Deploy (FTPS)

Credentials liegen **nicht** im Repo. Lokal / Cloud Secrets:

```bash
cp .env.webspace.example .env.webspace   # einmalig
# FTP_USER / FTP_PASS aus ALL-INKL Members Area eintragen

set -a && source /workspace/.env.webspace && set +a
python3 /workspace/scripts/hybrixon-smoke.py          # lokal ohne PHP
python3 /workspace/scripts/sync-one-webspace.py hybrixon.com --health-check
# nur CSS/JS (schneller Smoke):
python3 /workspace/scripts/deploy-hybrixon-css.py
```

Hinweise:

- `sync-one-webspace.py` überspringt `vendor/`, `uploads/`, `.env*` (siehe `SKIP_NAME_PARTS`).
- Nach Schema-/Engine-Änderungen immer `--health-check` nutzen (prüft `HYBRIXON_ENGINE`).
- Composer auf dem Webspace (einmalig / nach Lock-Update):

```bash
composer install --no-dev --optimize-autoloader
```

- Smoke lokal + live:

```bash
python3 scripts/hybrixon-smoke.py --live https://hybrixon.com/api/health --expect-engine hybrixon-php85-r3
```

## Asset-Versionen

Einzige Quelle: `HYBRIXON_ASSET_CSS` / `_JS` / `_SW` / `HYBRIXON_STATIC_CACHE` in `includes/config.php`.
`sw.js` muss dieselben Zahlen tragen — der Smoke-Check verifiziert das.

## Composer / Autoload

- `composer.json`: PHP `>=8.5`, optional `minishlink/web-push`
- Kein Classmap für App-Code — Portal nutzt `require_once` (OPCache-freundlich)
- `vendor/` wird per FTPS bewusst **nicht** gespiegelt (auf dem Webspace per Composer pflegen)
