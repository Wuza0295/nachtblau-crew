# Silk – Installation in 5 Minuten

> **Eigenständiges OS.** Du installierst **Silk**, nicht Aurora.  
> Aurora ist nur die technische Build-Basis (wie Fedora bei Bazzite) – für dich unsichtbar.

Kein macOS, kein Windows, kein offizielles Aurora-/Apple-/Microsoft-Produkt.

---

## VirtualBox – **ein Befehl**

Voraussetzung: VirtualBox installiert, `vboxdrv` läuft.

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/aurora-silk-os-2818/silk/scripts/go-virtualbox.sh | bash
```

Oder aus dem Repo:

```bash
./test-silk-virtualbox.sh
```

Das Skript lädt die Silk-ISO (~6 GB), baut die VM **Silk** (Linux 64-bit, nicht Fedora), startet VirtualBox. In der VM: Silk installieren → `silk-setup`.

Erneut starten: `./silk/scripts/test-silk-virtualbox.sh start`

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
