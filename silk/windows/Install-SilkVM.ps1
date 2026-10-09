<#
.SYNOPSIS
  Silk unter Windows in einer VM installieren / starten (Hyper-V oder VirtualBox).

.DESCRIPTION
  Laedt das Silk-Install-Medium vom GitHub-Release, setzt Split-Dateien zusammen,
  legt eine VM an und startet sie. Kein manuelles Basteln noetig.

.EXAMPLE
  .\Install-SilkVM.ps1
  .\Install-SilkVM.ps1 -Backend VirtualBox -Mode Ready
  .\Install-SilkVM.ps1 -Backend HyperV -Mode Installer -MemMB 8192 -Cpus 4
  .\Install-SilkVM.ps1 -SkipVBoxInstall
#>
[CmdletBinding()]
param(
  [ValidateSet('Auto', 'HyperV', 'VirtualBox')]
  [string]$Backend = 'Auto',

  [ValidateSet('Installer', 'Ready')]
  [string]$Mode = 'Installer',

  [string]$VmName = 'Silk',
  [int]$MemMB = 4096,
  [int]$Cpus = 2,
  [int]$DiskGB = 50,
  [string]$WorkDir = "$env:USERPROFILE\Silk-VMs",
  [string]$ReleaseRepo = 'Wuza0295/nachtblau-crew',
  [string]$ReleaseTag = 'silk-media-latest',
  [switch]$NoStart,
  [switch]$ForceDownload,
  # Auto: do not try winget/choco/Oracle installer when no hypervisor is found
  [switch]$SkipVBoxInstall
)

$ErrorActionPreference = 'Stop'
$DoStart = -not $NoStart

function Write-Silk([string]$Msg) {
  Write-Host ""
  Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Test-IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-NoHypervisorHelp {
  return @'
Kein Hypervisor gefunden.

Automatische VirtualBox-Installation ist fehlgeschlagen oder wurde abgebrochen
(-SkipVBoxInstall). Bitte manuell:

Option A - VirtualBox (einfach):
  1. Installieren: https://www.virtualbox.org/
  2. Danach erneut (Auto waehlt VirtualBox):
     powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex"

Option B - Hyper-V (Windows Pro, Admin-PowerShell):
  1. Feature aktivieren:
     Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
  2. Neustart, dann als Administrator:
     powershell -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1))) -Backend HyperV -Mode Installer"

Oder Skript speichern und:
  powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1 -Backend HyperV -Mode Installer
'@
}

function Find-VBoxManage {
  $cmd = Get-Command VBoxManage -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    (Join-Path ${env:ProgramFiles} 'Oracle\VirtualBox\VBoxManage.exe')
    (Join-Path ${env:ProgramFiles(x86)} 'Oracle\VirtualBox\VBoxManage.exe')
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path -LiteralPath $c)) { return $c }
  }
  return $null
}

function Register-VBoxManagePath {
  $vbox = Find-VBoxManage
  if (-not $vbox) { return $false }
  $dir = Split-Path -Parent $vbox
  $parts = $env:Path -split ';' | Where-Object { $_ }
  if ($parts -notcontains $dir) {
    $env:Path = "$dir;$env:Path"
  }
  return $true
}

function Test-HasVBox {
  return [bool](Find-VBoxManage)
}

function Get-VirtualBoxWindowsInstallerUrl {
  $latestUrl = 'https://download.virtualbox.org/virtualbox/LATEST.TXT'
  Write-Host "  LATEST.TXT ..."
  $ver = (Invoke-WebRequest -Uri $latestUrl -UseBasicParsing).Content.Trim()
  if (-not $ver) { throw 'VirtualBox LATEST.TXT leer' }
  $indexUrl = "https://download.virtualbox.org/virtualbox/$ver/"
  Write-Host "  Index $ver ..."
  $index = (Invoke-WebRequest -Uri $indexUrl -UseBasicParsing).Content
  $m = [regex]::Match($index, 'VirtualBox-[\d\.]+-\d+-Win\.exe')
  if (-not $m.Success) {
    throw "VirtualBox Windows-Installer nicht in $indexUrl gefunden"
  }
  return "$indexUrl$($m.Value)"
}

function Install-VirtualBoxFromOracle {
  param([string]$DestDir)
  Ensure-Dir $DestDir
  $url = Get-VirtualBoxWindowsInstallerUrl
  $name = Split-Path $url -Leaf
  $dest = Join-Path $DestDir $name
  Write-Host "  Download $name ..."
  Download-File -Url $url -Dest $dest
  Write-Silk "Starte VirtualBox-Installer (still wenn moeglich) ..."
  $argsSilent = @('--silent', '--ignore-reboot')
  $p = Start-Process -FilePath $dest -ArgumentList $argsSilent -Wait -PassThru
  if ($p.ExitCode -eq 0 -and (Test-HasVBox)) { return $true }
  # Fallback: UI (User kann abbrechen -> ExitCode != 0)
  Write-Host "  Silent fehlgeschlagen (Exit $($p.ExitCode)) - starte UI ..."
  $p2 = Start-Process -FilePath $dest -Wait -PassThru
  if ($p2.ExitCode -eq 0 -and (Test-HasVBox)) { return $true }
  return $false
}

function Install-VirtualBoxAuto {
  param([string]$DestDir)
  Write-Silk "Kein Hypervisor gefunden - installiere VirtualBox automatisch ..."

  # 1) winget (least friction on modern Windows)
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Host "  Versuch: winget Oracle.VirtualBox ..."
    try {
      & $winget.Source install --id Oracle.VirtualBox -e --accept-package-agreements --accept-source-agreements
      Register-VBoxManagePath | Out-Null
      if (Test-HasVBox) {
        Write-Host "  VirtualBox via winget OK"
        return $true
      }
    } catch {
      Write-Host "  winget fehlgeschlagen: $($_.Exception.Message)"
    }
  } else {
    Write-Host "  winget nicht gefunden"
  }

  # 2) chocolatey if present
  $choco = Get-Command choco -ErrorAction SilentlyContinue
  if ($choco) {
    Write-Host "  Versuch: choco install virtualbox ..."
    try {
      & $choco.Source install virtualbox -y
      Register-VBoxManagePath | Out-Null
      if (Test-HasVBox) {
        Write-Host "  VirtualBox via chocolatey OK"
        return $true
      }
    } catch {
      Write-Host "  chocolatey fehlgeschlagen: $($_.Exception.Message)"
    }
  } else {
    Write-Host "  chocolatey nicht gefunden"
  }

  # 3) Oracle Windows installer (download + silent/UI)
  Write-Host "  Versuch: Oracle VirtualBox Windows-Installer ..."
  try {
    if (Install-VirtualBoxFromOracle -DestDir $DestDir) {
      Register-VBoxManagePath | Out-Null
      if (Test-HasVBox) {
        Write-Host "  VirtualBox via Oracle-Installer OK"
        return $true
      }
    }
  } catch {
    Write-Host "  Oracle-Download/Install fehlgeschlagen: $($_.Exception.Message)"
  }

  Register-VBoxManagePath | Out-Null
  return (Test-HasVBox)
}

function Resolve-Backend {
  param([string]$Wanted)
  $hasVBox = Test-HasVBox
  if ($hasVBox) { Register-VBoxManagePath | Out-Null }
  $hasHyperV = $false
  try {
    if (Get-Command Get-VM -ErrorAction SilentlyContinue) {
      $null = Get-VM -ErrorAction Stop
      $hasHyperV = $true
    }
  } catch {
    # Hyper-V Modul da, aber ggf. nicht Admin / Feature aus
    if (Get-Command Get-WindowsOptionalFeature -ErrorAction SilentlyContinue) {
      $f = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
      if ($f -and $f.State -eq 'Enabled') { $hasHyperV = $true }
    }
  }

  if ($Wanted -eq 'VirtualBox') {
    if (-not $hasVBox) {
      throw @'
VirtualBox / VBoxManage nicht gefunden.

Installieren: https://www.virtualbox.org/
Danach denselben Befehl erneut ausfuehren.

Oder Hyper-V (Win Pro, Admin):
  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
  (Neustart, dann:)
  powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1 -Backend HyperV -Mode Installer
'@
    }
    return 'VirtualBox'
  }
  if ($Wanted -eq 'HyperV') {
    if (-not $hasHyperV) {
      throw @"
Hyper-V nicht verfuegbar (Windows Pro + Feature + Admin).

Feature aktivieren (Admin-PowerShell):
  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
Danach Neustart und erneut mit -Backend HyperV.

Oder VirtualBox: https://www.virtualbox.org/
"@
    }
    if (-not (Test-IsAdmin)) {
      throw 'Hyper-V gefunden, aber ohne Admin-Rechte. PowerShell als Administrator starten.'
    }
    return 'HyperV'
  }
  # Auto: VirtualBox bevorzugen wenn VBoxManage da, sonst Hyper-V
  if ($hasVBox) { return 'VirtualBox' }
  if ($hasHyperV -and (Test-IsAdmin)) { return 'HyperV' }
  if ($hasHyperV) {
    throw @'
Hyper-V gefunden, aber ohne Admin-Rechte.

PowerShell als Administrator starten und erneut:
  powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1 -Backend HyperV -Mode Installer

Oder VirtualBox installieren (kein Admin): https://www.virtualbox.org/
'@
  }
  # Auto + kein Hypervisor: VirtualBox automatisch installieren
  if (-not $SkipVBoxInstall) {
    $tools = Join-Path $WorkDir 'tools'
    if (Install-VirtualBoxAuto -DestDir $tools) {
      Register-VBoxManagePath | Out-Null
      if (Test-HasVBox) { return 'VirtualBox' }
    }
  }
  throw (Get-NoHypervisorHelp)
}

function Get-ReleaseBase {
  return "https://github.com/$ReleaseRepo/releases/download/$ReleaseTag"
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Download-File([string]$Url, [string]$Dest) {
  if ((Test-Path -LiteralPath $Dest) -and -not $ForceDownload) {
    Write-Host "  skip (vorhanden): $(Split-Path $Dest -Leaf)"
    return
  }
  Write-Host "  dl $(Split-Path $Dest -Leaf)"
  $tmp = "$Dest.partial"
  # BITS bevorzugt (fortsetzbar), sonst Invoke-WebRequest
  try {
    Start-BitsTransfer -Source $Url -Destination $tmp -ErrorAction Stop
    Move-Item -Force $tmp $Dest
    return
  } catch {
    # Fallback
  }
  Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing
  Move-Item -Force $tmp $Dest
}

function Join-SplitMedia {
  param(
    [string]$BaseName,   # z.B. Silk-Installer-x86_64.iso
    [string]$Dir
  )
  $out = Join-Path $Dir $BaseName
  if ((Test-Path -LiteralPath $out) -and -not $ForceDownload) {
    Write-Silk "Bereits vorhanden: $out"
    return $out
  }
  $parts = Get-ChildItem -LiteralPath $Dir -Filter "$BaseName.part*" | Sort-Object Name
  if (-not $parts -or $parts.Count -eq 0) {
    throw "Keine Split-Teile fuer $BaseName in $Dir"
  }
  Write-Silk "Setze $BaseName aus $($parts.Count) Teilen zusammen ..."
  if (Test-Path -LiteralPath $out) { Remove-Item -Force $out }
  $outStream = [System.IO.File]::Create($out)
  try {
    foreach ($p in $parts) {
      Write-Host "  + $($p.Name)"
      $in = [System.IO.File]::OpenRead($p.FullName)
      try { $in.CopyTo($outStream) } finally { $in.Dispose() }
    }
  } finally {
    $outStream.Dispose()
  }
  $shaFile = Join-Path $Dir "$BaseName.sha256"
  if (Test-Path -LiteralPath $shaFile) {
    Write-Silk "Pruefe SHA256 ..."
    $expected = ((Get-Content $shaFile -Raw) -split '\s+')[0].Trim().ToLowerInvariant()
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $out).Hash.ToLowerInvariant()
    if ($hash -ne $expected) {
      Remove-Item -Force $out -ErrorAction SilentlyContinue
      throw "SHA256 mismatch fuer $BaseName (erwartet $expected, ist $hash)"
    }
    Write-Host "  SHA256 OK"
  }
  return $out
}

function Download-InstallerIso {
  $base = Get-ReleaseBase
  Ensure-Dir $WorkDir
  $files = @(
    'Silk-Installer-x86_64.iso.sha256',
    'Silk-Installer-x86_64.iso.part00',
    'Silk-Installer-x86_64.iso.part01',
    'Silk-Installer-x86_64.iso.part02',
    'Silk-Installer-x86_64.iso.part03'
  )
  Write-Silk "Lade Silk-Installer (~6 GB) ..."
  foreach ($f in $files) {
    Download-File "$base/$f" (Join-Path $WorkDir $f)
  }
  return (Join-SplitMedia -BaseName 'Silk-Installer-x86_64.iso' -Dir $WorkDir)
}

function Download-ReadyQcow {
  $base = Get-ReleaseBase
  Ensure-Dir $WorkDir
  $files = @(
    'Silk-VM-x86_64.qcow2.sha256',
    'Silk-VM-x86_64.qcow2.part00',
    'Silk-VM-x86_64.qcow2.part01',
    'Silk-VM-x86_64.qcow2.part02'
  )
  Write-Silk "Lade fertige Silk-VM (QCOW2, ~6 GB) ..."
  foreach ($f in $files) {
    Download-File "$base/$f" (Join-Path $WorkDir $f)
  }
  return (Join-SplitMedia -BaseName 'Silk-VM-x86_64.qcow2' -Dir $WorkDir)
}

function Convert-QcowToVhdx([string]$Qcow, [string]$Vhdx) {
  $qemu = Get-Command qemu-img -ErrorAction SilentlyContinue
  if (-not $qemu) {
    throw @'
Mode Ready unter Hyper-V braucht qemu-img zur Umwandlung QCOW2 -> VHDX.

Schnellste Variante: -Mode Installer  (ISO, keine Konvertierung)
Oder qemu-img installieren (z.B. ueber MSYS2 / QEMU fuer Windows) und erneut -Mode Ready.
'@
  }
  Write-Silk "Konvertiere QCOW2 -> VHDX ..."
  & $qemu.Source convert -p -f qcow2 -O vhdx $Qcow $Vhdx
  if ($LASTEXITCODE -ne 0) { throw 'qemu-img convert fehlgeschlagen' }
  return $Vhdx
}

function Convert-QcowToVdi([string]$Qcow, [string]$Vdi) {
  $qemu = Get-Command qemu-img -ErrorAction SilentlyContinue
  if ($qemu) {
    Write-Silk "Konvertiere QCOW2 -> VDI ..."
    & $qemu.Source convert -p -f qcow2 -O vdi $Qcow $Vdi
    if ($LASTEXITCODE -ne 0) { throw 'qemu-img convert fehlgeschlagen' }
    return $Vdi
  }
  # Fallback: VirtualBox kann kein qcow2 - dann Installer-Modus erzwingen
  throw 'Ready-Disk unter VirtualBox braucht qemu-img (QCOW->VDI). Nutze -Mode Installer.'
}

function New-SilkHyperVInstaller {
  param([string]$IsoPath)
  if (-not (Test-IsAdmin)) { throw 'Hyper-V benoetigt Administrator-Rechte.' }
  Write-Silk "Hyper-V VM '$VmName' anlegen (Installer) ..."
  $vmPath = Join-Path $WorkDir 'Hyper-V'
  Ensure-Dir $vmPath
  $vhd = Join-Path $vmPath "$VmName.vhdx"

  if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    Write-Host "VM existiert bereits - ISO aktualisieren / starten."
  } else {
    New-VM -Name $VmName -MemoryStartupBytes ($MemMB * 1MB) -Generation 2 `
      -NewVHDPath $vhd -NewVHDSizeBytes ($DiskGB * 1GB) -Path $vmPath | Out-Null
    Set-VMProcessor -VMName $VmName -Count $Cpus
    Set-VMFirmware -VMName $VmName -EnableSecureBoot Off
    Set-VM -Name $VmName -CheckpointType Disabled -AutomaticCheckpointsEnabled $false -ErrorAction SilentlyContinue
  }

  # DVD mit Silk-ISO
  $dvd = Get-VMDvdDrive -VMName $VmName -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($dvd) {
    Set-VMDvdDrive -VMName $VmName -Path $IsoPath
  } else {
    Add-VMDvdDrive -VMName $VmName -Path $IsoPath
  }
  $dvd = Get-VMDvdDrive -VMName $VmName | Select-Object -First 1
  $hdd = Get-VMHardDiskDrive -VMName $VmName | Select-Object -First 1
  # Vom DVD booten
  Set-VMFirmware -VMName $VmName -FirstBootDevice $dvd -ErrorAction SilentlyContinue

  if ($DoStart) {
    Write-Silk "Starte Hyper-V VM ..."
    Start-VM -Name $VmName
    try { vmconnect.exe localhost $VmName } catch { Start-Process vmconnect.exe -ArgumentList "localhost","$VmName" -ErrorAction SilentlyContinue }
  }
  Write-Host "Fertig. In der VM: Silk installieren, dann nach Login silk-tour."
}

function New-SilkHyperVReady {
  param([string]$QcowPath)
  if (-not (Test-IsAdmin)) { throw 'Hyper-V benoetigt Administrator-Rechte.' }
  $vmPath = Join-Path $WorkDir 'Hyper-V'
  Ensure-Dir $vmPath
  $vhdx = Join-Path $vmPath 'Silk-VM-x86_64.vhdx'
  if (-not (Test-Path -LiteralPath $vhdx) -or $ForceDownload) {
    Convert-QcowToVhdx -Qcow $QcowPath -Vhdx $vhdx | Out-Null
  }
  Write-Silk "Hyper-V VM '$VmName' anlegen (Ready-Disk) ..."
  if (-not (Get-VM -Name $VmName -ErrorAction SilentlyContinue)) {
    New-VM -Name $VmName -MemoryStartupBytes ($MemMB * 1MB) -Generation 2 `
      -VHDPath $vhdx -Path $vmPath | Out-Null
    Set-VMProcessor -VMName $VmName -Count $Cpus
    Set-VMFirmware -VMName $VmName -EnableSecureBoot Off
  }
  if ($DoStart) {
    Start-VM -Name $VmName
    try { vmconnect.exe localhost $VmName } catch { }
  }
}

function New-SilkVBoxInstaller {
  param([string]$IsoPath)
  Register-VBoxManagePath | Out-Null
  $VBoxManage = Find-VBoxManage
  if (-not $VBoxManage) { throw 'VBoxManage nicht gefunden nach VirtualBox-Setup.' }
  Write-Silk "VirtualBox VM '$VmName' anlegen (Installer) ..."
  Ensure-Dir $WorkDir
  $vdi = Join-Path $WorkDir "$VmName.vdi"

  $exists = & $VBoxManage showvminfo $VmName 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $VBoxManage createvm --name $VmName --ostype Linux26_64 --register --basefolder $WorkDir | Out-Null
    if (-not (Test-Path -LiteralPath $vdi)) {
      & $VBoxManage createmedium disk --filename $vdi --size ($DiskGB * 1024) --format VDI | Out-Null
    }
    & $VBoxManage storagectl $VmName --name SATA --add sata --controller IntelAhci | Out-Null
    & $VBoxManage storageattach $VmName --storagectl SATA --port 0 --device 0 --type hdd --medium $vdi | Out-Null
    & $VBoxManage storagectl $VmName --name IDE --add ide | Out-Null
  }

  & $VBoxManage modifyvm $VmName `
    --memory $MemMB --cpus $Cpus --firmware efi --vram 128 `
    --nic1 nat --mouse usbtablet --graphicscontroller vmsvga `
    --clipboard-mode bidirectional --ioapic on --acpi on `
    --description 'Silk - Desktop-Betriebssystem' | Out-Null

  & $VBoxManage storageattach $VmName --storagectl IDE --port 0 --device 0 `
    --type dvddrive --medium $IsoPath 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $VBoxManage storageattach $VmName --storagectl IDE --port 0 --device 0 `
      --type dvddrive --medium $IsoPath --forceunmount | Out-Null
  }

  if ($DoStart) {
    Write-Silk "Starte VirtualBox ..."
    & $VBoxManage startvm $VmName --type gui
  }
  Write-Host "Fertig. In der VM: Silk installieren, dann nach Login silk-tour."
}

function New-SilkVBoxReady {
  param([string]$QcowPath)
  Register-VBoxManagePath | Out-Null
  $VBoxManage = Find-VBoxManage
  if (-not $VBoxManage) { throw 'VBoxManage nicht gefunden nach VirtualBox-Setup.' }
  $vdi = Join-Path $WorkDir 'Silk-VM-x86_64.vdi'
  if (-not (Test-Path -LiteralPath $vdi) -or $ForceDownload) {
    Convert-QcowToVdi -Qcow $QcowPath -Vdi $vdi | Out-Null
  }
  Write-Silk "VirtualBox VM '$VmName' anlegen (Ready-Disk) ..."
  Ensure-Dir $WorkDir
  $exists = & $VBoxManage showvminfo $VmName 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $VBoxManage createvm --name $VmName --ostype Linux26_64 --register --basefolder $WorkDir | Out-Null
    & $VBoxManage storagectl $VmName --name SATA --add sata --controller IntelAhci | Out-Null
    & $VBoxManage storageattach $VmName --storagectl SATA --port 0 --device 0 --type hdd --medium $vdi | Out-Null
  }
  & $VBoxManage modifyvm $VmName `
    --memory $MemMB --cpus $Cpus --firmware efi --vram 128 `
    --nic1 nat --mouse usbtablet --graphicscontroller vmsvga `
    --description 'Silk - Desktop-Betriebssystem' | Out-Null
  if ($DoStart) {
    & $VBoxManage startvm $VmName --type gui
  }
}

# --- main ----------------------------------------------------------------
Write-Host @"

  Silk VM Setup fuer Windows
  Backend: $Backend | Mode: $Mode | RAM: ${MemMB}MB | CPUs: $Cpus

"@ -ForegroundColor Green

$resolved = Resolve-Backend -Wanted $Backend
Write-Silk "Nutze Backend: $resolved"

Ensure-Dir $WorkDir

if ($Mode -eq 'Installer') {
  $iso = Download-InstallerIso
  if ($resolved -eq 'HyperV') {
    New-SilkHyperVInstaller -IsoPath $iso
  } else {
    New-SilkVBoxInstaller -IsoPath $iso
  }
} else {
  $qcow = Download-ReadyQcow
  if ($resolved -eq 'HyperV') {
    New-SilkHyperVReady -QcowPath $qcow
  } else {
    New-SilkVBoxReady -QcowPath $qcow
  }
}

Write-Silk "Arbeitsverzeichnis: $WorkDir"
Write-Host "Hilfe: silk-tour --center  (in der Silk-VM nach dem Login)"
