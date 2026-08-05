# Allxion auf nacht-blau.de

Unterseite: **https://nacht-blau.de/allxion/**

## Build & Upload

```bash
# Optional: API-Backend (Manus Deploy) für Login/Daten
# export VITE_API_ORIGIN=https://dein-backend.example

pnpm webspace:build-allxion
pnpm webspace:sync:nacht-blau
```

Ohne Build liegt `index.stub.html` als Vorlage bereit (wird beim Upload durch `pnpm webspace:build-allxion` ersetzt).

## GitHub Actions (ohne lokale FTP-Datei)

Repository → **Settings → Secrets and variables → Actions**:

- `FTP_USER`, `FTP_PASS` (Pflicht)
- optional: `FTP_HOST`, `FTP_REMOTE_DIR`, `VITE_API_ORIGIN`

Dann **Actions → Webspace Sync (nacht-blau.de) → Run workflow**.

## Technik

- Vite `base`: `/allxion/`
- Apache `.htaccess` mit `RewriteBase /allxion/`
- GbR-Startseite verlinkt `/allxion/` unter **Projekte**
