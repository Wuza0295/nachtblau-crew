# NachtBlau Hub — immer Webspace

> **Hinweis:** Minecraft läuft auf dem Raspberry Pi (`192.168.178.33` / WAN `89.247.164.165`). Ports: Java **25565**, Bedrock **19132**, Geyser **19134**. Der Hub kann geöffnet werden, auch wenn die Spiele-Server noch im Setup sind.

**Eine Quelle:** `https://launcher.nachtblau-interactive.com/`

| Gerät | URL |
|-------|-----|
| Browser | `/` bzw. `index.html` |
| Linux (Bazzite / Aurora) | `/linux.html` |
| Windows | `/windows.html` |
| Android | `/android.html` |

```
Windows / Bazzite / Android / Browser  ──lesen──►  Webspace (ALL-INKL)
                      ▲
                      │  pnpm hub:push
                 dein PC
```

## Windows (Notebook)

Einmalig Branch holen und Install-Skript ausführen (legt standardmäßig Desktop-/Startmenü-Shortcut an, kein Admin):

```powershell
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew\apps\nachtblau-hub\windows
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1
```

Danach: Shortcut **NachtBlau Hub** (voller Pfad in der Skript-Ausgabe) oder `pnpm start` im gleichen Ordner.

Shortcuts nachziehen ohne erneutes Install: `-SkipInstall` — Details: [windows/README.md](./windows/README.md).

Pi-Desktop / Updates vom Heimnetz: `scripts/pi/run-lightweight-desktop-from-windows.ps1`.

## Minecraft Client (Lumina Launcher)

Der **NachtBlau Lumina Launcher** (Minecraft Java, RAM-Slider, Microsoft-Login) liegt unter
[`apps/nachtblau-lumina-launcher/`](../nachtblau-lumina-launcher/). Downloads: [`/downloads/`](https://launcher.nachtblau-interactive.com/downloads/).

Laptop-RAM: **6–8 GB** empfohlen — nicht den Slider auf Maximum (bei 32‑GB-PCs zeigte ≤1.0.10 fälschlich „29 GB“ als Cap). Details: [LAPTOP-OPTIMIERUNG.md](../nachtblau-lumina-launcher/LAPTOP-OPTIMIERUNG.md).

## Linux (Bazzite / Aurora)

Einmalig, ohne Root (Anwendungsmenü + Desktop-Starter):

```bash
cd apps/nachtblau-hub/linux
./install-bazzite.sh
```

Danach: Menüeintrag **NachtBlau Hub** oder `pnpm start`.

## Gleicher Stand: Bazzite und Windows

Die Bazzite-Seite (`/linux`) ist die Quelle. Windows (`/windows`) wird daraus erzeugt und auf den Launcher gelegt:

```bash
# Zugangsdaten in .env.webspace (siehe .env.webspace.example)
pnpm hub:sync-bazzite-windows
```

Ohne Upload nur die Dateien bauen: `python3 scripts/sync_bazzite_windows.py --no-upload`.
Nur prüfen: `python3 scripts/sync_bazzite_windows.py --check`.

## Android aktualisieren

```bash
cd apps/nachtblau-hub/android
pnpm install
pnpm update          # pull + prepare www + cap sync
pnpm open            # Android Studio → aufs Handy
```

Details: [android/README.md](./android/README.md)

## Webspace deployen

```bash
pnpm webspace:connect
pnpm hub:push
```
