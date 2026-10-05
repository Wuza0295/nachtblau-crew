# Hybrixon

Eigenständiges Social-Portal.

**Live:** https://hybrixon.com/

## Runtime / Engine (ALL-INKL)

Modernstes Setup, das auf Shared Hosting mit **PHP 8.5** zuverlässig läuft:

| Schicht | Engine |
|--------|--------|
| UI | **Vite 8 + React 19 + React Router 7** (statische SPA unter `/spa`) |
| API | **PHP 8.5** JSON (`/api/*`, Session-Cookie + CSRF) |
| Daten | SQLite + PDO |
| Server | Apache CGI/FPM · `AddHandler php85-cgi .php` |

Kein Node-Server auf ALL-INKL nötig — SPA wird lokal gebaut, PHP bedient API/Auth/Media/Admin.

```bash
pnpm hybrixon:build          # SPA → webspace/hybrixon.com/spa(+-assets)
pnpm webspace:sync:one hybrixon.com
```

Health: `GET /api/health`

## Optik / Marke

Warme Anthrazit-Basis, Hybrid-Akzent Teal ↔ Amber, Schriften Oxanium / Sora / DM Sans.
Keine NachtBlau-Branding-Farben in der UI.

## Deploy

```bash
pnpm webspace:sync:one hybrixon.com
# oder gezielt geänderte Dateien per FTPS
```

Alte Pfade (`nacht-blau.de/hybrixon/`, `/allxion/`) leiten per 301 hierher.

## Admin

`/admin/` (nur als `wuza1987` eingeloggt)
