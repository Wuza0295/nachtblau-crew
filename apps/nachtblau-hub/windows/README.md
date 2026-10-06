# NachtBlau Hub — Windows

Electron-Shell wie unter Bazzite/Linux. Inhalt kommt live vom Webspace
(`windowsUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/windows.html`).

Die Seite wird aus der Bazzite-/Linux-Seite erzeugt (`pnpm hub:sync-bazzite-windows` im Repo-Root). Ohne diesen Sync antwortet `/windows` mit 404.

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
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1
```

Oder Doppelklick auf `Install-NachtBlauHub.cmd` (empfohlen — umgeht ExecutionPolicy).

Das Skript prüft Node/pnpm, führt `pnpm install` aus und legt **standardmäßig** (ohne Admin) Shortcuts an:

- Desktop: `NachtBlau Hub.lnk` (Known Folder + klassischer Desktop + OneDrive-Desktop, falls vorhanden)
- Startmenü: `NachtBlau` → `NachtBlau Hub`

Am Ende zeigt das Skript die **vollen Pfade** der erzeugten `.lnk`-Dateien.

Optionen:

| Parameter | Wirkung |
|-----------|---------|
| `-Start` | Nach Install sofort `pnpm start` |
| `-NoShortcut` | Keine Shortcuts |
| `-SkipInstall` | Nur Shortcuts / Checks, kein `pnpm install` |

### Shortcuts nachziehen (Repo schon da, nichts auf dem Desktop)

```powershell
cd $HOME\Documents\nachtblau-crew   # ggf. dein Clone-Pfad
git fetch origin cursor/pi-lightweight-desktop-3ddb
git checkout cursor/pi-lightweight-desktop-3ddb
git pull origin cursor/pi-lightweight-desktop-3ddb
cd apps\nachtblau-hub\windows
powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1 -SkipInstall
```

Nur Shortcuts, ohne erneutes `pnpm install`. Danach Desktop / Startmenü auf „NachtBlau Hub“ prüfen (Pfad steht in der Skript-Ausgabe).

Falls die Execution Policy blockiert (direktes `.\Install-…ps1`):

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
