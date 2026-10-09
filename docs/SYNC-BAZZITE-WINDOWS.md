# Sync: Bazzite ↔ Windows ↔ Cloud

Ein **gemeinsamer Git-Stand** (`main`) für NachtBlau Crew, Silk-Website und Windows-Silk-VM-Skripte.

## Schnellbefehle

| System | Befehl |
|--------|--------|
| **Bazzite / Linux / WSL** | `./scripts/sync-bazzite-windows.sh` |
| **Windows (PowerShell)** | `.\scripts\windows\Sync-NachtBlauRepo.ps1` |
| **Nach Pull: Silk-Website** | `cd Silk-Website && ./start.sh` |
| **Silk auf Bazzite testen** | `./Silk-Website/scripts/test-silk-on-bazzite.sh --status` |
| **Silk-VM unter Windows** | `.\silk\windows\Install-SilkVM.ps1` |

Optional mit Tests und Website:

```bash
./scripts/sync-bazzite-windows.sh --test --website
```

```powershell
.\scripts\windows\Sync-NachtBlauRepo.ps1 -Test -StartSilkWebsite
.\scripts\windows\Sync-NachtBlauRepo.ps1 -InstallSilkVm
```

## Erstes Einrichten

### Bazzite

```bash
git clone https://github.com/Wuza0295/nachtblau-crew.git ~/nachtblau-crew
cd ~/nachtblau-crew
./scripts/sync-bazzite-windows.sh
```

### Windows

```powershell
git clone https://github.com/Wuza0295/nachtblau-crew.git $env:USERPROFILE\nachtblau-crew
cd $env:USERPROFILE\nachtblau-crew
.\scripts\windows\Sync-NachtBlauRepo.ps1
```

Für die volle Web-App unter WSL dieselbe Bash-Sync wie auf Bazzite nutzen.

## Was der Sync macht

1. `git fetch` / `git pull --ff-only` auf `main` (oder `SYNC_BRANCH`)
2. `pnpm install` (falls Node/pnpm vorhanden)
3. **`silk-sync-config`** (Linux): App-Listen und Aliases von GitHub raw → `~/.local/share/silk`
4. Hinweise auf Website, Silk-`bootc switch` und Windows-VM

## Silk: Bazzite vs. Windows

| Ziel | Weg |
|------|-----|
| Silk **nativ** auf dem PC | Bazzite: `bootc switch` → siehe [Silk-Website/TEST-SILK.md](../Silk-Website/TEST-SILK.md) |
| Silk in **VM unter Windows** | [silk/windows/README.md](../silk/windows/README.md) |
| Windows-.exe **auf Silk/Linux** | [silk/docs/WINDOWS.md](../silk/docs/WINDOWS.md) (`silk-windows`) |

Zurück von Silk zu Bazzite:

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/ublue-os/bazzite:stable
sudo systemctl reboot
```

## Webspace / Allxion (optional)

Für identischen App-Stand auf ALL-INKL (Linux/Android im Browser) liegt erweitertes Tooling auf Branch `cursor/full-platform-sync-8676` (`pnpm sync:platforms`). Dafür brauchst du `.env.webspace` mit FTPS-Zugangsdaten.

## Cloud Agent

Änderungen am Repo werden per `git push` auf `main` veröffentlicht. Auf Bazzite und Windows danach einmal den Sync-Befehl oben ausführen.
