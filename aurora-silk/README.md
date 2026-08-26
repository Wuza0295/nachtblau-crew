# Aurora Silk

Custom-Bootc-Image auf [Aurora](https://getaurora.dev/) für **Wechsler von macOS und Windows** – Optik wählbar, Programme möglichst „wie vorher“ nutzbar.

> Kein macOS und kein Windows. Open-Source-Themes (WhiteSur / Fluent) und Kompatibilitätsschichten – keine Apple-/Microsoft-Markenassets.

## Desktop-Stil

Beim ersten Login fragt Silk, woher du kommst:

| Befehl | Optik |
|--------|--------|
| `silk-desktop mac` | Menüleiste + Dock |
| `silk-desktop windows11` | zentrierte Taskleiste |
| `silk-desktop windows10` | klassische Taskleiste links |
| `silk-desktop --ask` | Dialog erneut |

## Programme „wie vorher“

`silk-install` / Doppelklick:

| Datei | Verhalten |
|-------|-----------|
| `.exe` / `.msi` | Flatpak-Gegenstück suchen → sonst Bottles/Wine |
| `.apk` | Flatpak → sonst Waydroid |
| `.dmg` / `.pkg` / `.app` | Flatpak-Gegenstück (Mac-Binaries laufen **nicht**) |

```bash
silk-install DiscordSetup.exe
silk-install Firefox.app
silk-install GoogleChrome.dmg
silk-install --setup-gaming
silk-install --search notion
```

Bekannte Zuordnungen liegen in `usr/share/silk/app-aliases.json` (z. B. Safari→Firefox, Explorer→Dolphin, Word→LibreOffice).

## Basis

- Image: `ghcr.io/ublue-os/aurora:stable` (AMD/Open, KDE)
- AMD/Lightweight: Sysctl, NVMe-Kyber, Mesa/RADV
- Gaming: GameMode, MangoHud, Gamescope + Flatpaks

## Build / Rebase

1. Cosign-Secret `SIGNING_SECRET` setzen (`cosign.key`)
2. `silk.env` → `REPO_ORGANIZATION`
3. CI baut → rebase:

```bash
sudo bootc switch ghcr.io/<user>/aurora-silk:latest
sudo systemctl reboot
```

Lokal: `cd aurora-silk && just build aurora-silk latest`

## Grenzen (ehrlich)

- Mac-Apps starten nicht nativ; Silk sucht Linux-Ersatz.
- Nicht jedes `.exe` läuft (Anti-Cheat, Treiber, DRM).
- Optik ist angelehnt, kein 1:1-Klon von macOS/Windows.

## Tests

```bash
bash aurora-silk/tests/run-offline-tests.sh
```
