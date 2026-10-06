# NachtBlau Hub — immer Webspace

> **Hinweis:** Minecraft läuft auf dem Raspberry Pi (`192.168.178.33` / WAN `89.247.164.165`). Ports: Java **25565**, Bedrock **19132**, Geyser **19134**. Der Hub kann geöffnet werden, auch wenn die Spiele-Server noch im Setup sind.

**Eine Quelle:** `https://launcher.nachtblau-interactive.com/`

| Gerät | URL | Install |
|-------|-----|---------|
| Browser | `/` bzw. `index.html` | — |
| Linux (Bazzite / Aurora) | `/linux.html` | [`linux/install-nachtblau-hub.sh`](./linux/install-nachtblau-hub.sh) |
| Windows | `/windows.html` | [`windows/Install-NachtBlauHub.ps1`](./windows/Install-NachtBlauHub.ps1) |
| Android | `/android.html` | [`android/README.md`](./android/README.md) |

```
Windows / Bazzite / Android / Browser  ──lesen──►  Webspace (ALL-INKL)
                      ▲
                      │  pnpm hub:push
                 dein PC
```

`pnpm hub:sync` erzeugt aus derselben `index.html` die Einstiege `linux.html`, `windows.html` und `android.html` (plus `.htm` für ALL-INKL MultiViews).

## Bazzite / Aurora / Linux

```bash
cd apps/nachtblau-hub/linux
chmod +x install-nachtblau-hub.sh start-nachtblau-hub.sh
./install-nachtblau-hub.sh
```

Details: [linux/README.md](./linux/README.md).

## Windows (Notebook)

```powershell
git clone -b cursor/bazzite-windows-sync-8c11 https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew\apps\nachtblau-hub\windows
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1
```

Danach: Shortcut **NachtBlau Hub** oder `pnpm start`. Falls `windows.html` auf dem Webspace noch 404 liefert, lädt die Windows-App automatisch **dieselbe** Bazzite-Seite (`linux.html`).

Shortcuts nachziehen: `-SkipInstall` — Details: [windows/README.md](./windows/README.md).

Pi-Desktop / Updates vom Heimnetz: `scripts/pi/run-lightweight-desktop-from-windows.ps1`.

## Minecraft Client (Lumina Launcher)

Der **NachtBlau Lumina Launcher** (Minecraft Java, RAM-Slider, Microsoft-Login) liegt unter
[`apps/nachtblau-lumina-launcher/`](../nachtblau-lumina-launcher/). Downloads: [`/downloads/`](https://launcher.nachtblau-interactive.com/downloads/).

Laptop-RAM: **6–8 GB** empfohlen — nicht den Slider auf Maximum (bei 32‑GB-PCs zeigte ≤1.0.10 fälschlich „29 GB“ als Cap). Details: [LAPTOP-OPTIMIERUNG.md](../nachtblau-lumina-launcher/LAPTOP-OPTIMIERUNG.md).

## Android aktualisieren

```bash
cd apps/nachtblau-hub/android
pnpm install
pnpm update          # pull + prepare www + cap sync
pnpm open            # Android Studio → aufs Handy
```

Details: [android/README.md](./android/README.md)

## Webspace deployen (windows.html live schalten)

```bash
cp .env.webspace.example .env.webspace   # FTP_USER / FTP_PASS eintragen
pnpm hub:pull     # optional: aktuellen Live-Stand holen
pnpm hub:sync     # Bazzite + Windows + Android aus shared erzeugen
pnpm hub:push     # linux.html, windows.html, android.html + Bridges hochladen
```
