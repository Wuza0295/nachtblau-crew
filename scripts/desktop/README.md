# NachtBlau Minecraft – Sync mit Bazzite und Windows

Gleicher Server-Stand auf allen drei Maschinen: **Java (Paper)**, **Bedrock Dedicated**
und **Crossplay über Geyser**. Der Pi bleibt Referenz, Bazzite und Windows werden
auf denselben Stand synchronisiert.

| Dienst | Pi (`scripts/pi`) | Bazzite (`scripts/desktop`) | Windows (`scripts/desktop`) |
|--------|-------------------|-----------------------------|-----------------------------|
| Java (Paper) | `/opt/minecraft-java`, **25565/TCP** | `/opt/minecraft-java`, **25565/TCP** | `C:\NachtBlau\java`, **25565/TCP** |
| Bedrock Dedicated | `/opt/minecraft-bedrock`, **19132/UDP** | `/opt/minecraft-bedrock`, **19132/UDP** (nativ, ohne Box64) | `C:\NachtBlau\bedrock`, **19132/UDP** (nativ) |
| Geyser + Floodgate (Plugin in Paper) | Port **19134/UDP** | Port **19134/UDP** | Port **19134/UDP** |
| MOTD | `NachtBlau` | `NachtBlau` | `NachtBlau` |

Hinweis: Auf dem Pi läuft Bedrock Dedicated über **Box64** (ARM64-Emulation),
auf Bazzite und Windows läuft derselbe Bedrock-Server **nativ** (x86_64).
Die `server.properties` und die Geyser-`config.yml` sind auf allen Systemen
identisch (MOTD `NachtBlau`, gleiche Spielregeln).

## 1. Bazzite

Voraussetzungen: Bazzite (oder Fedora-Atomic-/x86_64-Linux), Root per `sudo`,
Internet. Das Skript erkennt `rpm-ostree`, `dnf` und ersatzweise `apt`.

```bash
git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
sudo ./scripts/desktop/nacht-install-bazzite.sh --yes
./scripts/desktop/nacht-status-desktop.sh
```

Nützliche Schalter (wie auf dem Pi):

| Schalter | Bedeutung |
|----------|-----------|
| `--yes` | EULA akzeptieren, nicht interaktiv |
| `--no-start` | Nur synchronisieren, Dienste nicht starten |
| `--skip-bedrock` | Nur Java + Geyser (ohne Dedicated Bedrock) |
| `--force` | Auch ohne erkanntes Bazzite/Fedora fortfahren |

Bazzite-Hinweis: Wird Java per `rpm-ostree`-Overlay nachinstalliert, verlangt
das Skript einen **Reboot** und danach einen zweiten Lauf – das Overlay ist
erst nach dem Neustart aktiv.

## 2. Windows

Voraussetzungen: Windows 10/11 (64-Bit), PowerShell **als Administrator**,
Java 21+ (wird sonst per `winget` nachinstalliert: `Microsoft.OpenJDK.21`).

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\desktop\run-nachtblau-from-windows.ps1 -Yes
```

Nützliche Schalter:

| Schalter | Bedeutung |
|----------|-----------|
| `-Yes` | EULA akzeptieren, nicht nachfragen |
| `-NoStart` | Nur synchronisieren, Server nicht starten |
| `-SkipBedrock` | Nur Java + Geyser (ohne Dedicated Bedrock) |
| `-Force` | Auch ohne Admin-Rechte fortfahren (nicht empfohlen) |

Das Skript legt `C:\NachtBlau\java` und `C:\NachtBlau\bedrock` an, schreibt
`Start-Java.cmd` / `Start-Bedrock.cmd` und erstellt die drei
Firewall-Regeln (Java 25565/TCP, Bedrock 19132/UDP, Geyser 19134/UDP).

## 3. Crossplay-Test (alle Systeme gleich)

1. **Java-Edition:** Serveradresse `<host>:25565` – Welt lädt, MOTD `NachtBlau`.
2. **Bedrock:** Serveradresse `<host>`, Port **19132** – Dedicated-Server antwortet.
3. **Geyser:** Bedrock-Client auf Port **19134** – landet in der Java-Welt
   (Floodgate, ohne Java-Account nötig).
4. Status:
   - Pi: `sudo ./scripts/pi/nacht-status.sh`
   - Bazzite: `./scripts/desktop/nacht-status-desktop.sh`
   - Windows: Ports in der Firewall prüfen, Konsolenfenster offen lassen.

## 4. Ops, Allowlist und Betrieb

| Datei | Pi / Bazzite | Windows |
|-------|--------------|---------|
| Ops (Java) | `/opt/minecraft-java/ops.json` | `C:\NachtBlau\java\ops.json` |
| Allowlist (Java) | `/opt/minecraft-java/whitelist.json` | `C:\NachtBlau\java\whitelist.json` |
| Rechte (Bedrock) | `/opt/minecraft-bedrock/permissions.json` | `C:\NachtBlau\bedrock\permissions.json` |
| Allowlist (Bedrock) | `/opt/minecraft-bedrock/allowlist.json` | `C:\NachtBlau\bedrock\allowlist.json` |
| Java-Heap | `/etc/nachtblau/minecraft.env` | `Start-Java.cmd` (`-Xms/-Xmx`) |

Alle Skripte sind **idempotent**: Erneutes Ausführen aktualisiert Paper,
Geyser/Floodgate und Bedrock auf den aktuellen Stand, ohne Welten zu löschen.
Vor dem ersten Start die [Minecraft-EULA](https://aka.ms/MinecraftEULA) beachten
(`--yes` bzw. `-Yes` bestätigt sie).

Siehe auch: `scripts/pi/README.md` (Pi-Referenz) und
`scripts/pi-nacht-install/README.md` (Unattended-Nacht-Install).
