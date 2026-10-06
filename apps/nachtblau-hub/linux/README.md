# NachtBlau Hub — Bazzite / Linux

Electron-Shell wie unter Windows. Inhalt kommt live vom Webspace
(`linuxUrl` in `../hub-url.json` → `https://launcher.nachtblau-interactive.com/linux.html`).

## Bazzite: einmalig installieren

Voraussetzungen: **Node.js** und **pnpm**. Auf Bazzite ohne Systemumbau: `brew install node`, danach `corepack enable`.

```bash
cd apps/nachtblau-hub/linux
./install-bazzite.sh
```

Das Skript führt `pnpm install` aus und legt ohne Root an:

- Anwendungsmenü: `~/.local/share/applications/nachtblau-hub.desktop`
- Desktop: `NachtBlau Hub`, wenn `Desktop` oder `Schreibtisch` existiert

| Option | Wirkung |
|--------|---------|
| `--start` | Nach dem Install sofort `pnpm start` |
| `--no-shortcut` | Keine Starter |
| `--skip-install` | Nur Starter, kein `pnpm install` |

## Gleicher Stand wie Windows

Im Repo-Root, mit FTP-Zugang in `.env.webspace`:

```bash
pnpm hub:sync-bazzite-windows
```

Damit liegt auf dem Launcher dieselbe Seite unter `/linux` (Bazzite) und `/windows`.
