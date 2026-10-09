# Auto-Sync-Lauf für Windows (Task Scheduler oder manuell).
# Linux: scripts/autosync/run-autosync.sh
[CmdletBinding()]
param(
  [string]$RepoRoot = "",
  [string]$EnvFile = ""
)

$ErrorActionPreference = "Continue"
if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}
if (-not $EnvFile) {
  $EnvFile = Join-Path $env:APPDATA "nachtblau\autosync.env"
}

$StateDir = Join-Path $env:LOCALAPPDATA "nachtblau"
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
$LogFile = Join-Path $StateDir "autosync.log"
$LockFile = Join-Path $env:TEMP "nachtblau-autosync.lock"

function Write-Log([string]$Msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "o"), $Msg
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

function Get-EnvMap([string]$Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $k, $v = $line.Split("=", 2)
    $map[$k.Trim()] = $v.Trim().Trim("'").Trim('"')
  }
  return $map
}

function Get-Flag($map, [string]$key, [string]$default = "1") {
  if ($map.ContainsKey($key) -and $map[$key]) { return $map[$key] }
  if (Test-Path "Env:$key") { return (Get-Item "Env:$key").Value }
  return $default
}

if (Test-Path $LockFile) {
  $age = (Get-Date) - (Get-Item $LockFile).LastWriteTime
  if ($age.TotalMinutes -lt 45) {
    Write-Log "Übersprungen — Lock vorhanden ($LockFile)"
    exit 0
  }
  Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType File -Force -Path $LockFile | Out-Null
try {
  $cfg = Get-EnvMap $EnvFile
  if ($cfg.ContainsKey("NACHTBLAU_REPO") -and $cfg["NACHTBLAU_REPO"]) {
    $RepoRoot = $cfg["NACHTBLAU_REPO"]
  }
  Write-Log "=== Auto-Sync Start (repo=$RepoRoot) ==="
  if (Test-Path $EnvFile) { Write-Log "Env: $EnvFile" }

  Set-Location $RepoRoot

  # Git
  if ((Get-Flag $cfg "AUTO_SYNC_GIT" "1") -eq "1") {
    if (Test-Path (Join-Path $RepoRoot ".git")) {
      $dirty = git status --porcelain 2>$null
      if ($dirty) {
        Write-Log "Git: Working Tree dirty — pull übersprungen"
      } else {
        $branch = if ($cfg["SYNC_BRANCH"]) { $cfg["SYNC_BRANCH"] } else { git branch --show-current }
        $remote = if ($cfg["SYNC_REMOTE"]) { $cfg["SYNC_REMOTE"] } else { "origin" }
        if ($branch) {
          Write-Log "Git: fetch/pull $remote $branch"
          git fetch $remote $branch 2>&1 | Out-Null
          git pull --ff-only $remote $branch 2>&1 | ForEach-Object { Write-Log "  $_" }
        }
      }
      if ((Get-Flag $cfg "AUTO_SYNC_PNPM" "1") -eq "1" -and (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Log "pnpm install"
        pnpm install --frozen-lockfile 2>$null
        if ($LASTEXITCODE -ne 0) { pnpm install }
      }
    } else {
      Write-Log "Git: kein Repo unter $RepoRoot"
    }
  }

  # Saves
  if ((Get-Flag $cfg "AUTO_SYNC_SAVES" "1") -eq "1") {
    $syncRoot = $cfg["NACHTBLAU_SYNC_ROOT"]
    if (-not $syncRoot) { $syncRoot = $env:NACHTBLAU_SYNC_ROOT }
    if ($syncRoot -and (Test-Path $syncRoot)) {
      Write-Log "Saves: sync → $syncRoot"
      $env:NACHTBLAU_SYNC_ROOT = $syncRoot
      $py = Get-Command python -ErrorAction SilentlyContinue
      if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
      if ($py) {
        & $py.Source (Join-Path $RepoRoot "scripts\dualboot\sync_saves.py") sync
      } else {
        Write-Log "Saves: Python fehlt"
      }
    } else {
      Write-Log "Saves: NACHTBLAU_SYNC_ROOT fehlt/nicht gemountet — übersprungen"
    }
  }

  # Hub check
  if ((Get-Flag $cfg "AUTO_SYNC_HUB_CHECK" "1") -eq "1") {
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
    if ($py -and (Test-Path (Join-Path $RepoRoot "scripts\hub-sync.py"))) {
      Write-Log "Hub Live-Check"
      & $py.Source (Join-Path $RepoRoot "scripts\hub-sync.py") check
    }
  }

  # Hub deploy only with FTP
  if ((Get-Flag $cfg "AUTO_SYNC_HUB_DEPLOY" "0") -eq "1") {
    $webEnv = Join-Path $RepoRoot ".env.webspace"
    $ftpUser = $env:FTP_USER
    $ftpPass = $env:FTP_PASS
    if (Test-Path $webEnv) {
      Get-Content $webEnv | ForEach-Object {
        if ($_ -match '^\s*FTP_USER=(.*)$') { $ftpUser = $Matches[1].Trim().Trim("'").Trim('"') }
        if ($_ -match '^\s*FTP_PASS=(.*)$') { $ftpPass = $Matches[1].Trim().Trim("'").Trim('"') }
      }
    }
    if ($ftpUser -and $ftpPass) {
      Write-Log "Hub-Deploy: Upload"
      $env:FTP_USER = $ftpUser
      $env:FTP_PASS = $ftpPass
      $py = Get-Command python -ErrorAction SilentlyContinue
      if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
      if ($py) { & $py.Source (Join-Path $RepoRoot "scripts\sync_bazzite_windows.py") }
    } else {
      Write-Log "Hub-Deploy: wartet auf FTP_USER/FTP_PASS — kein Upload"
    }
  }

  if ((Get-Flag $cfg "AUTO_SYNC_DESKTOP" "0") -eq "1") {
    Write-Log "Desktop-MC: bitte manuell Admin-Skript (zu schwer für Auto)"
  }

  Write-Log "=== Auto-Sync Ende ==="
} finally {
  Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
}
