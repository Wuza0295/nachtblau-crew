# NachtBlau Hub — Installation auf dem Windows-Notebook
# Kein Admin nötig. Legt optional Desktop- und Startmenü-Shortcuts an.
#
# Nutzung (PowerShell im Repo oder Doppelklick auf Install-NachtBlauHub.cmd):
#   .\Install-NachtBlauHub.ps1
#   .\Install-NachtBlauHub.ps1 -Start
#   .\Install-NachtBlauHub.ps1 -NoShortcut
#   .\Install-NachtBlauHub.ps1 -SkipInstall

[CmdletBinding()]
param(
    [switch]$Start,
    [switch]$NoShortcut,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "=== NachtBlau Hub — Windows Install ===" -ForegroundColor Cyan
Write-Host "Ordner: $ScriptDir"
Write-Host ""

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Node {
    if (Test-CommandExists "node") {
        $v = node -v
        Write-Host "[OK] Node.js: $v" -ForegroundColor Green
        return
    }
    Write-Host "[FEHLER] Node.js fehlt." -ForegroundColor Red
    Write-Host ""
    Write-Host "Bitte installieren:"
    Write-Host "  1) https://nodejs.org/ (LTS) herunterladen und installieren"
    Write-Host "  2) PowerShell neu öffnen"
    Write-Host "  3) Dieses Skript erneut ausführen"
    Write-Host ""
    Write-Host "Oder mit winget:  winget install OpenJS.NodeJS.LTS"
    exit 1
}

function Ensure-Pnpm {
    if (Test-CommandExists "pnpm") {
        $v = pnpm -v
        Write-Host "[OK] pnpm: $v" -ForegroundColor Green
        return
    }
    Write-Host "[FEHLER] pnpm fehlt." -ForegroundColor Red
    Write-Host ""
    Write-Host "Nach Node-Installation (empfohlen):"
    Write-Host "  npm install -g pnpm"
    Write-Host ""
    Write-Host "Oder:  corepack enable  &&  corepack prepare pnpm@latest --activate"
    Write-Host "Danach PowerShell neu öffnen und dieses Skript erneut ausführen."
    exit 1
}

function New-NachtBlauShortcut {
    param(
        [Parameter(Mandatory = $true)][string]$LinkPath,
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [string]$Arguments = "",
        [string]$Description = "NachtBlau Hub Launcher"
    )
    $parent = Split-Path -Parent $LinkPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $wsh = New-Object -ComObject WScript.Shell
    $sc = $wsh.CreateShortcut($LinkPath)
    $sc.TargetPath = $TargetPath
    $sc.Arguments = $Arguments
    $sc.WorkingDirectory = $WorkingDirectory
    $sc.Description = $Description
    $sc.WindowStyle = 1
    $sc.Save()
    Write-Host "[OK] Shortcut: $LinkPath" -ForegroundColor Green
}

Ensure-Node
Ensure-Pnpm

if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "pnpm install …" -ForegroundColor Cyan
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FEHLER] pnpm install fehlgeschlagen (Exit $LASTEXITCODE)." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Abhängigkeiten installiert." -ForegroundColor Green
} else {
    Write-Host "[Skip] pnpm install übersprungen (-SkipInstall)." -ForegroundColor Yellow
}

if (-not $NoShortcut) {
    Write-Host ""
    Write-Host "Shortcuts anlegen (ohne Admin) …" -ForegroundColor Cyan

    $startCmd = Join-Path $ScriptDir "Start-NachtBlauHub.cmd"
    if (-not (Test-Path $startCmd)) {
        Write-Host "[FEHLER] Start-NachtBlauHub.cmd fehlt neben dem Install-Skript." -ForegroundColor Red
        exit 1
    }
    $desktop = [Environment]::GetFolderPath("Desktop")
    $startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\NachtBlau"

    New-NachtBlauShortcut `
        -LinkPath (Join-Path $desktop "NachtBlau Hub.lnk") `
        -TargetPath $startCmd `
        -WorkingDirectory $ScriptDir

    New-NachtBlauShortcut `
        -LinkPath (Join-Path $startMenu "NachtBlau Hub.lnk") `
        -TargetPath $startCmd `
        -WorkingDirectory $ScriptDir
} else {
    Write-Host "[Skip] Keine Shortcuts (-NoShortcut)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Fertig ===" -ForegroundColor Cyan
Write-Host "Start manuell:"
Write-Host "  cd `"$ScriptDir`""
Write-Host "  pnpm start"
Write-Host ""
Write-Host "Oder Desktop-/Startmenü-Shortcut „NachtBlau Hub“."
Write-Host "Hub-URL: https://launcher.nachtblau-interactive.com/windows.html"
Write-Host ""

if ($Start) {
    Write-Host "Starte Hub …" -ForegroundColor Cyan
    pnpm start
}
