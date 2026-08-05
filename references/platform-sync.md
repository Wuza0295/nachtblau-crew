# Plattform-Sync (Linux · Android · Webspace)

Eine Codebasis (`nachtblau-crew`) – drei Auslieferungswege:

| Plattform | Was der Nutzer sieht | Technik |
|-----------|----------------------|---------|
| **Webspace (Allxion)** | https://nacht-blau.de/allxion/ | Statischer Vite-Build auf ALL-INKL |
| **Android** | „Zum Startbildschirm hinzufügen“ / PWA | Gleicher Allxion-Build (`manifest.json`, `scope: /allxion/`) |
| **Linux** | Browser oder installierte PWA | Gleicher Allxion-Build |

Der **volle Stack** (Datenbank, Forum, Social-API) läuft auf dem **Manus-Deploy**. Die statische Allxion-Kopie auf dem Webspace kann optional per `VITE_API_ORIGIN` auf diese API zeigen (siehe `.env.allxion.example`).

## Voraussetzungen

```bash
cp .env.webspace.example .env.webspace   # FTP von ALL-INKL
cp .env.allxion.example .env.allxion     # optional API-Origin
```

## Workflow: Repo → Webspace (alle Plattformen gleich)

```bash
pnpm install
pnpm sync:platforms
```

Das führt aus:

1. `pnpm build:allxion` – Frontend mit Basis-Pfad `/allxion/`
2. `python3 scripts/publish-allxion.py` – Kopie nach `webspace/nacht-blau.de/allxion/`
3. `pnpm webspace:sync:one nacht-blau.de` – FTPS-Upload (wenn `.env.webspace` gesetzt)

Nur lokal vorbereiten ohne Upload:

```bash
pnpm publish:allxion
```

## Workflow: Webspace → Repo (Spiegel aktualisieren)

```bash
pnpm webspace:pull nacht-blau.de
```

Gehashte Dateien unter `webspace/nacht-blau.de/allxion/assets/` werden per Pull geholt (gitignored).

## Linux-Entwicklung

```bash
pnpm dev
```

Entwicklung mit vollem Backend unter `http://localhost:…` – entspricht funktional dem Manus-Deploy, nicht dem statischen Webspace.

## Weitere Domains

Alle Konten-Domains: `pnpm webspace:pull` / `pnpm webspace:sync`. Nur `webspace/nacht-blau.de/` ist standardmäßig im Git; andere Spiegel können Zugangsdaten enthalten und bleiben lokal.
