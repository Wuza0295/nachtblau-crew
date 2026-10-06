# Lumina Launcher — Build & Webspace (AppImage / Updates)

**Ziel-Version:** 1.0.11 (RAM/JVM-Laptop-Optimierung)  
**Update-URL (electron-updater):** `https://launcher.nachtblau-interactive.com/downloads/`  
Siehe `app-update.yml`.

## Voraussetzungen (Build-Rechner)

- Node.js LTS, `pnpm install` im Ordner `apps/nachtblau-lumina-launcher`
- `package.json` → `"version": "1.0.11"` muss mit dem Deploy-Ordner übereinstimmen
- Electron-Builder o. ä. (falls noch nicht im Repo: vom bisherigen Build-Prozess auf dem Webspace übernehmen)

## Kurz-Checkliste vor Deploy

1. `pnpm test` (Memory/RAM-Logik)
2. Version in `package.json` erhöhen und überall konsistent halten
3. Release-Artefakte bauen (Linux AppImage, Windows NSIS, ggf. RPM)
4. Auf ALL-INKL / Webspace hochladen (siehe unten)
5. Download-Seite + `latest-linux.yml` / `latest.yml` prüfen (electron-updater)

## Webspace-Struktur (typisch)

```
launcher.nachtblau-interactive.com/downloads/
  latest-linux.yml          # Metadaten für AppImage-Updater
  latest.yml                # Windows
  NachtBlau-Lumina-Launcher-1.0.11.AppImage
  NachtBlau-Lumina-Launcher-Setup-1.0.11.exe
  v1.0.11/                  # optional: Archiv / direkte Links
```

Die exakten Dateinamen müssen zu den Einträgen in den `latest*.yml`-Dateien passen (SHA512, Pfad).

## AppImage manuell aktualisieren (Linux / Bazzite)

1. Neues AppImage nach `downloads/` legen (Schreibrechte auf dem Webspace).
2. `latest-linux.yml` vom Build-Artefakt mit hochladen **oder** vom Builder generieren lassen.
3. Auf dem Laptop: Launcher → Update prüfen, oder AppImage ersetzen und neu starten.
4. Nach Update: RAM-Slider sollte **6–8 GB** empfehlen (nicht ~29 GB). Siehe [LAPTOP-OPTIMIERUNG.md](./LAPTOP-OPTIMIERUNG.md).

## Windows

- Setup-EXE + `latest.yml` deployen.
- In-App-Update nutzt `electron-updater`; alternativ `windows-apply-update.ps1` (vom Launcher aus gestartet).

## Keine Secrets committen

`config/server.json` → `discordWebhook` leer lassen. Webhooks nur lokal / auf dem Server setzen.

## Repo vs. Live

Der Quellcode liegt in diesem Monorepo unter `apps/nachtblau-lumina-launcher/`.  
Solange auf dem Webspace noch **1.0.10** liegt, gilt die manuelle RAM-Empfehlung (6–8 GB) aus [LAPTOP-OPTIMIERUNG.md](./LAPTOP-OPTIMIERUNG.md).
