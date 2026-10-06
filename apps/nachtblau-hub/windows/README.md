# NachtBlau Hub — Windows

Electron-Shell wie unter Linux/Bazzite. Inhalt kommt live vom Webspace
(`windowsUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/windows.html`).

## Notebook: einmalig installieren

Voraussetzungen: **Node.js LTS** und **pnpm** (kein Admin für den Hub selbst).

```powershell
# Repo holen / Branch aktualisieren
cd $HOME\Documents   # oder dein Clone-Ordner
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
# Falls schon geclonet:
#   cd nachtblau-crew
#   git fetch origin cursor/pi-lightweight-desktop-3ddb
#   git checkout cursor/pi-lightweight-desktop-3ddb
#   git pull

cd nachtblau-crew\apps\nachtblau-hub\windows
.\Install-NachtBlauHub.ps1
```

Oder Doppelklick auf `Install-NachtBlauHub.cmd`.

Das Skript prüft Node/pnpm, führt `pnpm install` aus und legt **ohne Admin** Shortcuts an:

- Desktop: `NachtBlau Hub.lnk`
- Startmenü: `NachtBlau` → `NachtBlau Hub`

Optionen:

| Parameter | Wirkung |
|-----------|---------|
| `-Start` | Nach Install sofort `pnpm start` |
| `-NoShortcut` | Keine Shortcuts |
| `-SkipInstall` | Nur Shortcuts / Checks, kein `pnpm install` |

Falls die Execution Policy blockiert:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1
```

## Start (danach)

```powershell
cd apps\nachtblau-hub\windows
pnpm start
```

Oder Shortcut „NachtBlau Hub“ auf dem Desktop / im Startmenü.

## Manuell ohne Install-Skript

```powershell
cd apps\nachtblau-hub\windows
pnpm install
pnpm start
```

## Pi / Minecraft vom Windows-PC

SSH und Desktop-Install liegen unter `scripts/pi/`:

```powershell
cd ..\..\..\scripts\pi
.\run-lightweight-desktop-from-windows.ps1
```

Oder lokaler Cursor-Agent mit Prompt aus `scripts/pi/LOCAL-AGENT-PROMPT.md` (**Run on: This Computer**).
