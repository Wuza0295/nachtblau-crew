# Silk publishen – Geräte-Übersicht

Silk ist über GHCR öffentlich. Installation = `bootc switch` vom bestehenden Bootc-System.

## Images

| Gerät / GPU | Image | Status |
|-------------|-------|--------|
| PC/Laptop **AMD / Intel** | `ghcr.io/wuza0295/silk:latest` | ✅ |
| PC/Laptop **NVIDIA** (Turing+) | `ghcr.io/wuza0295/silk-nvidia-open:latest` | ✅/🔄 CI |
| **Apple Silicon** Mac (M1+) | `ghcr.io/wuza0295/silk-asahi:latest` | 🔄 CI (ARM) |
| Intel-MacBook | — | ❌ kein natives Image (`silk-asahi intel-mac`) |

## Installation

### AMD / Intel

```bash
sudo bootc switch ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
silk-setup
```

### NVIDIA

```bash
sudo bootc switch ghcr.io/wuza0295/silk-nvidia-open:latest
sudo systemctl reboot
silk-setup
```

### Apple Silicon (MacBook / Mac mini / iMac)

1. [Fedora Asahi Remix](https://fedora-asahi-remix.org/) in macOS installieren  
2. Atomic/Kinoite aktivieren  
3. Dann:

```bash
sudo bootc switch ghcr.io/wuza0295/silk-asahi:latest
sudo systemctl reboot
silk-asahi setup
silk-desktop mac
```

Nach Updates auf dem Mac: `sudo bootc upgrade && sudo update-m1n1 && reboot`

## Zurück (Beispiel Bazzite)

```bash
sudo bootc switch ghcr.io/ublue-os/bazzite:stable
sudo systemctl reboot
```

## GHCR-Sichtbarkeit

GitHub → Packages → `silk` / `silk-nvidia-open` / `silk-asahi` → **Public**

## CI

`.github/workflows/silk-build.yml` baut:
- `silk` + `silk-nvidia-open` auf `ubuntu-24.04`
- `silk-asahi` auf `ubuntu-24.04-arm`

## VirtualBox / USB – eigenständiges Silk

**Kein Aurora-Download.** Install-Medium ist Silk:

- Release: https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest  
- `Silk-Installer-x86_64.iso.part*` / `Silk-VM-x86_64.qcow2.part*` (+ `reassemble.sh`)  
  (GitHub-Limit 2 GiB → gesplittet; `bash reassemble.sh` ergibt die Volldateien)
- Anleitung: [docs/VIRTUALBOX.md](docs/VIRTUALBOX.md)

```bash
./scripts/test-silk-virtualbox.sh all
```

CI: `.github/workflows/silk-disk.yml` (baut ISO+QCOW aus `silk:latest`).

Aurora ist nur die **technische Basis** im Container-Build – für Nutzer ist das Produkt Silk.
