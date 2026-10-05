# GPU & Controller auf Silk

**Auspacken und loslegen:** Beim ersten Boot erkennt Silk die GPU und wechselt bei NVIDIA
automatisch das Image. Controller stecken oder per Bluetooth koppeln – on the fly.
Details: [`OUT-OF-BOX.md`](OUT-OF-BOX.md) · Befehl: `silk-ready`

## Grafikkarten

| GPU | Image | On the fly |
|-----|-------|------------|
| **AMD** | `silk:latest` | Sofort (Mesa RADV) |
| **Intel** | `silk:latest` | Sofort (Mesa ANV / Xe) |
| **NVIDIA Turing+** (RTX, GTX 16xx+) | `silk-nvidia-open:latest` | Auto-Switch + 1× Reboot |
| **NVIDIA älter** (GTX 9xx/10xx) | `silk-nvidia:latest` | Auto-Switch + 1× Reboot |

```bash
silk-ready           # alles prüfen
silk-gpu status      # erkannte GPU + Image
silk-gpu switch      # manuell (meist unnötig – Firstboot macht das)
silk-gpu vulkan
silk-gpu doctor
```

Abschalten Auto-Switch: `SILK_AUTO_GPU_SWITCH=0` (Profis).

Silk enthält u. a. GameMode, MangoHud, gamescope, 32-Bit-Mesa (Steam), AMD-Firmware/VAAPI.

## Controller

Ziel: **Xbox, DualSense/DualShock, Switch Pro/Joy-Con, 8BitDo, Logitech, Razer, generische HID** – USB und Bluetooth, **on the fly** (`silk-plug` jeden Boot).

```bash
silk-controllers status
silk-controllers setup    # udev, input-Gruppe, Bluetooth
silk-controllers test     # jstest
silk-controllers doctor
```

Im Image: `steam-devices`, Silk-udev-Regeln, Bluetooth.

**Tipp:** Steam Input (`silk-install --setup-gaming`) – beste Kompatibilität in Spielen.

## Automatik

1. **System-Firstboot** – GPU erkennen, NVIDIA-Image wechseln, Controller-System bereit  
2. **Jeder Boot** (`silk-plug`) – Bluetooth + udev-Trigger  
3. **Erster Login** (`silk-ready`) – Windows-.exe-Schicht, Stil, Controller-Feinschliff
