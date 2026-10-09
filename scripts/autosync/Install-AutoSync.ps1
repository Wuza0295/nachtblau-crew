# Installiert NachtBlau Auto-Sync als geplante Aufgabe (Task Scheduler) unter Windows.
[CmdletBinding()]
param(
  [ValidateSet("Enable", "Disable", "Status", "RunNow")]
  [string]$Action = "Enable",
  [string]$RepoRoot = "",
  [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"
if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}
$TaskName = "NachtBlau-AutoSync"
$Runner = Join-Path $RepoRoot "scripts\autosync\Run-AutoSync.ps1"
$EnvDir = Join-Path $env:APPDATA "nachtblau"
$EnvFile = Join-Path $EnvDir "autosync.env"
$Example = Join-Path $RepoRoot "scripts\autosync\autosync.env.example"

function Ensure-Env {
  New-Item -ItemType Directory -Force -Path $EnvDir | Out-Null
  if (-not (Test-Path $EnvFile)) {
    Copy-Item $Example $EnvFile
    Add-Content $EnvFile "`nNACHTBLAU_REPO=$RepoRoot"
    Write-Host "→ Env angelegt: $EnvFile (NACHTBLAU_SYNC_ROOT bei Bedarf setzen)"
  } elseif (-not (Select-String -Path $EnvFile -Pattern '^NACHTBLAU_REPO=' -Quiet)) {
    Add-Content $EnvFile "NACHTBLAU_REPO=$RepoRoot"
  }
}

switch ($Action) {
  "Disable" {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Auto-Sync-Aufgabe '$TaskName' entfernt."
  }
  "Status" {
    $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $t) { Write-Host "Keine Aufgabe '$TaskName'."; break }
    $t | Format-List TaskName, State
    Get-ScheduledTaskInfo -TaskName $TaskName | Format-List LastRunTime, NextRunTime, LastTaskResult
    $log = Join-Path $env:LOCALAPPDATA "nachtblau\autosync.log"
    if (Test-Path $log) {
      Write-Host "--- letzte Log-Zeilen ---"
      Get-Content $log -Tail 20
    }
  }
  "RunNow" {
    Ensure-Env
    & $Runner -RepoRoot $RepoRoot -EnvFile $EnvFile
  }
  "Enable" {
    Ensure-Env
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`" -RepoRoot `"$RepoRoot`" -EnvFile `"$EnvFile`""
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
    # Bei Anmeldung + alle N Minuten
    $t1 = New-ScheduledTaskTrigger -AtLogOn
    $t2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
      -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
      -RepetitionDuration ([TimeSpan]::MaxValue)
    $settings = New-ScheduledTaskSettingsSet `
      -AllowStartIfOnBatteries `
      -DontStopIfGoingOnBatteries `
      -StartWhenAvailable `
      -MultipleInstances IgnoreNew
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    Register-ScheduledTask -TaskName $TaskName `
      -Action $action `
      -Trigger @($t1, $t2) `
      -Settings $settings `
      -Principal $principal `
      -Description "NachtBlau Auto-Sync: Git-Pull, Dual-Boot-Saves, Hub-Check (FTP-Deploy nur mit Credentials)" `
      | Out-Null

    Write-Host "✓ Auto-Sync aktiv (Task Scheduler: $TaskName)"
    Write-Host "  Intervall: $IntervalMinutes Min + bei Anmeldung"
    Write-Host "  Env:       $EnvFile"
    Write-Host "  Log:       $env:LOCALAPPDATA\nachtblau\autosync.log"
    Write-Host "  Saves:     NACHTBLAU_SYNC_ROOT in Env setzen"
    Write-Host "  Status:    .\scripts\autosync\Install-AutoSync.ps1 -Action Status"
  }
}
