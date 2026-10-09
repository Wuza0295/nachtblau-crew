# Silk-VM Bootstrap fuer Windows (ohne Git-Clone)
#
# In PowerShell:
#
#   irm https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/windows/Get-SilkVM.ps1 | iex
#
# Falls ExecutionPolicy stoert, alternativ:
#   powershell -ExecutionPolicy Bypass -Command "irm …/Get-SilkVM.ps1 | iex"
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

# Von Internet geladene Dateien sind oft "blocked" + ExecutionPolicy RemoteSigned
try { Unblock-File -LiteralPath $ps1 -ErrorAction SilentlyContinue } catch { }

Write-Host "==> Starte Installation (ExecutionPolicy Bypass) …"
$argList = @(
  '-NoProfile'
  '-ExecutionPolicy', 'Bypass'
  '-File', $ps1
  '-Backend', $Backend
  '-Mode', $Mode
  '-MemMB', "$MemMB"
  '-Cpus', "$Cpus"
  '-WorkDir', $Work
)
$p = Start-Process -FilePath (Get-Process -Id $PID).Path -ArgumentList $argList -Wait -PassThru -NoNewWindow
if ($p.ExitCode -ne 0) {
  exit $p.ExitCode
}
