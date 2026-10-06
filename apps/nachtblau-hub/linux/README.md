# NachtBlau Hub — Linux (Bazzite / Aurora / Fedora)

> **Nur bash auf dem Linux-Desktop.** Keine PowerShell-Befehle hier pasten.
> Pi-Upgrades (`scripts/pi/upgrade-all.sh`) laufen **nicht** auf Bazzite — nur auf dem Raspberry Pi per SSH.

Electron-Shell wie unter Windows. Inhalt kommt live vom Webspace
(`linuxUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/linux.html`).

## Bazzite: einmalig installieren

Voraussetzungen: **Node.js LTS** und **pnpm** (kein sudo für den Hub selbst).
Auf Bazzite oft: `brew install node`, danach `npm install -g pnpm` oder Corepack.

```bash
# Repo holen / Branch aktualisieren
cd ~
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
# Falls schon geclonet:
#   cd ~/nachtblau-crew
#   git fetch origin cursor/pi-lightweight-desktop-3ddb
#   git checkout cursor/pi-lightweight-desktop-3ddb
#   git pull origin cursor/pi-lightweight-desktop-3ddb

cd ~/nachtblau-crew/apps/nachtblau-hub/linux
chmod +x Install-NachtBlauHub.sh Start-NachtBlauHub.sh
./Install-NachtBlauHub.sh
```

Das Skript prüft Node/pnpm, führt `pnpm install` aus und legt **standardmäßig** an:

- Desktop: `NachtBlau Hub.desktop` (unter `~/Desktop` bzw. `~/Schreibtisch`)
- App-Menü: `~/.local/share/applications/nachtblau-hub.desktop`

| Schalter | Wirkung |
|----------|---------|
| `--start` | Nach Install sofort `pnpm start` |
| `--no-shortcut` | Keine Desktop-Datei |
| `--skip-install` | Nur Shortcut / Checks, kein `pnpm install` |

### Shortcuts nachziehen (Repo schon da)

```bash
cd ~/nachtblau-crew
git fetch origin cursor/pi-lightweight-desktop-3ddb
git checkout cursor/pi-lightweight-desktop-3ddb
git pull origin cursor/pi-lightweight-desktop-3ddb
cd apps/nachtblau-hub/linux
./Install-NachtBlauHub.sh --skip-install
```

## Start (danach)

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
pnpm start
```

Oder Desktop-/App-Menü-Eintrag „NachtBlau Hub“.

## Abhängigkeiten aktualisieren

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
pnpm install
pnpm update
pnpm start
```

## Manuell ohne Install-Skript

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
pnpm install
pnpm start
```

## Was hier **nicht** hingehört

| Falsch auf Bazzite | Richtig |
|--------------------|---------|
| `sudo ./scripts/pi/upgrade-all.sh` | SSH zum Pi, **dort** im Clone ausführen — siehe `scripts/pi/README.md` |
| PowerShell / `cd apps\nachtblau-hub\windows` | Bash + Forward-Slashes: `apps/nachtblau-hub/linux` |
| `powershell … Install-NachtBlauHub.ps1` | `./Install-NachtBlauHub.sh` in diesem Ordner |
