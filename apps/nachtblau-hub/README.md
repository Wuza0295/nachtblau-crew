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

## Windows

```powershell
cd apps\nachtblau-hub\windows
pnpm install
pnpm start
```

Pi-Desktop / Updates vom Heimnetz: siehe `scripts/pi/run-lightweight-desktop-from-windows.ps1` und [windows/README.md](./windows/README.md).

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
