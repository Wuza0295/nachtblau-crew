# Silk VM unter Windows

Ziel: **ein Befehl / Doppelklick -> Silk-VM**.

## Schnellstart (ohne Git)

Backend **Auto** (Standard): VirtualBox wenn `VBoxManage` da ist, sonst Hyper-V.
Fehlt beides, versucht Auto VirtualBox zu installieren (winget → chocolatey → Oracle-Installer).
Opt-out: `-SkipVBoxInstall`.

### A) Hyper-V (Windows Pro, Admin-PowerShell)

Einmal Feature aktivieren, Neustart, dann:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

Nach Neustart (als Administrator):

```powershell
powershell -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1))) -Backend HyperV -Mode Installer"
```

### B) VirtualBox (Home / Auto installiert bei Bedarf)

Einzeiler reicht oft (Auto installiert VirtualBox wenn noetig):

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex"
```

Manuell: https://www.virtualbox.org/ — danach denselben Befehl.

Oder in geoeffneter PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex
```

Das laedt das Setup, holt das Silk-Medium (~6 GB), legt die VM **Silk** an und startet sie.

### Erneut ausfuehren (nach Fix / Parse-Fehler)

Alte lokale Kopie loeschen und denselben Einzeiler nochmals paste:

```powershell
Remove-Item -Force "$env:USERPROFILE\Silk-VMs\tools\Install-SilkVM.ps1" -ErrorAction SilentlyContinue; powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex"
```

### Varianten

```powershell
# Auto (Standard): VirtualBox bevorzugt, sonst Hyper-V
irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex

# Mit Parametern (Skript speichern)
irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 -OutFile Get-SilkVM.ps1
powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1 -Backend VirtualBox -Mode Installer -MemMB 8192 -Cpus 4

# Hyper-V (PowerShell als Administrator)
powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1 -Backend HyperV -Mode Installer
```

## Mit Repo / Doppelklick

1. Branch `cursor/silk-connect-multiplatform-fef1` auschecken  
2. `silk\windows\Install-SilkVM.cmd` doppelklicken  
3. Backend waehlen (1 = VirtualBox, 3 = Auto) -> Enter

## Was passiert

| Schritt | Inhalt |
|---------|--------|
| Download | Release `silk-media-latest` nach `%USERPROFILE%\Silk-VMs` |
| Zusammenfuegen | Split-ISO/QCOW (~6 GB) |
| VM | Name **Silk**, EFI, 4 GB RAM / 2 CPUs (aenderbar) |
| Start | VirtualBox- oder Hyper-V-Fenster |

## Nach dem Login in der Silk-VM

```bash
silk-tour
silk-tour --center
```

## Probleme

| Symptom | Fix |
|---------|-----|
| Kein Hypervisor | Auto versucht VirtualBox-Install; sonst manuell (A/B) oder `-SkipVBoxInstall` |
| ExecutionPolicy | `powershell -ExecutionPolicy Bypass -File ...` |
| Hyper-V Rechte | PowerShell/CMD **als Administrator** |
| Download bricht ab | Skript erneut starten (setzt fort) |
| Parse-Fehler (... / Pfeil) | Erneut-Befehl oben (ASCII-only Skripte neu laden) |
| Ready-Mode | braucht `qemu-img` - besser **-Mode Installer** |

Details auch: `Install-SilkVM.ps1 -?`
