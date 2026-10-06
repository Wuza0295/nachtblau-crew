# NachtBlau Hub — Linux / Bazzite / Aurora

Electron-Shell wie unter Windows. Inhalt kommt live vom Webspace
(`linuxUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/linux.html`).

## Bazzite: einmalig installieren

Voraussetzungen: **Node.js** und **pnpm** (kein Root für den Hub selbst).

Auf dem unveränderlichen Bazzite-System oft über Homebrew oder Toolbox:

```bash
# Repo holen
git clone -b cursor/bazzite-windows-sync-8c11 https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew/apps/nachtblau-hub/linux
chmod +x install-nachtblau-hub.sh start-nachtblau-hub.sh
./install-nachtblau-hub.sh
```

Das Skript prüft Node/pnpm, führt `pnpm install` aus und legt **standardmäßig** (ohne Root) Shortcuts an:

- Desktop: `NachtBlau Hub.desktop` (`~/Desktop` oder `~/Schreibtisch`)
- Anwendungsmenü: `~/.local/share/applications/NachtBlau Hub.desktop`

Optionen:

| Parameter | Wirkung |
|-----------|---------|
| `--start` | Nach Install sofort `pnpm start` |
| `--no-shortcut` | Keine Shortcuts |
| `--skip-install` | Nur Shortcuts / Checks, kein `pnpm install` |

### Shortcuts nachziehen

```bash
cd ~/nachtblau-crew   # ggf. dein Clone-Pfad
git fetch origin cursor/bazzite-windows-sync-8c11
git checkout cursor/bazzite-windows-sync-8c11
git pull origin cursor/bazzite-windows-sync-8c11
cd apps/nachtblau-hub/linux
./install-nachtblau-hub.sh --skip-install
```

## Start (danach)

```bash
cd apps/nachtblau-hub/linux
pnpm start
```

Oder Shortcut „NachtBlau Hub“ auf dem Desktop / im Anwendungsmenü.

## Gleicher Stand wie Windows

`pnpm sync` (im Repo-Root: `pnpm hub:sync`) erzeugt `linux.html` und `windows.html` aus derselben `index.html`.
