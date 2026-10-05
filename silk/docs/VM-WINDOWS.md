# Silk als VM unter Windows

Ziel: **Doppelklick → Silk läuft in einer VM.**

## Schnellstart (Windows)

1. VirtualBox installieren **oder** Hyper-V aktivieren (Win Pro, Admin)
2. Ordner `silk/windows/` öffnen
3. **`Install-SilkVM.cmd`** doppelklicken (als Admin bei Hyper-V)

Das Skript:
- lädt das Silk-Medium vom Release `silk-media-latest`
- setzt die Split-Dateien (~6 GB) zusammen
- legt die VM **Silk** an
- startet sie

### PowerShell (mehr Kontrolle)

```powershell
cd silk\windows
# Empfohlen: Installer-ISO
powershell -ExecutionPolicy Bypass -File .\Install-SilkVM.ps1 -Backend Auto -Mode Installer

# Fertige Disk (braucht qemu-img für QCOW→VHDX/VDI)
powershell -ExecutionPolicy Bypass -File .\Install-SilkVM.ps1 -Mode Ready -Backend VirtualBox
```

| Parameter | Bedeutung |
|-----------|-----------|
| `-Backend Auto\|HyperV\|VirtualBox` | Hypervisor |
| `-Mode Installer` | ISO booten und Silk installieren (empfohlen) |
| `-Mode Ready` | Fertige Disk (schneller, Konvertierung nötig) |
| `-MemMB 4096` `-Cpus 2` | Ressourcen |
| `-NoStart` | Nur anlegen, nicht starten |

Arbeitsverzeichnis: `%USERPROFILE%\Silk-VMs`

## Linux (zum Testen)

```bash
silk-vm qemu          # fertige QCOW2 + QEMU/KVM (VNC :5901)
silk-vm iso           # Installer-ISO
silk-vm vbox          # VirtualBox (scripts/go-virtualbox.sh)
```

## Nach dem Login in der VM

```bash
silk-tour            # geführte Einrichtung
silk-tour --center   # Startzentrum
```

## Medien-Quelle

Release: https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest  
(`Silk-Installer-x86_64.iso.*` · `Silk-VM-x86_64.qcow2.*`)
