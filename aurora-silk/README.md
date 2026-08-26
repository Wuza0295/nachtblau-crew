# Aurora Silk

Mac-inspiriertes **Custom-Bootc-Image** auf Basis von [Aurora](https://getaurora.dev/) (Universal Blue / Fedora Atomic, KDE Plasma).

> **Wichtig:** Das ist **kein** macOS und kein 1:1-Klon. Apples UI, Marken und System sind geschützt. Silk nutzt ausschließlich Open-Source-Themes (z. B. WhiteSur) und eigene Helfer – Optik und Workflow sind *angelehnt*, nicht identisch.

## Was drin ist

| Bereich | Umsetzung |
|--------|-----------|
| Basis | `ghcr.io/ublue-os/aurora:stable` (AMD/Open, KDE) |
| Optik | WhiteSur Themes/Icons/Cursor, Top-Bar + Dock-Layout (`silk-apply-layout`) |
| AMD | Mesa/RADV, Sysctl, NVMe-Kyber-Udev, optionale Kernel-Args-Doku |
| Lightweight | niedrige Swappiness, BBR, Power-Profiles, schlankes Paketset |
| Gaming | GameMode, MangoHud, Gamescope, Steam/Heroic/Lutris/Bottles via Flatpak (`silk-install --setup-gaming`) |
| Windows-Apps | `.exe`/`.msi` → Flatpak-Gegenstück suchen, sonst Bottles/Wine |
| Android-Apps | `.apk` → Flatpak-Gegenstück suchen, sonst Waydroid |

## Schnellstart (auf einem Aurora/Bazzite/Bluefin-Rechner)

1. Dieses Verzeichnis als **eigenes GitHub-Repo** nutzen (oder den Ordner `aurora-silk/` auschecken).
2. Cosign-Key erzeugen und als Secret `SIGNING_SECRET` hinterlegen (siehe unten).
3. In `silk.env` `REPO_ORGANIZATION` auf deinen GitHub-User setzen.
4. Push → GitHub Actions baut das Image nach `ghcr.io/<user>/aurora-silk`.
5. Rebase:

```bash
sudo bootc switch ghcr.io/<user>/aurora-silk:latest
# oder älter:
# sudo rpm-ostree rebase ostree-unverified-registry:ghcr.io/<user>/aurora-silk:latest
sudo systemctl reboot
```

Nach dem ersten Login: **Aurora Silk Setup** fragt nach Gaming-Flatpaks. Layout jederzeit:

```bash
silk-apply-layout
silk-install --setup-gaming
```

### Smart Installer

```bash
silk-install setup.exe          # sucht Flatpak, sonst Wine/Bottles
silk-install app.apk            # sucht Flatpak, sonst Waydroid
silk-install firefox            # installiert Flatpak-Alias
silk-install --search discord
silk-install datei.exe --force-compat   # ohne Gegenstück-Dialog
```

## Cosign (Pflicht für Builds)

```bash
cd aurora-silk
COSIGN_PASSWORD="" cosign generate-key-pair
# cosign.key → GitHub Actions Secret SIGNING_SECRET
# cosign.pub committen (nie den .key!)
```

## Lokal bauen (optional)

Voraussetzungen: `podman`, `just`, genug Platte (~20 GB+).

```bash
cd aurora-silk
just build aurora-silk latest
```

## Ordnerstruktur

```
aurora-silk/
  Containerfile          # FROM aurora:stable
  silk.env               # Image-Name / Org
  build_files/           # Pakete, Themes, Gaming, Compat
  system_files/          # Defaults, silk-*, Sysctl, Desktop-MIME
  disk_config/           # ISO (KDE)
  tests/                 # Offline-Tests der Helfer-Skripte
```

## Grenzen (ehrlich)

- Kein macOS-Kernel, kein App Store, keine iMessage/FaceTime/AirDrop-1:1-Erfahrung.
- Nicht jedes `.exe`/`.apk` läuft (Anti-Cheat, Treiber, DRM).
- Waydroid braucht funktionierende Binder/Kernel-Unterstützung.
- Vollständiger Image-Build läuft über CI/Podman – nicht in dieser Web-App-Umgebung.

## Lizenz

Upstream-Template: Universal Blue image-template (Apache-2.0). Themes: jeweilige Lizenzen der WhiteSur-Projekte.
