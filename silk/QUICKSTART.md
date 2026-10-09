# Silk – Installation nach Gerät

> **Universal:** `silk-platform setup` erkennt dein Gerät und startet das passende Setup.

---

## PC / Laptop

```bash
silk-installer switch    # von Universal Blue / Bazzite
# oder USB-ISO: silk-installer iso
sudo systemctl reboot
# Firstboot: GPU erkennen, bei NVIDIA Image wechseln (+ ggf. 1× Reboot)
# Login: silk-tour richtet Stil, Apps, Windows-.exe + Controller ein
silk-tour --center     # Startzentrum
silk-ready status
```

AMD/Intel: sofort. NVIDIA: Auto zum passenden Image (`silk-nvidia-open` oder `silk-nvidia`).  
Controller: stecken / Bluetooth – on the fly.

### Unter Windows testen (VM)

PowerShell (VirtualBox vorher installieren):

```powershell
irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex
```

Oder Doppelklick: `silk\windows\Install-SilkVM.cmd`  
Details: [`docs/VM-WINDOWS.md`](docs/VM-WINDOWS.md) · [`windows/README.md`](windows/README.md)

### Unter Bazzite testen (VM)

```bash
ujust setup-virtualization          # einmalig, dann neu anmelden
bash silk/scripts/go-bazzite-vm.sh  # fertige Disk → QEMU-Fenster
```

Details: [`docs/VM-BAZZITE.md`](docs/VM-BAZZITE.md)

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
