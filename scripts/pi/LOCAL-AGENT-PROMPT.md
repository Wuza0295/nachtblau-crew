# Lokaler Cursor-Agent — Copy-Paste für „This Computer“

Neuer Agent in **Cursor Desktop** → **Run on: This Computer** → gesamten Block unten einfügen.

> Nur auf einem PC **im Heimnetz** (Windows oder Linux mit SSH zum Pi).  
> Nicht auf dem Cloud-Agent. Nicht als „Bazzite = Pi“ behandeln — der Pi ist ein separates Gerät.

---

Du hast SSH-Zugriff auf unseren Raspberry Pi 4 im Heimnetz. Bitte alles selbst ausführen (Terminal), nicht nur erklären.

## Zugang

- Host (LAN): `192.168.178.33`
- User: `administrator`
- Authentifizierung: SSH-Passwort oder Key vom Betreiber (nicht in Docs committen)
- WAN (nur falls LAN nicht geht): `89.247.164.165` — Port 22 von außen war oft blockiert; LAN bevorzugen.

## Aufgabe

1. Per SSH verbinden und prüfen, ob der Pi erreichbar ist (`hostname`, `uname -a`, Raspberry Pi Modell).
2. Repo `nachtblau-crew` **auf dem Pi** aktualisieren oder klonen (nicht nur lokal auf dem Notebook/Bazzite):
   - Branch: `cursor/pi-lightweight-desktop-3ddb`
   - URL: `https://github.com/Wuza0295/nachtblau-crew.git`
3. Ausführen **auf dem Pi** (nach `cd` ins Clone):
   ```bash
   sudo ./scripts/pi/install-lightweight-desktop.sh --yes --upgrade
   ```
   Optional Gesamt-Upgrade inkl. git pull:
   ```bash
   sudo ./scripts/pi/upgrade-all.sh --yes
   ```
   (Skript nutzt `polkitd` + `pkexec`, **nicht** `policykit-1`.)
4. Ergebnis melden: Anzahl upgradbarer Pakete vorher/nachher, ob XFCE/LightDM installiert, `systemctl is-active lightdm`, ggf. `sudo reboot` vorschlagen.
5. Optional: Minecraft-Dienste nicht stoppen, außer apt verlangt es.

## Kontext

- NachtBlau Minecraft-Server-Projekt; Pi bootet von USB, Ethernet.
- Cloud-Agent konnte Pi nicht erreichen (LAN privat); deshalb lokaler Agent auf dem PC im gleichen WLAN.
- Hub auf Bazzite: `apps/nachtblau-hub/linux/Install-NachtBlauHub.sh` — getrennt vom Pi-Upgrade.
