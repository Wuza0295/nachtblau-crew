# Silk

**Silk** ist ein eigenständiges Custom-Bootc-Image (kein Upstream-Produktname).  
Technische Basis: [Universal Blue Aurora](https://getaurora.dev/) – nur als Upstream, nicht als Markenname.

Für **Wechsler von macOS und Windows**: Optik wählbar, Programme möglichst „wie vorher“ nutzbar.

> Kein macOS und kein Windows. Open-Source-Themes (WhiteSur / Fluent) – keine Apple-/Microsoft-Markenassets.

## Name

Produktname: **Silk** / Image: `silk`  
Nicht „Aurora …“ – Aurora ist bereits das Universal-Blue-Desktop. Upstream erwähnen wir nur technisch (`FROM …/aurora:stable`).

**Schnellstart:** [`QUICKSTART.md`](QUICKSTART.md) · **Website-Vorlage:** [`docs/website/index.html`](docs/website/index.html)

## Desktop-Stil

Beim ersten Login fragt Silk, woher du kommst:

| Befehl | Optik |
|--------|--------|
| `silk-desktop mac` | Menüleiste + Dock |
| `silk-desktop windows11` | zentrierte Taskleiste |
| `silk-desktop windows10` | klassische Taskleiste links |
| `silk-desktop tablet` | Touch / 2-in-1 (große Taskleiste) |
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
- **Hintergrund:** 20 Desktop- + 20 Sperrbild-Varianten (Mac 01–10, Windows 11–20), `silk-wallpaper list/set/random`
- **Hilfe:** `silk-welcome`

## Verteilung & Updates (wichtig)

**Git ≠ System-Update für Nutzer.** Das Repo ist die **Quelle**; Nutzer installieren ein **fertiges OS-Image**, kein `git clone` auf dem Desktop.

| Rolle | Was |
|-------|-----|
| **Entwickler** | Änderungen in Git → Push → GitHub Actions baut Image |
| **Registry** | `ghcr.io/<user>/silk:latest` (signiert mit Cosign) |
| **Erstinstallation** | ISO (optional) oder `bootc switch` von Aurora/Bazzite |
| **Nutzer-Update System** | `sudo bootc upgrade` (+ Reboot) |
| **Nutzer-Update Apps** | `flatpak update` oder `silk-update` |
| **Listen ohne Rebuild** | `silk-sync-config` zieht Aliases/Essentials vom Git-`main` |

### Drei Update-Ebenen

1. **Aurora-Base** – Universal Blue; Silk-CI baut **täglich** neu mit frischem `aurora:stable`
2. **Silk-Image** – Skripte, Themes, Pakete im Container → kommt mit `bootc upgrade`
3. **Apps & Listen** – Flatpaks + `recommended-*.txt` / `app-aliases.json` via Git-Raw-URL

```bash
silk-update              # Git-Listen + Flatpaks
silk-update --full       # + bootc upgrade (Neustart)
silk-sync-config         # nur Listen vom Repo
```

Repo-URL für Listen: `SILK_CONFIG_URL` (Standard: dieses GitHub-Repo `main/silk/system_files/usr/share/silk`).

### Angebot an Nutzer (empfohlen)

1. Eigenes Repo (oder Fork) mit `silk/` + Actions + `SIGNING_SECRET`
2. Öffentliches Package: `ghcr.io/wuza0295/silk:latest`
3. Kurze Install-Anleitung im README + optional ISO aus `just build-iso`
4. Kein „git pull“ auf dem laufenden System – nur `bootc switch` / `bootc upgrade`

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

## GPU-Unterstützung (AMD / Intel / NVIDIA)

| GPU | Silk-Image | Basis |
|-----|------------|-------|
| **AMD** | `ghcr.io/<user>/silk:latest` | `aurora:stable` (Mesa/RADV) |
| **Intel** (iGPU/Arc) | `ghcr.io/<user>/silk:latest` | `aurora:stable` (Mesa/i915/Xe) |
| **NVIDIA** (Turing/16xx+) | `ghcr.io/<user>/silk-nvidia-open:latest` | `aurora-nvidia-open:stable` |

```bash
silk-gpu status          # erkannte GPU + empfohlenes Image
silk-gpu hints           # Kernel-Args & Image-Hinweise
sudo bootc switch --enforce-container-sigpolicy ghcr.io/<user>/silk-nvidia-open:latest
```

**Hinweis:** Ältere NVIDIA-GPUs (Pascal/Maxwell, GTX 9xx/10xx) werden von `nvidia-open` nicht unterstützt – dort ggf. [Bazzite](https://bazzite.gg/) mit Legacy-Treibern.

## Mac / MacBook (Hardware vs. Software)

| Szenario | Silk? | Hinweis |
|----------|-------|---------|
| **Wechsel von macOS auf PC** | ✅ | Mac-Optik, `.dmg`/`.app`-Installer, App-Aliase |
| **Silk auf Intel-MacBook** | ❌ | x86_64, aber T2/WLAN/Firmware – nicht supported |
| **Silk auf Apple Silicon (M1+)** | ❌ | Braucht [Fedora Asahi Remix](https://fedora-asahi-remix.org/); `silk-asahi` geplant |

```bash
silk-hardware status     # PC / intel-mac / apple-silicon erkennen
silk-hardware hints      # Kompatibilität & Alternativen
silk-install meine.app   # Mac-Datei → Linux-Ersatz (auf Silk-PC)
```

Silk ist ein **PC-/Laptop-Image** (Aurora), kein MacBook-Installationsmedium. Für Linux **auf dem Mac** selbst: Asahi Remix, nicht Silk.

## Silk Connect (iPhone / iPad / Begleitgeräte)

Silk läuft **nicht nativ** auf iPhone/iPad. **Silk Connect** bindet alte Apple-Geräte als Begleiter an:

```bash
silk-connect setup      # Dashboard-Server + Pairing
silk-connect pair       # Anleitung für Safari auf iOS
silk-connect kdeconnect # Android ↔ Silk
silk-connect remote     # RustDesk / Parsec
silk-doctor             # Diagnose inkl. Connect
```

Details: [`docs/CONNECT.md`](docs/CONNECT.md) · Multi-Plattform: [`docs/PLATFORMS.md`](docs/PLATFORMS.md)

## Multi-Plattform (PC, Tablet, Mac, Smartphone)

```bash
silk-platform setup     # Erkennt Gerät automatisch
silk-installer          # PC-Installation
silk-tablet setup       # Touch-Tablet
silk-asahi install      # MacBook M1+
silk-mobile setup       # Smartphone
```

| Gerät | Lösung |
|-------|--------|
| PC | `silk-installer switch` |
| Tablet | `silk-tablet setup` |
| MacBook M1+ | `silk-asahi` |
| iPhone/iPad | `silk-connect` |
| Android | `silk-mobile` + Connect |

## Was im Image steckt

- AMD/Lightweight: Sysctl, NVMe-Kyber, Mesa/RADV
- Intel: `intel-gpu-firmware`, `intel-media-driver`, i915/Xe Udev
- NVIDIA: `silk-nvidia-open` Image (aurora-nvidia-open Basis), `silk-gpu hints`
- Gaming: Steam, Steam Link, Heroic, itch.io, Discord, OBS, Minecraft (Prism), osu!, RetroArch, Dolphin, PPSSPP, Moonlight, Chiaki, GeForce Now, Bottles/Lutris + GameMode/MangoHud

## Build / Rebase

1. Cosign-Secret `SIGNING_SECRET` (`cosign.key` – nicht committen)
2. `silk.env` → `REPO_ORGANIZATION`
3. CI baut → rebase:

```bash
sudo bootc switch ghcr.io/<user>/silk:latest
sudo systemctl reboot
```

Lokal:

```bash
cd silk && just build silk latest
just build silk-nvidia-open latest ghcr.io/ublue-os/aurora-nvidia-open:stable
```

## Grenzen

- Mac-Apps starten nicht nativ; Silk sucht Linux-Ersatz (`.dmg`/`.app` via `silk-install`).
- Silk läuft nicht auf MacBook-Hardware (Intel-Mac / Apple Silicon) – `silk-hardware hints`.
- Silk läuft nicht nativ auf iPhone/iPad – nutze **Silk Connect** als Begleiter.
- Nicht jedes `.exe` läuft (Anti-Cheat, Treiber, DRM).
- Optik ist angelehnt, kein 1:1-Klon.

## Tests

```bash
bash silk/tests/run-offline-tests.sh
```
