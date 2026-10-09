# Hybrixon

Eigenständiges Social-Portal.

**Live:** https://hybrixon.com/

## Optik / Marke

Warme Anthrazit-Basis, Hybrid-Akzent Teal ↔ Amber, Schriften Oxanium / Sora / DM Sans.
Keine NachtBlau-Branding-Farben in der UI.

## Engine

PHP 8.5 + SQLite auf ALL-INKL — siehe [`ENGINE.md`](ENGINE.md).
Kein SPA-Rewrite: Optik, Funktionen und Inhalt bleiben in den PHP-Seiten.

Health: `https://hybrixon.com/api/health`

Asset-Cache-Buster zentral in `includes/config.php` (`HYBRIXON_ASSET_CSS` / `_JS` / `_SW`).

## Deploy

```bash
./scripts/push-server.sh hybrixon
# oder FTPS:
# source /workspace/.env.webspace && python3 /workspace/scripts/sync-one-webspace.py hybrixon.com
```

Alte Pfade (`nacht-blau.de/hybrixon/`, `/allxion/`) leiten per 301 hierher.

## Admin

`/admin/` (nur als `wuza1987` eingeloggt)
