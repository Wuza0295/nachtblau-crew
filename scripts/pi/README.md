# NachtBlau Minecraft – Install auf Raspberry Pi 4

Idempotentes Setup für **Java (Paper)**, **Bedrock Dedicated** und **Geyser-Crossplay**.

| Dienst | Pfad | Port |
|--------|------|------|
| Java Edition (Paper) | `/opt/minecraft-java` | **25565/TCP** |
| Bedrock Dedicated | `/opt/minecraft-bedrock` | **19132/UDP** |
| Geyser + Floodgate (Plugin in Paper) | `/opt/minecraft-java/plugins` | **19134/UDP** |

Der Cloud-Agent kann den Install **nicht** auf deinem physischen Pi starten (kein SSH, kein Private Worker, Pi nicht im selben Netz). Das Skript läuft **auf dem Pi**.

## Voraussetzungen

- Raspberry Pi **4B, 8 GB**, 64-Bit-OS (Raspberry Pi OS Lite 64-bit oder Ubuntu Server 24.04 ARM64)
- Boot von USB 3 / SSD (USB-2.0-Sticks sind für Welten schlecht)
- SSH aktiv, du sitzt **auf dem Pi** oder erreichst ihn per `ssh`
- Internet auf dem Pi
- Mindestens ~4 GB frei

Mit der Installation akzeptierst du die [Minecraft EULA](https://aka.ms/MinecraftEULA).

## Start auf dem Pi

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
sudo ./scripts/pi/nacht-install.sh --yes
sudo ./scripts/pi/nacht-status.sh
```

Oder nur das Skript kopieren – es ist selbstständig:

```bash
sudo ./scripts/pi/nacht-install.sh --yes
```

## Nützliche Schalter

| Schalter | Bedeutung |
|----------|-----------|
| `--yes` | EULA akzeptieren, nicht interaktiv |
| `--no-start` | Nur installieren, Dienste nicht starten |
| `--force` | Auch ohne erkanntes Raspberry-Pi-Board (z. B. anderer ARM64-Host) |
| `--skip-bedrock` | Nur Java + Geyser (ohne emulierten Dedicated-Bedrock) |

Bedrock Dedicated ist offiziell nur **x86_64**. Auf dem Pi läuft er über **Box64**. Das ist deutlich schwerer als natives Paper – für reinen Crossplay reicht Java + Geyser (Bedrock-Clients auf Port **19134**). Dedicated Bedrock bleibt zusätzlich auf **19132**, wie im NachtBlau-Setup vorgesehen.

## Nach dem Install

```bash
sudo systemctl status minecraft-java minecraft-bedrock
journalctl -u minecraft-java -f
sudo ./scripts/pi/nacht-status.sh
```

Ops/Allowlist später in:

- `/opt/minecraft-java/ops.json`, `whitelist.json`
- `/opt/minecraft-bedrock/permissions.json`, `allowlist.json`

Java-Heap und Flags: `/etc/nachtblau/minecraft.env`
