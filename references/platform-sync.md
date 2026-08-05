# Plattform-Sync (Linux · Android · Webspace)

Eine Codebasis (`nachtblau-crew`) – drei Auslieferungswege:

| Plattform | Was der Nutzer sieht | Technik |
|-----------|----------------------|---------|
| **Webspace (Allxion)** | https://nacht-blau.de/allxion/ | Statischer Vite-Build auf ALL-INKL |
| **Android** | „Zum Startbildschirm hinzufügen“ / PWA | Gleicher Allxion-Build (`manifest.json`, `scope: /allxion/`) |
| **Linux** | Browser oder installierte PWA / `pnpm dev` | Gleicher Code (Dev mit Backend) bzw. Allxion-PWA |

Der **volle Stack** (Datenbank, Forum, Social-API) läuft auf dem **Manus-Deploy**. Die statische Allxion-Kopie auf dem Webspace kann optional per `VITE_API_ORIGIN` auf diese API zeigen (siehe `.env.allxion.example`).

Versionsstand: `shared/release.ts`.

## Voraussetzungen

```bash
cp .env.webspace.example .env.webspace   # FTP von ALL-INKL
cp .env.allxion.example .env.allxion     # optional API-Origin
```

## Workflow: Repo → Webspace (alle Plattformen gleich)

```bash
pnpm install
pnpm sync:platforms:local   # nur bauen + stagen
pnpm sync:platforms         # bauen + stagen + FTPS-Upload (nacht-blau.de)
# oder:
pnpm platform:sync --push
```

Schritte im Detail:

1. `pnpm build:allxion` – Frontend mit Basis-Pfad `/allxion/`
2. `pnpm stage:allxion` – Kopie nach `webspace/nacht-blau.de/allxion/`
3. `pnpm webspace:sync:one nacht-blau.de` – FTPS-Upload

## Workflow: Webspace → Repo (Spiegel aktualisieren)

```bash
pnpm webspace:pull nacht-blau.de
# oder alle Domains:
pnpm webspace:pull
```

Gehashte Dateien unter `webspace/nacht-blau.de/allxion/assets/` werden per Pull geholt (gitignored).

## Linux-Entwicklung

```bash
pnpm dev
```

Entwicklung mit vollem Backend unter `http://localhost:…` – entspricht funktional dem Manus-Deploy.

## Android / Linux PWA

Nach dem Upload:

1. https://nacht-blau.de/allxion/ öffnen
2. „Zum Startbildschirm hinzufügen“ / PWA installieren
3. Gleicher Build-Stand wie Webspace (`manifest.json` → `version`)

## Weitere Domains

Alle Konten-Domains: `pnpm webspace:pull` / `pnpm webspace:sync`. Nur `webspace/nacht-blau.de/` ist standardmäßig im Git; andere Spiegel können Zugangsdaten enthalten und bleiben lokal.
