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
| `.exe` / `.msi` | Flatpak → sonst Wine/Bottles |
| `.apk` | Flatpak → sonst Waydroid |
| `.dmg` / `.pkg` / `.app` | Flatpak-Gegenstück |
| `.AppImage` | Flatpak → sonst Gear Lever / `~/Applications` |
| `.flatpak` / `.flatpakref` | `flatpak install` |
| `.deb` | Flatpak → sonst Ubuntu-Distrobox |
| `.rpm` | Flatpak → rpm-ostree oder Fedora-Box |
| `.snap` | Flatpak → sonst Snap in Ubuntu-Box |

```bash
silk-install --setup-essentials
silk-install --ensure-boxes
silk-install etwas.AppImage
silk-install paket.deb
silk-welcome
```

Beim ersten Login: Stil wählen → **Alltags-Apps automatisch** → optional Gaming → Willkommen. Doppelklick auf Installer-Dateien reicht.

## Was Wechsler zum Start bekommen

- **Alltag:** LibreOffice, Firefox, VLC, Thunderbird, Bitwarden, Dropbox, Rclone, Zoom/Teams/Slack, Pika Backup, Gear Lever, Warehouse, Flatseal
- **Pakete:** AppImage, Flatpak, deb, rpm, snap (Flatpak zuerst, sonst Distrobox)
- **Datenträger:** NTFS + exFAT, SMB-Client
- **Fonts:** Liberation + Noto (+ MS-Core wo verfügbar)
- **Defaults:** PDF/Office/Medien + Installer-MIME
- **Hilfe:** `silk-welcome`
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
