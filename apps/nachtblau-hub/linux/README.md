# NachtBlau Hub — Linux (Bazzite / Aurora / Fedora)

> **Nur bash auf dem Linux-Desktop.** Keine PowerShell-Befehle hier pasten.
> Pi-Upgrades (`scripts/pi/upgrade-all.sh`) laufen **nicht** auf Bazzite — nur auf dem Raspberry Pi per SSH.

Electron-Shell wie unter Windows. Inhalt kommt live vom Webspace
(`linuxUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/linux.html`).

## Bazzite + Steam (empfohlen zum Spielen)

Hub ist **natives Linux-Electron** — in Steam **ohne Proton** als Nicht-Steam-Spiel starten.

### 1) Terminal (einmalig)

```bash
cd ~
git clone -b cursor/pi-lightweight-desktop-3ddb https://github.com/Wuza0295/nachtblau-crew.git
# Falls schon geclonet:
#   cd ~/nachtblau-crew
#   git fetch origin cursor/pi-lightweight-desktop-3ddb
#   git checkout cursor/pi-lightweight-desktop-3ddb
#   git pull origin cursor/pi-lightweight-desktop-3ddb

cd ~/nachtblau-crew/apps/nachtblau-hub/linux
chmod +x Install-NachtBlauHub.sh Install-SteamShortcut.sh \
  Install-Java21-Bazzite.sh Start-NachtBlauHub.sh \
  Start-NachtBlauHub-Steam.sh Start-Lumina-With-Java.sh
./Install-SteamShortcut.sh
# Minecraft: falls Lumina „Kein Java“ zeigt → ./Install-Java21-Bazzite.sh
```

Voraussetzung: **Node.js LTS** + **pnpm** (Bazzite oft: `brew install node`, dann `npm install -g pnpm`).
`Install-SteamShortcut.sh` ruft den Hub-Installer auf, legt
`~/.local/share/applications/nachtblau-hub.desktop` an und zeigt die Steam-Schritte.

### 2) Steam UI

1. Steam öffnen  
2. **Spiele** → **Ein Nicht-Steam-Spiel hinzufügen…**  
3. **Durchsuchen…** → Datei wählen:

   `~/nachtblau-crew/apps/nachtblau-hub/linux/Start-NachtBlauHub-Steam.sh`

4. Eintrag umbenennen zu **NachtBlau Hub**  
5. **Hinzufügen** → in der Bibliothek starten  

**Kompatibilitätstool / Proton: aus** (Launch Options leer).  
Game Mode: derselbe Bibliotheks-Eintrag.

Schnelltest ohne Steam:

```bash
~/nachtblau-crew/apps/nachtblau-hub/linux/Start-NachtBlauHub-Steam.sh
```

### Minecraft / Lumina (Spielen)

Der Hub öffnet den Webspace. Zum **Minecraft Java** auf dem NachtBlau-Server:

1. Hub starten (Steam oder Desktop)  
2. **Lumina Launcher** vom Webspace laden:  
   https://launcher.nachtblau-interactive.com/downloads/  
   (AppImage auf Bazzite: ausführbar machen, starten, Microsoft-Login, RAM **6–8 GB**)  
3. In Lumina zum Server verbinden (Direktconnect / Serverliste im Launcher)

Alternativen (wenn du schon einen Client hast): Prism Launcher / offizieller Minecraft-Launcher / Flatpak — Serveradresse laut Hub-Status (Heimnetz Pi oder WAN). Projekt-Launcher: `apps/nachtblau-lumina-launcher/`.

### Java fehlt auf Bazzite

Lumina zeigt rot: *„Kein Java gefunden… Temurin 21“*. Auf Atomic/Bazzite oft kein System-JDK — User-Space reicht:

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
chmod +x Install-Java21-Bazzite.sh
./Install-Java21-Bazzite.sh
# Launcher komplett schließen und neu starten (auch über Steam)
```

Das Skript legt Temurin 21 unter `~/.local/share/nachtblau/jdk-21` ab, schreibt
`~/.config/nachtblau/java.env` und verlinkt `~/.local/bin/java`.
`Start-NachtBlauHub-Steam.sh` / `Start-NachtBlauHub.sh` laden diese Env automatisch.

**RAM:** Live-Launcher ist oft noch **1.0.10** — Slider kann bei ~29 GB stehen.
Vor **SPIELEN** auf **6–8 GB** ziehen (Client braucht kein 29 GB). Ab Repo **1.0.11**
sind Defaults enger; bis das AppImage live ist, manuell stellen.

Optional (System-Layer, Reboot): `rpm-ostree install java-21-openjdk`

---

## Bazzite: nur Hub ohne Steam

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
chmod +x Install-NachtBlauHub.sh Start-NachtBlauHub.sh Start-NachtBlauHub-Steam.sh
./Install-NachtBlauHub.sh
```

Das Skript prüft Node/pnpm, führt `pnpm install` aus und legt **standardmäßig** an:

- Desktop: `NachtBlau Hub.desktop` (unter `~/Desktop` bzw. `~/Schreibtisch`)
- App-Menü: `~/.local/share/applications/nachtblau-hub.desktop`  
  (Exec → `Start-NachtBlauHub-Steam.sh`)

| Schalter | Wirkung |
|----------|---------|
| `--start` | Nach Install sofort starten |
| `--no-shortcut` | Keine Desktop-Datei |
| `--skip-install` | Nur Shortcut / Checks, kein `pnpm install` |

### Shortcuts nachziehen (Repo schon da)

```bash
cd ~/nachtblau-crew
git fetch origin cursor/pi-lightweight-desktop-3ddb
git checkout cursor/pi-lightweight-desktop-3ddb
git pull origin cursor/pi-lightweight-desktop-3ddb
cd apps/nachtblau-hub/linux
./Install-SteamShortcut.sh --skip-install
```

## Start (danach)

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
./Start-NachtBlauHub-Steam.sh
# oder: pnpm start
```

Oder Desktop-/App-Menü-/Steam-Eintrag „NachtBlau Hub“.

## Abhängigkeiten aktualisieren

```bash
cd ~/nachtblau-crew/apps/nachtblau-hub/linux
pnpm install
pnpm update
./Start-NachtBlauHub-Steam.sh
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
| `powershell … Install-NachtBlauHub.ps1` | `./Install-NachtBlauHub.sh` / `./Install-SteamShortcut.sh` |
| Steam → Proton für den Hub | **Kein Proton** — natives Linux-Skript |
