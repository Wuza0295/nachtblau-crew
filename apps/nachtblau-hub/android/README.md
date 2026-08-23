# NachtBlau Hub — Android App 1.1.0

Lädt **immer live** vom Webspace:

https://launcher.nachtblau-interactive.com/android.html

## Auf dem Handy aktualisieren

### Ohne Build (schnellster Weg)
Handy-Browser → URL öffnen → „Zum Startbildschirm hinzufügen“.

### Mit Capacitor-App (Bazzite / Dev-PC)

```bash
# Repo-Root
pnpm hub:pull

cd apps/nachtblau-hub/android
pnpm install
pnpm update          # Webspace → www → cap sync
pnpm open            # Android Studio → Run aufs Gerät
# oder:
pnpm run run
```

Voraussetzung: Android Studio / SDK, USB-Debugging am Handy.

## Version

- `package.json` / App: **1.1.0** (`versionCode` 2)
- Live-URL: `capacitor.config.json` → `server.url`
