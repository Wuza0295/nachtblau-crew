<#
.SYNOPSIS
  Silk unter Windows in einer VM installieren / starten (Hyper-V oder VirtualBox).

.DESCRIPTION
  Lädt das Silk-Install-Medium vom GitHub-Release, setzt Split-Dateien zusammen,
  legt eine VM an und startet sie. Kein manuelles Basteln nötig.

.EXAMPLE
  .\Install-SilkVM.ps1
  .\Install-SilkVM.ps1 -Backend VirtualBox -Mode Ready
  .\Install-SilkVM.ps1 -Backend HyperV -Mode Installer -MemMB 8192 -Cpus 4
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
  [switch]$ForceDownload
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

function Resolve-Backend {
  param([string]$Wanted)
  $hasVBox = [bool](Get-Command VBoxManage -ErrorAction SilentlyContinue)
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
    if (-not $hasVBox) { throw 'VirtualBox / VBoxManage nicht gefunden. Bitte VirtualBox installieren.' }
    return 'VirtualBox'
  }
  if ($Wanted -eq 'HyperV') {
    if (-not $hasHyperV) { throw 'Hyper-V nicht verfügbar (Windows Pro + Feature + Admin).' }
    return 'HyperV'
  }
  # Auto: Hyper-V bevorzugen wenn Admin + Feature, sonst VirtualBox
  if ($hasHyperV -and (Test-IsAdmin)) { return 'HyperV' }
  if ($hasVBox) { return 'VirtualBox' }
  if ($hasHyperV) {
    throw 'Hyper-V gefunden, aber ohne Admin-Rechte. PowerShell als Administrator starten oder VirtualBox installieren.'
  }
  throw @'
Kein Hypervisor gefunden.

Option A: VirtualBox installieren → https://www.virtualbox.org/
Option B: Hyper-V aktivieren (Win Pro):
  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
  (Neustart, dann dieses Skript als Admin)
'@
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
  Write-Host "  ↓ $(Split-Path $Dest -Leaf)"
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
    throw "Keine Split-Teile für $BaseName in $Dir"
  }
  Write-Silk "Setze $BaseName aus $($parts.Count) Teilen zusammen …"
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
    Write-Silk "Prüfe SHA256 …"
    $expected = ((Get-Content $shaFile -Raw) -split '\s+')[0].Trim().ToLowerInvariant()
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $out).Hash.ToLowerInvariant()
    if ($hash -ne $expected) {
      Remove-Item -Force $out -ErrorAction SilentlyContinue
      throw "SHA256 mismatch für $BaseName (erwartet $expected, ist $hash)"
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
  Write-Silk "Lade Silk-Installer (~6 GB) …"
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
  Write-Silk "Lade fertige Silk-VM (QCOW2, ~6 GB) …"
  foreach ($f in $files) {
    Download-File "$base/$f" (Join-Path $WorkDir $f)
  }
  return (Join-SplitMedia -BaseName 'Silk-VM-x86_64.qcow2' -Dir $WorkDir)
}

function Convert-QcowToVhdx([string]$Qcow, [string]$Vhdx) {
  $qemu = Get-Command qemu-img -ErrorAction SilentlyContinue
  if (-not $qemu) {
    throw @'
Mode Ready unter Hyper-V braucht qemu-img zur Umwandlung QCOW2 → VHDX.

Schnellste Variante: -Mode Installer  (ISO, keine Konvertierung)
Oder qemu-img installieren (z.B. über MSYS2 / QEMU für Windows) und erneut -Mode Ready.
'@
  }
  Write-Silk "Konvertiere QCOW2 → VHDX …"
  & $qemu.Source convert -p -f qcow2 -O vhdx $Qcow $Vhdx
  if ($LASTEXITCODE -ne 0) { throw 'qemu-img convert fehlgeschlagen' }
  return $Vhdx
}

function Convert-QcowToVdi([string]$Qcow, [string]$Vdi) {
  $qemu = Get-Command qemu-img -ErrorAction SilentlyContinue
  if ($qemu) {
    Write-Silk "Konvertiere QCOW2 → VDI …"
    & $qemu.Source convert -p -f qcow2 -O vdi $Qcow $Vdi
    if ($LASTEXITCODE -ne 0) { throw 'qemu-img convert fehlgeschlagen' }
    return $Vdi
  }
  # Fallback: VirtualBox kann kein qcow2 – dann Installer-Modus erzwingen
  throw 'Ready-Disk unter VirtualBox braucht qemu-img (QCOW→VDI). Nutze -Mode Installer.'
}

function New-SilkHyperVInstaller {
  param([string]$IsoPath)
  if (-not (Test-IsAdmin)) { throw 'Hyper-V benötigt Administrator-Rechte.' }
  Write-Silk "Hyper-V VM '$VmName' anlegen (Installer) …"
  $vmPath = Join-Path $WorkDir 'Hyper-V'
  Ensure-Dir $vmPath
  $vhd = Join-Path $vmPath "$VmName.vhdx"

  if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    Write-Host "VM existiert bereits – ISO aktualisieren / starten."
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
    Write-Silk "Starte Hyper-V VM …"
    Start-VM -Name $VmName
    try { vmconnect.exe localhost $VmName } catch { Start-Process vmconnect.exe -ArgumentList "localhost","$VmName" -ErrorAction SilentlyContinue }
  }
  Write-Host "Fertig. In der VM: Silk installieren, dann nach Login silk-tour."
}

function New-SilkHyperVReady {
  param([string]$QcowPath)
  if (-not (Test-IsAdmin)) { throw 'Hyper-V benötigt Administrator-Rechte.' }
  $vmPath = Join-Path $WorkDir 'Hyper-V'
  Ensure-Dir $vmPath
  $vhdx = Join-Path $vmPath 'Silk-VM-x86_64.vhdx'
  if (-not (Test-Path -LiteralPath $vhdx) -or $ForceDownload) {
    Convert-QcowToVhdx -Qcow $QcowPath -Vhdx $vhdx | Out-Null
  }
  Write-Silk "Hyper-V VM '$VmName' anlegen (Ready-Disk) …"
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
  $VBoxManage = (Get-Command VBoxManage).Source
  Write-Silk "VirtualBox VM '$VmName' anlegen (Installer) …"
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
    --description 'Silk – Desktop-Betriebssystem' | Out-Null

  & $VBoxManage storageattach $VmName --storagectl IDE --port 0 --device 0 `
    --type dvddrive --medium $IsoPath 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $VBoxManage storageattach $VmName --storagectl IDE --port 0 --device 0 `
      --type dvddrive --medium $IsoPath --forceunmount | Out-Null
  }

  if ($DoStart) {
    Write-Silk "Starte VirtualBox …"
    & $VBoxManage startvm $VmName --type gui
  }
  Write-Host "Fertig. In der VM: Silk installieren, dann nach Login silk-tour."
}

function New-SilkVBoxReady {
  param([string]$QcowPath)
  $VBoxManage = (Get-Command VBoxManage).Source
  $vdi = Join-Path $WorkDir 'Silk-VM-x86_64.vdi'
  if (-not (Test-Path -LiteralPath $vdi) -or $ForceDownload) {
    Convert-QcowToVdi -Qcow $QcowPath -Vdi $vdi | Out-Null
  }
  Write-Silk "VirtualBox VM '$VmName' anlegen (Ready-Disk) …"
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
    --description 'Silk – Desktop-Betriebssystem' | Out-Null
  if ($DoStart) {
    & $VBoxManage startvm $VmName --type gui
  }
}

# ── main ────────────────────────────────────────────────────────────
Write-Host @"

  Silk VM Setup für Windows
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
