# Dual-Boot Spielstände (Windows). Bazzite: scripts/dualboot/sync-saves.sh
param(
  [ValidateSet("sync", "push", "pull", "status")]
  [string]$Command = "sync",
  [string[]]$Only = @(),
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Py = Get-Command python -ErrorAction SilentlyContinue
if (-not $Py) { $Py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $Py) {
  Write-Error "Python fehlt. Bitte Python 3 installieren oder WSL nutzen: bash scripts/dualboot/sync-saves.sh"
}

$argsList = @("$Root\scripts\dualboot\sync_saves.py", $Command)
foreach ($id in $Only) { $argsList += @("--only", $id) }
if ($DryRun) { $argsList += "--dry-run" }

if (-not $env:NACHTBLAU_SYNC_ROOT) {
  Write-Host "Hinweis: NACHTBLAU_SYNC_ROOT ist nicht gesetzt — Standard D:\NachtBlauSync"
  Write-Host "  Beispiel: `$env:NACHTBLAU_SYNC_ROOT = 'D:\NachtBlauSync'"
}

& $Py.Source @argsList
exit $LASTEXITCODE
