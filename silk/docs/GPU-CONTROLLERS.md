# GPU & Controller auf Silk

## Grafikkarten

| GPU | Image | Befehl |
|-----|-------|--------|
| **AMD** | `silk:latest` | Mesa RADV – volle Unterstützung |
| **Intel** | `silk:latest` | Mesa ANV / Xe |
| **NVIDIA Turing+** (RTX, GTX 16xx+) | `silk-nvidia-open:latest` | nvidia-open |
| **NVIDIA älter** (GTX 9xx/10xx) | `silk-nvidia:latest` | proprietärer Treiber |

```bash
silk-gpu status      # erkennt Karte + empfiehlt Image
silk-gpu switch      # bootc switch zum richtigen Image
silk-gpu vulkan      # Vulkan-Check
silk-gpu doctor      # Diagnose
```

Silk enthält u. a. GameMode, MangoHud, gamescope, 32-Bit-Mesa (Steam), AMD-Firmware/VAAPI.

## Controller

Ziel: **Xbox, DualSense/DualShock, Switch Pro/Joy-Con, 8BitDo, Logitech, generische HID** – USB und Bluetooth.

```bash
silk-controllers status
silk-controllers setup    # udev, input-Gruppe, Bluetooth
silk-controllers test     # jstest
silk-controllers doctor
```

Im Image: `steam-devices`, Silk-udev-Regeln, optional `game-devices-udev`, Bluetooth.

**Tipp:** Steam Input aktivieren (`silk-install --setup-gaming`) – beste Kompatibilität in Spielen.

## Erstlogin

`silk-setup` erkennt die GPU und richtet Controller mit ein; bei NVIDIA wird ein Image-Wechsel angeboten.
