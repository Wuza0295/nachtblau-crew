# Silk – Installation in 5 Minuten

> **Eigenständiges OS.** Du installierst **Silk**, nicht Aurora.  
> Aurora ist nur die technische Build-Basis (wie Fedora bei Bazzite) – für dich unsichtbar.

Kein macOS, kein Windows, kein offizielles Aurora-/Apple-/Microsoft-Produkt.

---

## VirtualBox – **ein Befehl**

Voraussetzung: VirtualBox + `vboxdrv`.

```bash
# 1) Skript vom Release laden (mit ISO-Parts):
mkdir -p ~/Silk-VMs && cd ~/Silk-VMs
curl -fsSL -O https://github.com/Wuza0295/nachtblau-crew/releases/download/silk-media-latest/reassemble.sh
curl -fsSL -O https://github.com/Wuza0295/nachtblau-crew/raw/cursor/aurora-silk-os-2818/silk/scripts/go-virtualbox.sh
bash go-virtualbox.sh
```

Lädt ISO, VM **Silk**, startet VirtualBox. Kein Aurora.

## Variante A – Installer-ISO (VirtualBox / USB) ✅ empfohlen

Release (manuell): https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest

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
