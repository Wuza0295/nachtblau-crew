# Silk – Installation in 5 Minuten

> **Eigenständiges OS.** Du installierst **Silk**, nicht Aurora.  
> Aurora ist nur die technische Build-Basis (wie Fedora bei Bazzite) – für dich unsichtbar.

Kein macOS, kein Windows, kein offizielles Aurora-/Apple-/Microsoft-Produkt.

---

## Variante A – Installer-ISO (VirtualBox / USB) ✅ empfohlen

1. ISO laden: https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest  
   (ggf. `*.part*` mit `bash reassemble.sh` zusammenfügen → **`Silk-Installer-x86_64.iso`**)
2. VirtualBox: EFI an, ≥4 GB RAM, ISO booten → **Silk installieren**  
   (oder USB erstellen und auf Hardware booten)
3. Nach dem Login: `silk-setup`

Anleitung: [docs/VIRTUALBOX.md](docs/VIRTUALBOX.md)

Fertige VM-Disk: `Silk-VM-x86_64.qcow2` im gleichen Release.

---

## Variante B – Rebase (wenn schon Bootc läuft)

| Startpunkt | OK? |
|------------|-----|
| Bazzite / Bluefin / Aurora / Fedora Atomic | ✅ |

| GPU | Image |
|-----|--------|
| **AMD / Intel** | `ghcr.io/wuza0295/silk:latest` |
| **NVIDIA** (Turing+) | `ghcr.io/wuza0295/silk-nvidia-open:latest` |
| **Apple Silicon** | `ghcr.io/wuza0295/silk-asahi:latest` (nach Fedora Asahi Remix) |

```bash
sudo bootc switch ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
silk-setup
```

---

## Nach der Installation

```bash
silk-welcome
silk-desktop mac          # oder windows11 / windows10
silk-install datei.exe    # Smart-Installer
silk-update
```

Mehr: [PUBLISH.md](PUBLISH.md) · [docs/PLATFORMS.md](docs/PLATFORMS.md) · [ROADMAP.md](ROADMAP.md)
