# NachtBlau Hub — immer Webspace

**Eine Quelle:** `https://launcher.nachtblau-interactive.com/`

PC (Bazzite), Android und Browser laden **live vom Webspace**.  
Kein Datei-Kopieren zwischen den Geräten nötig.

```
Bazzite / Android / Browser  ──lesen──►  Webspace (ALL-INKL)
                 ▲
                 │  pnpm hub:push  (nur wenn du etwas änderst)
            dein PC
```

## Alltag

| Ziel | Was tun |
|------|---------|
| Gleicher Stand überall | Nichts — alle öffnen den Webspace |
| Etwas ändern | Auf dem PC ändern → `pnpm hub:push` |
| Prüfen | Browser / Linux-App / Android-App neu laden |

## Webspace aktualisieren (vom PC)

```bash
cp .env.webspace.example .env.webspace   # einmalig: FTP_USER / FTP_PASS
pnpm webspace:connect
pnpm hub:push                            # lokaler Stand → Webspace
```

Optional vorher vom Server holen: `pnpm hub:pull`

## Linux (Bazzite) starten

Öffnet immer den Webspace:

```bash
cd apps/nachtblau-hub/linux
pnpm install
pnpm start
```

Oder einfach im Browser: https://launcher.nachtblau-interactive.com/

## Android

Die App zeigt dieselbe URL (Capacitor `server.url`):

```bash
cd apps/nachtblau-hub/android
pnpm install
npx cap add android    # einmalig, Android SDK nötig
pnpm cap:sync
pnpm open              # aufs Handy installieren
```

**Ohne eigene App:** Handy-Browser → dieselbe Webspace-URL (am besten als Startbildschirm / PWA).

## Hilfsbefehle

```bash
pnpm hub:status    # Manifest / Dateizahlen
pnpm hub:pull      # Webspace → lokaler Spiegel (Backup / Offline-Arbeit)
pnpm hub:sync      # Spiegel → linux/www + android/www (nur Offline-Fallback)
pnpm hub:push      # lokal → Webspace (Live-Stand für alle)
```
