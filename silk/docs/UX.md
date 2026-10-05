# User Experience – Auspacken und loslegen

Silk führt dich **ohne Terminal-Pflicht** durch den Start.

## Erster Login

Ein Autostart startet **`silk-tour`**:

1. Desktop-Stil wählen (Mac / Win11 / Win10 / Tablet)
2. Alltags-Apps installieren
3. Windows-.exe-Schicht (Bottles)
4. GPU & Controller vorbereiten
5. Optional: Gaming, Silk Connect
6. Desktop-Verknüpfungen + Startzentrum

Fortschritt erscheint als Progress-Dialog und Notifications.

## Im Alltag

| Aktion | Startmenü | Befehl |
|--------|-----------|--------|
| Startzentrum | Silk Startzentrum | `silk-tour --center` |
| Hilfe | Silk Willkommen | `silk-welcome` |
| Stil ändern | Silk Desktop-Stil | `silk-desktop --ask` |
| Status | Silk Status | `silk-ready status` |
| Updates | Silk Updates | `silk-update` |
| Diagnose | Silk Diagnose | `silk-doctor --gui` |
| Tipp | — | `silk-tips` |

Nach der Tour zeigt jeder weitere Login einen **sanften Tipp** (`silk-tips`).

## Dateien

- `/usr/share/silk/center.html` – Startzentrum
- `/usr/share/silk/welcome.html` – ausführliche Hilfe
- `/usr/share/silk/tips.txt` – Tipps
- Autostart: `~/.config/autostart/silk-tour.desktop` (aus Skel)
