# NachtBlau Hub (Launcher)

Gemeinsame Quelle für **Web** (`launcher.nachtblau-interactive.com`), **Linux-Desktop-Launcher** und **Android-App**.

Alle Plattformen nutzen dieselben Dateien:

- `index.html`, `app.js`, `site-bridge.js` (Web) bzw. native Bridges (`linux-bridge.js` / `android-bridge.js` in euren Desktop-/App-Projekten)
- `config/games.json` – Bibliothek, Kategorien, Play-URLs
- `config/monetization.json`, `config/symbiose-*.json`
- Spielordner (`twilight-crown/`, `bluepole/`, `blackhorizon/`, …)

## Aktualisieren (von der Live-Launcher-URL)

```bash
pnpm hub:pull
```

## Lokal auf Webspace-Spiegel + native Pfade kopieren

```bash
pnpm hub:sync:local
# optional:
python3 scripts/hub-sync-local.py --linux ~/Pfad/zum/Linux-Launcher/www
python3 scripts/hub-sync-local.py --android ~/Pfad/zum/Android-Projekt/app/src/main/assets/hub
```

## Auf ALL-INKL hochladen

`.env.webspace` mit FTP-Zugang anlegen (siehe `.env.webspace.example`), dann:

```bash
pnpm webspace:connect
pnpm webspace:sync:one launcher.nachtblau-interactive.com
```

## NachtBlau Crew (Allxion) – separates SPA

```bash
pnpm build
pnpm deploy:allxion
pnpm webspace:sync:one nacht-blau.de
```

Die GbR-Startseite liegt unter `webspace/nacht-blau.de/` (nicht im `hub/`-Ordner). Ein fehlerhaftes Hub-`index.html` nur auf der Domain-Root ohne Assets sollte durch den vollständigen Sync von `webspace/nacht-blau.de/` behoben werden.
