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

## VirtualBox (PC-Test)

Siehe [docs/VIRTUALBOX.md](docs/VIRTUALBOX.md) bzw.:

```bash
./scripts/test-silk-virtualbox.sh all
# in der VM nach Aurora-Install:
sudo bootc switch ghcr.io/wuza0295/silk:latest && sudo systemctl reboot
```
