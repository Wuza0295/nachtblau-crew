# Auspacken und loslegen

Silk soll **ohne Basteln** starten: GPU erkennen, Controller stecken, Spielen.

## Was automatisch passiert

### 1. Erster Systemstart (`silk-firstboot`)
- erkennt **AMD / Intel / NVIDIA**
- wechselt bei NVIDIA **selbst** zum richtigen Image (`silk-nvidia-open` oder `silk-nvidia`)
- ein Reboot – danach passt der Treiber
- aktiviert **Bluetooth** + Controller-udev
- setzt User in die Gruppe `input`

### 2. Jeder Boot (`silk-plug`)
- Bluetooth an
- udev-Trigger → Controller **on the fly** (USB stecken / BT koppeln)

### 3. Erster Login (`silk-tour`)
- geführte Tour mit Fortschrittsanzeige
- Stil, Alltag-Apps, Windows-.exe, Controller
- Desktop-Verknüpfungen + Startzentrum
- weitere Logins: sanfter Tipp (`silk-tips`)

## Manuell (falls nötig)

```bash
silk-tour              # Tour / Tipps
silk-tour --center     # Startzentrum
silk-ready status
silk-gpu status
silk-controllers status
silk-tips --dialog
```

## GPU – „einfach stecken“

| Karte | Verhalten |
|-------|-----------|
| AMD | Sofort im Standard-Image |
| Intel | Sofort im Standard-Image |
| NVIDIA neu | Auto-Switch → `silk-nvidia-open` + Reboot |
| NVIDIA alt | Auto-Switch → `silk-nvidia` + Reboot |

Abschalten (nur für Profis): `SILK_AUTO_GPU_SWITCH=0`

## Controller – on the fly

Xbox, DualSense, DualShock, Switch Pro, 8BitDo, Logitech, Razer, …  
→ anschließen oder per Bluetooth koppeln → in Steam/Spielen nutzbar.

```bash
silk-controllers test
```
