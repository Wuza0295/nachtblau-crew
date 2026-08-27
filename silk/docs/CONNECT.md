# Silk Connect – Begleitgeräte (iPhone, iPad, Android)

Silk läuft **nicht nativ** auf iPhone oder iPad. **Silk Connect** hält alte Apple-Geräte trotzdem im Silk-Ökosystem nutzbar.

## Was Connect kann

| Funktion | Beschreibung |
|----------|--------------|
| **Dashboard (PWA)** | Mobile Startseite im Safari-Browser |
| **Remote-Desktop** | Silk-PC steuern (RustDesk, Parsec, Moonlight) |
| **Datei-Sync** | Dropbox, Nextcloud, Rclone (gleicher Account auf iPad) |
| **Kiosk-Modus** | Altes iPad als Dauer-Display (Küche, Kalender) |
| **Pairing** | Sicherer 6-stelliger Code im lokalen WLAN |

## Schnellstart

Auf dem **Silk-PC**:

```bash
silk-connect setup      # Einmalig einrichten
silk-connect status     # URL + Pairing-Code
silk-connect pair       # Anleitung für iPhone/iPad
```

Auf **iPhone/iPad**:

1. Gleiches WLAN wie der Silk-PC
2. Safari öffnen
3. URL aus `silk-connect status` eingeben
4. Optional: **Teilen → Zum Home-Bildschirm**

## Befehle

| Befehl | Funktion |
|--------|----------|
| `silk-connect setup` | Server starten, Token erzeugen, Firewall |
| `silk-connect status` | URL, Token, Dienst-Status |
| `silk-connect pair` | Schritt-für-Schritt für iOS |
| `silk-connect dashboard` | Kiosk-Hinweise für altes iPad |
| `silk-connect remote` | RustDesk/Parsec einrichten |
| `silk-connect open` | Dashboard im Desktop-Browser |
| `silk-connect start\|stop\|restart` | Dienst steuern |

## Remote-Desktop

Empfohlen: **RustDesk** (Open Source)

```bash
# Auf Silk-PC
flatpak install flathub com.rustdesk.RustDesk
silk-connect remote
```

Auf dem iPad: RustDesk-App aus dem App Store → Silk-PC-ID eingeben.

Alternativen: Parsec (Gaming), Moonlight (NVIDIA), Microsoft Remote Desktop.

## Kiosk-Modus (altes iPad)

1. `silk-connect dashboard` – URL notieren
2. Safari → URL → **Zum Home-Bildschirm**
3. Einstellungen → Anzeige → Automatisches Sperren → **Nie** (nur für Dauer-Displays)
4. Guided Access optional (iOS): dreifach Home / Seitentaste → Guided Access

## Sicherheit

- Connect läuft nur im **lokalen Netzwerk** (Port standardmäßig 8765)
- Pairing-Token in `~/.config/silk/connect/pair-token`
- Kein Zwang – Setup nur bei Bedarf (`silk-setup` fragt optional)

## Grenzen (ehrlich)

- **Kein Silk-OS auf iOS** – iOS bleibt das Betriebssystem
- **Kein App Store-Ersatz** – nur Begleit-Funktionen
- **Ältere iOS-Versionen** – PWA im Browser funktioniert oft besser als veraltete Apps
- **iPhone/iPad ohne WLAN** – Connect braucht Netzwerk zum Silk-PC

## Diagnose

```bash
silk-doctor
```

---

Siehe auch: [`PLATFORMS.md`](PLATFORMS.md) · [`../README.md`](../README.md)
