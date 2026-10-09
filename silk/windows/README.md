# Silk VM unter Windows

Ziel: **ein Befehl / Doppelklick -> Silk-VM**.

## Schnellstart (ohne Git)

**1. VirtualBox installieren** (Home/einfach): https://www.virtualbox.org/  
Oder Hyper-V (Win Pro): Einstellungen -> optionale Features -> Hyper-V

**2. PowerShell oeffnen** und ausfuehren:

```powershell
# Empfohlen (umgeht ExecutionPolicy):
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex"
```

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
# Explizit VirtualBox + Installer-ISO (Standard)
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
3. Backend waehlen (1 = VirtualBox) -> Enter

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
| Kein Hypervisor | VirtualBox installieren **oder** Hyper-V aktivieren |
| ExecutionPolicy | `powershell -ExecutionPolicy Bypass -File ...` |
| Hyper-V Rechte | PowerShell/CMD **als Administrator** |
| Download bricht ab | Skript erneut starten (setzt fort) |
| Parse-Fehler (... / Pfeil) | Erneut-Befehl oben (ASCII-only Skripte neu laden) |
| Ready-Mode | braucht `qemu-img` - besser **-Mode Installer** |

Details auch: `Install-SilkVM.ps1 -?`
