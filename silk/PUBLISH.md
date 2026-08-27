# Silk publishen – Geräte-Übersicht

Silk ist **öffentlich** über GHCR. Installation = `bootc switch` vom bestehenden Bootc-System (Bazzite, Aurora, Bluefin, …).

## Images (aktuell)

| Gerät / GPU | Image | Status |
|-------------|-------|--------|
| PC/Laptop **AMD / Intel** | `ghcr.io/wuza0295/silk:latest` | ✅ veröffentlicht |
| PC/Laptop **NVIDIA** (Turing / GTX 16xx+, RTX) | `ghcr.io/wuza0295/silk-nvidia-open:latest` | 🔄 Build/Publish |
| **Apple Silicon** MacBook | — | ❌ noch nicht (Roadmap 2.0 / Asahi) |
| Intel-Mac (Hackintosh/Bootcamp-ähnlich) | wie PC AMD/Intel | nur wenn Linux UEFI-bootfähig |

## Auf jedem unterstützten Gerät installieren

### AMD / Intel (jetzt)

```bash
sudo bootc switch ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
```

Mit Signatur-Policy (wenn Cosign-Secret gesetzt und Image signiert):

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
```

### NVIDIA

```bash
sudo bootc switch ghcr.io/wuza0295/silk-nvidia-open:latest
sudo systemctl reboot
```

### Nach dem Reboot

```bash
silk-setup
silk-welcome
```

## Zurück (z. B. zu Bazzite)

```bash
sudo bootc switch ghcr.io/ublue-os/bazzite:stable
sudo systemctl reboot
```

## Sichtbarkeit GHCR

Falls ein Image privat bleibt: GitHub → Packages → Paket `silk` / `silk-nvidia-open` →  
**Package settings → Change visibility → Public**

## CI

Build & Push: `.github/workflows/silk-build.yml`  
Branch: `cursor/aurora-silk-os-2818` (und `main` nach Merge)
