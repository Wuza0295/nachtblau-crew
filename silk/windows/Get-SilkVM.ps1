# Silk-VM Bootstrap fuer Windows (ohne Git-Clone)
#
# In PowerShell (als normaler User, VirtualBox empfohlen):
#
#   irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex
#
# Oder speichern und ausfuehren:
#   irm .../Get-SilkVM.ps1 -OutFile Get-SilkVM.ps1
#   powershell -ExecutionPolicy Bypass -File .\Get-SilkVM.ps1
#
param(
  [ValidateSet('Auto', 'HyperV', 'VirtualBox')]
  [string]$Backend = 'VirtualBox',

  [ValidateSet('Installer', 'Ready')]
  [string]$Mode = 'Installer',

  [int]$MemMB = 4096,
  [int]$Cpus = 2
)

$ErrorActionPreference = 'Stop'
$Branch = 'cursor/silk-connect-multiplatform-fef1'
$Base = "https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/$Branch/silk/windows"
$Work = Join-Path $env:USERPROFILE 'Silk-VMs'
$Tools = Join-Path $Work 'tools'
New-Item -ItemType Directory -Force -Path $Tools | Out-Null

Write-Host ""
Write-Host "Silk VM Bootstrap" -ForegroundColor Green
Write-Host "Backend=$Backend  Mode=$Mode  -> $Work"
Write-Host ""

$ps1 = Join-Path $Tools 'Install-SilkVM.ps1'
Write-Host "==> Lade Install-SilkVM.ps1 …"
Invoke-WebRequest -Uri "$Base/Install-SilkVM.ps1" -OutFile $ps1 -UseBasicParsing

$args = @{
  Backend = $Backend
  Mode    = $Mode
  MemMB   = $MemMB
  Cpus    = $Cpus
  WorkDir = $Work
}

Write-Host "==> Starte Installation …"
& $ps1 @args
