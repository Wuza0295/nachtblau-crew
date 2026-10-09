# Silk als VM unter Windows

Ziel: **Doppelklick → Silk läuft in einer VM.**

## Schnellstart (Windows)

### Einzeiler (PowerShell)

**Hyper-V** (Windows Pro, Admin):

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
# nach Neustart:
powershell -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1))) -Backend HyperV -Mode Installer"
```

**VirtualBox / Auto** (installiert VirtualBox bei Bedarf):

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex"
```

`Backend=Auto` (Standard): VirtualBox wenn `VBoxManage` vorhanden, sonst Hyper-V;
fehlt beides → Auto-Install (winget / chocolatey / Oracle). Opt-out: `-SkipVBoxInstall`.

### Doppelklick / Repo

1. VirtualBox **oder** Hyper-V (Win Pro, Admin)
2. Ordner `silk/windows/` öffnen
3. **`Install-SilkVM.cmd`** doppelklicken

Das Skript:
- lädt das Silk-Medium vom Release `silk-media-latest`
- setzt die Split-Dateien (~6 GB) zusammen
- legt die VM **Silk** an
- startet sie

### PowerShell (mehr Kontrolle)

```powershell
cd silk\windows
# Empfohlen: Installer-ISO (Auto = VBox bevorzugt, sonst Hyper-V)
powershell -ExecutionPolicy Bypass -File .\Install-SilkVM.ps1 -Backend Auto -Mode Installer

# Fertige Disk (braucht qemu-img für QCOW→VHDX/VDI)
powershell -ExecutionPolicy Bypass -File .\Install-SilkVM.ps1 -Mode Ready -Backend VirtualBox
```

| Parameter | Bedeutung |
|-----------|-----------|
| `-Backend Auto\|HyperV\|VirtualBox` | Hypervisor (`Auto`: VirtualBox zuerst) |
| `-Mode Installer` | ISO booten und Silk installieren (empfohlen) |
| `-Mode Ready` | Fertige Disk (schneller, Konvertierung nötig) |
| `-MemMB 4096` `-Cpus 2` | Ressourcen |
| `-NoStart` | Nur anlegen, nicht starten |
| `-SkipVBoxInstall` | Auto: kein automatischer VirtualBox-Install |

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

## Sprache (Deutsch)

Der Anaconda-Installer ist auf **Deutsch (`de_DE`)** voreingestellt (Tastatur DE, Zeitzone Europe/Berlin).
Das braucht ein **neu gebautes** `Silk-Installer`-ISO (Release `silk-media-latest` nach dem Fix).

**Workaround für eine laufende Installer-Session** (altes ISO ohne Localization):

1. Am GRUB/Boot-Menü `e` drücken und Kernel-Parameter ergänzen:
   `inst.lang=de_DE.UTF-8`
2. Mit Ctrl+X starten – die Installer-UI sollte auf Deutsch kommen.
3. Nach der Installation (falls Desktop noch Englisch):
   ```bash
   localectl set-locale LANG=de_DE.UTF-8
   localectl set-keymap de
   ```
