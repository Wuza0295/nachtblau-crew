# Silk – Installation nach Gerät

> **Universal:** `silk-platform setup` erkennt dein Gerät und startet das passende Setup.

---

## PC / Laptop

```bash
silk-installer switch    # von Aurora/Bazzite
# oder USB-ISO: silk-installer iso
sudo systemctl reboot
silk-setup
```

NVIDIA: automatisch `silk-nvidia-open`-Image.

---

## Tablet / 2-in-1

```bash
silk-tablet setup
# oder: silk-desktop tablet
```

---

## MacBook (Apple Silicon M1/M2/M3/M4)

```bash
# 1. Zuerst Fedora Asahi Remix installieren (in macOS):
#    https://fedora-asahi-remix.org/

# 2. Dann auf Silk wechseln:
silk-asahi switch
sudo systemctl reboot
silk-asahi setup
silk-desktop mac
```

---

## Intel-MacBook

```bash
silk-asahi intel-mac    # Alternativen anzeigen
```

Kein natives Silk – nutze PC mit `silk-desktop mac` oder Connect.

---

## Smartphone

### Android
```bash
silk-mobile android     # Waydroid + KDE Connect
silk-connect setup      # Dashboard für Phone
```

### iPhone / iPad
```bash
silk-connect setup      # auf Silk-PC/Mac
silk-connect pair       # Anleitung für Safari
```

### Linux-Phone
```bash
silk-mobile devices
silk-mobile install
```

---

## Hilfe

```bash
silk-doctor
silk-platform guide
```

Vollständig: [`docs/PLATFORMS.md`](docs/PLATFORMS.md)
