# NachtBlau Lumina Launcher

Desktop-Launcher (Electron) für Minecraft Java · Microsoft-Login · Direktconnect zu NachtBlau Lumina.

**Live-Downloads:** https://launcher.nachtblau-interactive.com/downloads/  
**Version im Repo:** 1.0.11 (RAM/JVM-Laptop-Optimierung) · ausgeliefert auf Webspace aktuell oft noch 1.0.10

## Warum stand der Slider bei „29 GB“?

Bis 1.0.10 war das Cap:

```js
Math.min(32, totalGb - 2)
```

Auf einem Laptop mit ~32 GB Arbeitsspeicher meldet Windows oft nur ~31 GiB nutzbar → `31 - 2 = 29`. Der Slider hing also am **Maximalwert**, nicht an „zu wenig RAM“.

**29 GB Client-Heap ist für Minecraft extrem viel** (sinnvoll sind meist 4–8 GB). Mehr RAM macht den Client selten schneller — oft sogar langsamer (GC/Startup) und nimmt dem OS Speicher weg.

Ab 1.0.11:

| System-RAM | Empfohlen | Slider-Max (mit OS-Reserve) |
|-----------|-----------|-----------------------------|
| 8 GB      | 4 GB      | ~4–6 GB                     |
| 16 GB     | 6 GB      | ~12 GB                      |
| 32 GB     | 8 GB      | 16 GB (Hard-Cap)            |

Zusätzlich: G1GC-Client-Flags, Migration alter 29‑GB-Settings → empfohlenwert, einmalige Laptop-`options.txt`-Defaults.

## Entwickeln

```bash
cd apps/nachtblau-lumina-launcher
pnpm install   # oder npm install
pnpm test
pnpm start     # benötigt electron (devDependency)
```

## Build / Deploy

Quelle lag bisher nur im gepackten AppImage auf dem Webspace. Dieses Repo führt den Code unter `apps/nachtblau-lumina-launcher/` fort.

Deploy-Schritte (AppImage, `latest-linux.yml`, Webspace): [DEPLOY.md](./DEPLOY.md).

Bis **1.0.11** auf dem Webspace live ist: Slider im laufenden 1.0.10 manuell auf **6–8 GB** stellen (siehe [LAPTOP-OPTIMIERUNG.md](./LAPTOP-OPTIMIERUNG.md)).

### Java fehlt auf Bazzite

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/pi-lightweight-desktop-3ddb/apps/nachtblau-hub/linux/Install-Java21-Bazzite.sh | bash
```

Danach: **Lumina neu starten, RAM 6–8 GB** (nicht 29 GB) → SPIELEN.

Keine Secrets / Discord-Webhooks mit Inhalt committen (`config/server.json` → `discordWebhook` leer lassen).
