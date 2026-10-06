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

Einmalig Branch holen und Install-Skript ausführen (legt Desktop-/Startmenü-Shortcut an, kein Admin):

```powershell
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew\apps\nachtblau-hub\windows
.\Install-NachtBlauHub.ps1
```

Danach: Shortcut **NachtBlau Hub** oder `pnpm start` im gleichen Ordner.

Details, Optionen (`-Start`, `-NoShortcut`) und Troubleshooting: [windows/README.md](./windows/README.md).

Pi-Desktop / Updates vom Heimnetz: `scripts/pi/run-lightweight-desktop-from-windows.ps1`.

## Linux (Bazzite / Aurora)

```bash
cd apps/nachtblau-hub/linux && pnpm install && pnpm start
```

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
