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
cp .env.webspace.example .env.webspace   # FTP_USER/FTP_PASS eintragen
set -a && source .env.webspace && set +a
python3 scripts/hybrixon-smoke.py
python3 scripts/sync-one-webspace.py hybrixon.com --health-check
```

Details: [`ENGINE.md`](ENGINE.md). Alte Pfade (`nacht-blau.de/hybrixon/`, `/allxion/`) leiten per 301 hierher.

## Admin

`/admin/` (nur als `wuza1987` eingeloggt)
