# Hybrixon Engine

## Stack (bewusst beibehalten)

- **PHP ≥ 8.5** auf ALL-INKL (`AddHandler php85-cgi`, Live aktuell 8.5.x)
- **SQLite** (`data/hybrixon.sqlite`) mit inkrementellen Migrationen (`HYBRIXON_SCHEMA_VERSION`)
- **Klassische PHP-Seiten** unter `/` + JSON unter `/api/`
- **Composer**: nur `minishlink/web-push` (optional; ohne `vendor/` bleibt Push aus)

Engine-ID: `HYBRIXON_ENGINE` in `includes/config.php` (aktuell `hybrixon-php85-r2`).

## Was „Engine-Upgrade“ hier bedeutet

Sinnvoll und sicher:

- PHP-8.5-Floor erzwingen und Health prüfen (`/api/health`)
- Runtime härten (Security-Header, HSTS, Session-Cookies)
- Asset-Cache zentralisieren (`HYBRIXON_ASSET_*`) ohne Optik-Änderung
- Hosting-Fitness-Signale (DB-Größe, Latenz, Composer-Vendor)

**Nicht** sinnvoll ohne Feature-/Inhaltsverlust:

- Rewrite nach React/Next/Vite-SPA
- destruktiver DB-Schema-Wechsel weg von SQLite
- Entfernen von Themes, Dual-Tone, Sidebar-Logo, Gefolgt-Feed usw.

Der Portal-Inhalt, die UI und die bestehenden Features leben in den PHP-Seiten (`index.php`, `settings.php`, `includes/*`). Eine neue Frontend-Engine würde diese Oberfläche neu bauen müssen und riskiert Regressionen.

## Deploy-Hinweis

Nach PHP/Runtime-Änderungen:

```bash
source /workspace/.env.webspace && python3 /workspace/scripts/sync-one-webspace.py hybrixon.com
```

Composer auf dem Webspace (einmalig / nach Lock-Update):

```bash
composer install --no-dev --optimize-autoloader
```
