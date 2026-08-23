# NachtBlau Pi Nacht-Install

Unattended-Install für den **Raspberry Pi 4B (8 GB)**: Minecraft Java, Bedrock-Protokoll und Geyser.

| Dienst | Pfad | Port |
|--------|------|------|
| Java (Paper) | `/opt/minecraft-java` | **25565/TCP** |
| Bedrock-Spieler (Geyser + Floodgate) | Plugin in Java | **19132/UDP** |
| Geyser Standalone | `/opt/minecraft-geyser` | **19134/UDP** |
| Bedrock Dedicated (offiziell) | `/opt/minecraft-bedrock` | 19132, nur x86_64 / box64 |

Auf dem Pi 4 (ARM64) gibt es **keinen nativen** Mojang-Bedrock-Dedicated. Bedrock-Clients spielen über Geyser in der Java-Welt. Die Dateien unter `/opt/minecraft-bedrock` werden trotzdem abgelegt.

## Was dieser Cloud-Agent **nicht** kann

Von hier aus gibt es **keinen Zugriff** auf deinen Pi (kein USB-Flash, kein LAN, kein SSH). Das Nacht-Install startet erst, wenn das Image auf dem **SanDisk Ultra Fit (USB 3, blauer Port)** liegt und der Pi mit Ethernet bootet.

## Ablauf bei dir

1. Xbox-Daten vom 256-GB-Stick sichern (der Stick wird gelöscht).
2. Raspberry Pi Imager: Gerät **Pi 4** → OS **Raspberry Pi OS Lite (64-bit)** unter *other*.
3. SSH, Benutzer und WLAN/Hostname setzen. Ethernet ist Pflicht.
4. Nach dem Flashen auf einem Linux-PC beide Partitionen mounten und:

```bash
sudo ./scripts/pi-nacht-install/prepare-boot.sh \
  --boot /media/$USER/bootfs \
  --root /media/$USER/rootfs
```

5. Stick auswerfen, in den **blauen USB-3-Port**, Netzteil, Ethernet. **Über Nacht laufen lassen.**
6. Morgens per SSH:

```bash
sudo /opt/nachtblau-install/status.sh
```

Log: `/var/log/nachtblau-pi-install.log`

## Bootet der Pi nicht (5× grüne LED)?

Dann sieht der Bootloader den Stick nicht oder USB-Boot fehlt im EEPROM. Mini-microSD einmal mit Imager → *Bootloader → USB Boot* flashen, 15 s grüner Bildschirm, Karte raus, Stick wieder rein. Den USB-2.0-128-GB-Stick nicht nochmal versuchen.

## Skripte

| Datei | Wo |
|-------|-----|
| `prepare-boot.sh` | PC nach dem Flashen |
| `install.sh` | Pi, als root (automatisch) |
| `install.sh --dry-run` | nur Download-URLs prüfen |
| `prefetch.sh` | Jars vorab laden (optional) |
| `status.sh` | Pi, Fortschritt |

Manuell auf einem schon laufenden Pi:

```bash
sudo git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
sudo ./scripts/pi-nacht-install/install.sh
```
