# Silk

**Silk** ist ein eigenständiges Custom-Bootc-Image (kein Upstream-Produktname).  
Technische Basis: [Universal Blue Aurora](https://getaurora.dev/) – nur als Upstream, nicht als Markenname.

Für **Wechsler von macOS und Windows**: Optik wählbar, Programme möglichst „wie vorher“ nutzbar.

> Kein macOS und kein Windows. Open-Source-Themes (WhiteSur / Fluent) – keine Apple-/Microsoft-Markenassets.

## Name

Produktname: **Silk** / Image: `silk`  
Nicht „Aurora …“ – Aurora ist bereits das Universal-Blue-Desktop. Upstream erwähnen wir nur technisch (`FROM …/aurora:stable`).

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
silk-install --setup-essentials   # Office, Mail, VLC, Cloud, Zoom/Teams, Backup
silk-install --setup-gaming
silk-install DiscordSetup.exe
silk-welcome                      # Wechsler-Checkliste
```

Beim ersten Login: Desktop-Stil → Alltagspaket → optional Gaming → Willkommen.

## Was Wechsler zum Start bekommen

- **Alltag:** LibreOffice, Firefox, VLC, Thunderbird, Bitwarden, Dropbox, Rclone (OneDrive/Google Drive/iCloud), Zoom/Teams/Slack, Pika Backup
- **Datenträger:** NTFS + exFAT, SMB-Client
- **Fonts:** Liberation + Noto (+ MS-Core wo verfügbar)
- **Defaults:** PDF/Office/Medien öffnen mit vertrauten Apps
- **Hilfe:** `silk-welcome` (auch Autostart einmalig)
## Basis & Updates

- **Base-Image:** `ghcr.io/ublue-os/aurora:stable` (floating Tag, kein Digest-Pin)
- CI baut **täglich** neu und zieht Upstream mit `--pull=always`
- Silk-Layer liegt **oben** auf dem Aurora-Base

### Updates einspielen

```bash
sudo bootc upgrade && sudo systemctl reboot
# oder: ujust update
# oder: rpm-ostree upgrade && sudo systemctl reboot
```

### Upstream vs. Bazzite

Silk trackt **nur** Aurora als Base (nie `FROM` Bazzite). Gaming-Flatpaks/Tools können Bazzite-*ähnlich* sein; wer maximale Gaming-Integration will, nimmt ggf. direkt [Bazzite](https://bazzite.gg/).

## Was im Image steckt

- AMD/Lightweight: Sysctl, NVMe-Kyber, Mesa/RADV
- Gaming: Steam, Steam Link, Heroic, itch.io, Discord, OBS, Minecraft (Prism), osu!, RetroArch, Dolphin, PPSSPP, Moonlight, Chiaki, GeForce Now, Bottles/Lutris + GameMode/MangoHud

## Build / Rebase

1. Cosign-Secret `SIGNING_SECRET` (`cosign.key` – nicht committen)
2. `silk.env` → `REPO_ORGANIZATION`
3. CI baut → rebase:

```bash
sudo bootc switch ghcr.io/<user>/silk:latest
sudo systemctl reboot
```

Lokal: `cd silk && just build silk latest`

## Grenzen

- Mac-Apps starten nicht nativ; Silk sucht Linux-Ersatz.
- Nicht jedes `.exe` läuft (Anti-Cheat, Treiber, DRM).
- Optik ist angelehnt, kein 1:1-Klon.

## Tests

```bash
bash silk/tests/run-offline-tests.sh
```
