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

## Welches Gerät? Welches Terminal?

| Du sitzt auf … | Shell | Hub-Pfad | Pi-Upgrade? |
|----------------|-------|----------|-------------|
| **Bazzite / Linux** | **bash** | `apps/nachtblau-hub/linux/` → `./Install-NachtBlauHub.sh` | Nein — nur per SSH **auf dem Pi** |
| **Windows-Notebook** | **PowerShell** | `apps\nachtblau-hub\windows\` → `Install-NachtBlauHub.ps1` | Optional: `scripts\pi\run-lightweight-desktop-from-windows.ps1` |
| **Raspberry Pi** | **bash** (SSH) | Hub läuft nicht dort | Ja: `sudo ./scripts/pi/upgrade-all.sh --yes` **im Clone auf dem Pi** |

**Nicht vermischen:** Windows-`\`-Pfade und `powershell` gehören nicht in Bazzite-bash. `upgrade-all.sh` gehört nicht in `~` auf Bazzite.

---

## Linux (Bazzite / Aurora) — bash

```bash
cd ~
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
chmod +x Install-NachtBlauHub.sh Start-NachtBlauHub.sh
./Install-NachtBlauHub.sh
```

Danach: Shortcut **NachtBlau Hub** oder `pnpm start` im gleichen Ordner.

Details: [linux/README.md](./linux/README.md).

---

## Windows (Notebook) — PowerShell only

```powershell
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew\apps\nachtblau-hub\windows
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1
```

Danach: Shortcut **NachtBlau Hub** oder `pnpm start` im gleichen Ordner.

Details: [windows/README.md](./windows/README.md).

Pi-Desktop vom Windows-PC (Heimnetz): `scripts/pi/run-lightweight-desktop-from-windows.ps1`.
Vollständiges Pi-Upgrade: SSH zum Pi, dann `scripts/pi/upgrade-all.sh` **auf dem Pi** — nicht lokal auf Windows oder Bazzite.

---

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

## Webspace deployen

```bash
pnpm webspace:connect
pnpm hub:push
```
