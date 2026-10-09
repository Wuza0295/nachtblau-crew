# Sync: Bazzite ↔ Windows ↔ Cloud

Alles, was beim Wechsel **Bazzite → Windows** und zurück denselben Stand haben soll: Repo/Silk, Hub, Minecraft-Desktop-Server, Dual-Boot-Spielstände.

## Schnellbefehle

| Bereich | Bazzite / Linux | Windows |
|---------|-----------------|---------|
| **Git + Silk-Config** | `./scripts/sync-bazzite-windows.sh` bzw. `pnpm sync:machines` | `.\scripts\windows\Sync-NachtBlauRepo.ps1` |
| **+ Spielstände** | `./scripts/sync-bazzite-windows.sh --saves` | `.\scripts\windows\Sync-NachtBlauRepo.ps1 -SyncSaves` |
| **Minecraft-Server (Desktop)** | `pnpm sync:bazzite` / `sudo ./scripts/desktop/nacht-install-bazzite.sh --yes` | `.\scripts\desktop\run-nachtblau-from-windows.ps1 -Yes` |
| **Hub live (Webspace)** | `pnpm hub:check` · Deploy: `pnpm deploy:windows-hub` (braucht FTP) | Electron: `apps/nachtblau-hub/windows` |
| **Silk-Website** | `cd Silk-Website && ./start.sh` | wie links oder `-StartSilkWebsite` |
| **Silk-VM** | — | `.\silk\windows\Install-SilkVM.ps1` |

## 1. Git / Silk (Repo-Stand)

```bash
./scripts/sync-bazzite-windows.sh
# optional: --saves --test --website
```

```powershell
.\scripts\windows\Sync-NachtBlauRepo.ps1
.\scripts\windows\Sync-NachtBlauRepo.ps1 -SyncSaves -InstallSilkVm
```

Macht: `git pull`, `pnpm install`, Linux zusätzlich `silk-sync-config`.

## 2. NachtBlau Hub (Webspace)

Eine Live-Quelle: `https://launcher.nachtblau-interactive.com/`

| Gerät | URL |
|-------|-----|
| Bazzite | `/linux.html` |
| Windows | `/windows.html` |
| Android | `/android.html` |

```bash
pnpm deploy:prepare          # Artefakte + FTP-Status (kein Fake-Upload)
pnpm deploy:windows-hub      # braucht FTP_USER/FTP_PASS
pnpm hub:check -- --require-windows
```

Credentials: `.env.webspace` (siehe `.env.webspace.example`) oder Cursor-Environment-Secrets.

## 3. Minecraft-Desktop (Java + Bedrock + Geyser)

Gleicher Server-Stand auf Bazzite und Windows (Pi bleibt Referenz). Details: [scripts/desktop/README.md](../scripts/desktop/README.md).

| | Bazzite | Windows |
|--|---------|---------|
| Java | `/opt/minecraft-java` :25565 | `C:\NachtBlau\java` |
| Bedrock | `/opt/minecraft-bedrock` :19132 | `C:\NachtBlau\bedrock` |
| Geyser | :19134 | :19134 |

## 4. Dual-Boot-Spielstände

Gemeinsamer Sync-Root auf einer Partition, die **beide** OS sehen (typisch NTFS):

```bash
export NACHTBLAU_SYNC_ROOT=/mnt/nachtblau-sync   # Bazzite: Partition mounten
pnpm sync:saves            # neuerer Stand gewinnt
pnpm sync:saves -- status
```

```powershell
$env:NACHTBLAU_SYNC_ROOT = 'D:\NachtBlauSync'
.\scripts\dualboot\Sync-Saves.ps1
.\scripts\dualboot\Sync-Saves.ps1 -Command status
```

### Was synchronisiert wird

- Minecraft Java Client: `saves/`, `servers.dat`, optional `options.txt`
- Desktop-Server: Java-`world` + Ops/Allowlist, Bedrock-`worlds` (falls installiert)
- Lumina-Launcher-Config (falls vorhanden)

### Grenzen

- Steam/Proton und Steam-Cloud: eigener Mechanismus
- Bedrock Windows Store Saves: Pfade versionsabhängig, nicht im Manifest
- Hub-Unlocks (Browser localStorage): folgen dem Webspace, nicht der Partition
- Nie beide OS gleichzeitig auf dieselben Dateien schreiben (Dual-Boot)

Manifest: [scripts/dualboot/manifest.json](../scripts/dualboot/manifest.json) · Beispiel-Env: [scripts/dualboot/paths.example](../scripts/dualboot/paths.example)

## Silk: Bazzite vs. Windows

| Ziel | Weg |
|------|-----|
| Silk nativ | Bazzite `bootc switch` → [Silk-Website/TEST-SILK.md](../Silk-Website/TEST-SILK.md) |
| Silk-VM unter Windows | [silk/windows/README.md](../silk/windows/README.md) |
| Windows-.exe auf Silk/Linux | [silk/docs/WINDOWS.md](../silk/docs/WINDOWS.md) |

Zurück zu Bazzite:

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/ublue-os/bazzite:stable
sudo systemctl reboot
```
