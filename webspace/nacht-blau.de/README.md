# NachtBlau GbR (nacht-blau.de)

Eigenständige GbR-Webseite auf ALL-INKL — **Allxion** liegt als Unterseite unter **`/allxion/`**.

## URLs

- GbR: https://nacht-blau.de/
- **Allxion:** https://nacht-blau.de/allxion/
- Projekte-Anker: https://nacht-blau.de/#projekte

## Sync mit ALL-INKL

1. `.env.webspace.example` → `.env.webspace` (FTP-Zugang aus ALL-INKL Members Area)
2. Alles vom Webspace ziehen:

```bash
pnpm webspace:connect   # FTPS-Test
pnpm webspace:pull      # alle Domains → webspace/<domain>/
pnpm webspace:pull nacht-blau.de
```

3. Optional zurückschreiben:

```bash
pnpm webspace:sync                    # alle lokalen Domains → Remote
pnpm webspace:sync:one nacht-blau.de  # nur GbR
```

Die gehashten Allxion-Build-Assets (`allxion/assets/`) bleiben lokal (gitignore) und werden
über `pnpm webspace:pull` / `pnpm platform:sync` aktualisiert — nicht ins Git-Repo gelegt.

## Plattform-Sync (Linux · Android · Webspace)

Ein Build für alle Clients:

```bash
cp .env.allxion.example .env.allxion   # VITE_API_ORIGIN = Manus-Backend
export $(grep -v '^#' .env.allxion | xargs)
pnpm platform:sync                     # build + stage nach webspace/.../allxion/
pnpm platform:sync --push              # zusätzlich FTPS-Upload ( .env.webspace nötig )
```

| Plattform | Was synchron ist |
|-----------|------------------|
| **Linux** (Dev) | `pnpm dev` — gleiches Repo wie Manus Cloud |
| **Android** | WebView/PWA → `https://nacht-blau.de/allxion/` (`manifest.json`, scope `/allxion/`) |
| **Webspace** | Statisches Allxion unter `/allxion/`, API/OAuth über `VITE_API_ORIGIN` |

Versionsstand: `shared/release.ts` (wird in `manifest.json` und `data/projects.json` übernommen).
