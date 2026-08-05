# NachtBlau Hub — Multi-Platform Sync

Ein gemeinsamer Hub-Stand für **Webspace**, **Linux Desktop** und **Android**.

## Quelle der Wahrheit

`launcher.nachtblau-interactive.com` auf dem ALL-INKL-Webspace  
→ lokal: `webspace/launcher.nachtblau-interactive.com/`  
→ shared: `apps/nachtblau-hub/shared/`  
→ Linux: `apps/nachtblau-hub/linux/www/`  
→ Android: `apps/nachtblau-hub/android/www/`

Die UI-Dateien sind auf allen Plattformen identisch. Nur die Bridge unterscheidet sich:

| Plattform | Bridge | Label |
|-----------|--------|-------|
| Webspace  | `site-bridge.js` | Web Hub |
| Linux     | `linux-bridge.js` | Linux Desktop |
| Android   | `android-bridge.js` | Android App |

## Befehle (Repo-Root)

```bash
cp .env.webspace.example .env.webspace   # FTP_USER / FTP_PASS

pnpm webspace:connect                   # FTPS-Test
pnpm hub:pull                           # Remote → shared + Linux + Android
pnpm hub:sync                           # lokaler Webspace-Spiegel → Linux + Android
pnpm hub:push                           # shared → Webspace-Launcher
pnpm hub:status                         # Dateizahlen / Manifest
```

## Linux starten

```bash
cd apps/nachtblau-hub/linux
pnpm install
pnpm start
```

## Android

```bash
cd apps/nachtblau-hub/android
pnpm install
# einmalig: npx cap add android   (Android SDK nötig)
pnpm cap:sync
pnpm open
```

## Sync-Manifest

Nach jedem `hub:pull|sync|push` wird `sync-manifest.json` geschrieben (Content-Hash + Dateizahlen).
