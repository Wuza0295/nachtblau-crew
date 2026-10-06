<#
.SYNOPSIS
  Gleicher Git-/Projekt-Sync wie sync-bazzite-windows.sh – für Windows (PowerShell).

.EXAMPLE
  .\scripts\windows\Sync-NachtBlauRepo.ps1
  .\scripts\windows\Sync-NachtBlauRepo.ps1 -Branch main -StartSilkWebsite
  .\scripts\windows\Sync-NachtBlauRepo.ps1 -InstallSilkVm
#>
[CmdletBinding()]
param(
  [string]$Branch = $(if ($env:SYNC_BRANCH) { $env:SYNC_BRANCH } else { 'main' }),
  [string]$Remote = 'origin',
  [switch]$SkipPnpm,
  [switch]$Test,
  [switch]$StartSilkWebsite,
  [switch]$InstallSilkVm
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Msg) {
  Write-Host ""
  Write-Host "==> $Msg" -ForegroundColor Cyan
}

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $Root '.git'))) {
  throw "Kein Git-Repo unter $Root. Zuerst klonen: git clone https://github.com/Wuza0295/nachtblau-crew.git"
}

Set-Location $Root
Write-Step "Repository: $Root"
Write-Step "Remote $Remote, Branch $Branch"

$current = git branch --show-current 2>$null
if ($current -ne $Branch) {
  Write-Step "Checkout $Branch"
  git fetch $Remote $Branch
  git checkout $Branch
}

Write-Step 'git fetch & pull'
git fetch $Remote $Branch
git pull --ff-only $Remote $Branch

if (-not $SkipPnpm -and (Test-Path 'package.json')) {
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Step 'pnpm install'
    pnpm install --frozen-lockfile 2>$null
    if ($LASTEXITCODE -ne 0) { pnpm install }
  } elseif (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Step 'corepack pnpm install'
    corepack enable pnpm 2>$null
    pnpm install
  }
}

if ($Test) {
  Write-Step 'pnpm test'
  pnpm test
}

$head = git rev-parse --short HEAD
$subject = git log -1 --format=%s
Write-Step "Sync fertig – Commit: $head ($subject)"

if ($InstallSilkVm) {
  $vmScript = Join-Path $Root 'silk\windows\Install-SilkVM.ps1'
  if (-not (Test-Path $vmScript)) { throw "Fehlt: $vmScript" }
  Write-Step 'Silk-VM Setup'
  & $vmScript
}

if ($StartSilkWebsite) {
  $startSh = Join-Path $Root 'Silk-Website\start.sh'
  if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-Step 'Silk-Website via WSL'
    wsl bash -lc "cd '$(wsl wslpath -a $Root)'/Silk-Website && chmod +x start.sh && ./start.sh"
  } elseif (Test-Path (Join-Path $Root 'Silk-Website\index.html')) {
    Write-Step 'Silk-Website (statisch) im Standardbrowser'
    Start-Process (Join-Path $Root 'Silk-Website\index.html')
  } else {
    Write-Warning 'Silk-Website nicht gefunden.'
  }
}

Write-Host @"

Nächste Schritte:
  • Silk-VM:     .\silk\windows\Install-SilkVM.ps1
  • WSL-Sync:    ./scripts/sync-bazzite-windows.sh
  • Doku:        docs/SYNC-BAZZITE-WINDOWS.md

"@
