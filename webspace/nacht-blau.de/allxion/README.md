# Allxion auf nacht-blau.de

Unterseite: **https://nacht-blau.de/allxion/**

Ein Build für **Linux · Android · Webspace**.

## Plattform-Sync

```bash
cp .env.allxion.example .env.allxion
# optional: VITE_API_ORIGIN=https://dein-manus-backend
pnpm platform:sync            # build + stage
pnpm platform:sync --push     # + FTPS nach ALL-INKL
```

| Plattform | Nutzung |
|-----------|---------|
| Linux | `pnpm dev` — gleiches Repo |
| Android | PWA / WebView → https://nacht-blau.de/allxion/ |
| Webspace | Statisches Frontend unter `/allxion/` |

Version: `shared/release.ts` → `manifest.json` + `release.json`.

## Manuell (ohne platform:sync)

```bash
pnpm webspace:build-allxion
pnpm webspace:sync:nacht-blau
```

## GitHub Actions

Repository → **Settings → Secrets and variables → Actions**:

- `FTP_USER`, `FTP_PASS` (Pflicht)
- optional: `FTP_HOST`, `FTP_REMOTE_DIR`, `VITE_API_ORIGIN`

Dann **Actions → Webspace Sync (nacht-blau.de) → Run workflow**.

## Technik

- Vite `base`: `/allxion/`
- Apache `.htaccess` mit `RewriteBase /allxion/`
- PWA `manifest.json` mit `scope`/`start_url` relativ zu `/allxion/`
- GbR-Startseite verlinkt `/allxion/` unter **Projekte**
