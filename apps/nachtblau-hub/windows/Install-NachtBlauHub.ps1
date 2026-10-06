# NachtBlau Hub — Installation auf dem Windows-Notebook
# Kein Admin nötig. Legt standardmäßig Desktop- und Startmenü-Shortcuts an.
#
# Nutzung (PowerShell im Repo oder Doppelklick auf Install-NachtBlauHub.cmd):
#   .\Install-NachtBlauHub.ps1
#   .\Install-NachtBlauHub.ps1 -Start
#   .\Install-NachtBlauHub.ps1 -SkipInstall          # nur Shortcuts nachziehen
#   .\Install-NachtBlauHub.ps1 -NoShortcut
#   powershell -ExecutionPolicy Bypass -File .\Install-NachtBlauHub.ps1

[CmdletBinding()]
param(
    [switch]$Start,
    [switch]$NoShortcut,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$ShortcutName = "NachtBlau Hub.lnk"
$CreatedShortcutPaths = [System.Collections.Generic.List[string]]::new()

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

function Get-NachtBlauDesktopFolders {
    # Known Folder (folgt OneDrive-Umleitung) + klassischer Desktop + OneDrive*\Desktop
    $candidates = [System.Collections.Generic.List[string]]::new()
    $known = [Environment]::GetFolderPath("Desktop")
    if (-not [string]::IsNullOrWhiteSpace($known)) {
        $candidates.Add($known)
    }
    foreach ($rel in @("Desktop", "OneDrive\Desktop")) {
        $p = Join-Path $env:USERPROFILE $rel
        if (-not [string]::IsNullOrWhiteSpace($p)) {
            $candidates.Add($p)
        }
    }
    Get-ChildItem -Path $env:USERPROFILE -Directory -Filter "OneDrive*" -ErrorAction SilentlyContinue |
        ForEach-Object {
            $candidates.Add((Join-Path $_.FullName "Desktop"))
        }

    $resolved = foreach ($c in ($candidates | Select-Object -Unique)) {
        if ([string]::IsNullOrWhiteSpace($c)) { continue }
        if (Test-Path -LiteralPath $c) {
            (Resolve-Path -LiteralPath $c).Path
        }
    }
    return @($resolved | Select-Object -Unique)
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
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    # .cmd zuverlässig über cmd.exe starten (Explorer-Doppelklick)
    $cmdExe = Join-Path $env:SystemRoot "System32\cmd.exe"
    if (-not (Test-Path -LiteralPath $cmdExe)) {
        $cmdExe = "cmd.exe"
    }
    $shortcutArgs = "/c `"$TargetPath`""
    if (-not [string]::IsNullOrWhiteSpace($Arguments)) {
        $shortcutArgs = "/c `"$TargetPath`" $Arguments"
    }

    $wsh = New-Object -ComObject WScript.Shell
    $sc = $wsh.CreateShortcut($LinkPath)
    $sc.TargetPath = $cmdExe
    $sc.Arguments = $shortcutArgs
    $sc.WorkingDirectory = $WorkingDirectory
    $sc.Description = $Description
    $sc.WindowStyle = 1
    if (Test-Path -LiteralPath $TargetPath) {
        $sc.IconLocation = "$TargetPath,0"
    }
    $sc.Save()

    if (-not (Test-Path -LiteralPath $LinkPath)) {
        throw "Shortcut wurde nicht geschrieben: $LinkPath"
    }
    Write-Host "[OK] Shortcut: $LinkPath" -ForegroundColor Green
    $script:CreatedShortcutPaths.Add($LinkPath)
}

Ensure-Node
Ensure-Pnpm

if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "pnpm install …" -ForegroundColor Cyan
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FEHLER] pnpm install fehlgeschlagen (Exit $LASTEXITCODE)." -ForegroundColor Red
        Write-Host "Keine Shortcuts angelegt — zuerst Install-Fehler beheben, dann erneut ausführen."
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
    if (-not (Test-Path -LiteralPath $startCmd)) {
        Write-Host "[FEHLER] Start-NachtBlauHub.cmd fehlt neben dem Install-Skript." -ForegroundColor Red
        exit 1
    }

    $desktopFolders = @(Get-NachtBlauDesktopFolders)
    if ($desktopFolders.Count -eq 0) {
        Write-Host "[FEHLER] Kein Desktop-Ordner gefunden (weder Known Folder noch %USERPROFILE%\Desktop)." -ForegroundColor Red
        exit 1
    }

    Write-Host "Desktop-Ordner:"
    foreach ($d in $desktopFolders) {
        Write-Host "  - $d"
    }

    foreach ($desktop in $desktopFolders) {
        New-NachtBlauShortcut `
            -LinkPath (Join-Path $desktop $ShortcutName) `
            -TargetPath $startCmd `
            -WorkingDirectory $ScriptDir
    }

    $startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\NachtBlau"
    New-NachtBlauShortcut `
        -LinkPath (Join-Path $startMenu $ShortcutName) `
        -TargetPath $startCmd `
        -WorkingDirectory $ScriptDir
} else {
    Write-Host "[Skip] Keine Shortcuts (-NoShortcut)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Fertig ===" -ForegroundColor Cyan
if ($CreatedShortcutPaths.Count -gt 0) {
    Write-Host "Shortcuts erstellt (Doppelklick startet den Hub):" -ForegroundColor Green
    foreach ($p in $CreatedShortcutPaths) {
        Write-Host "  $p"
    }
    Write-Host ""
    Write-Host "So starten:"
    Write-Host "  1) Desktop: Doppelklick auf „NachtBlau Hub“"
    Write-Host "  2) Startmenü: NachtBlau → NachtBlau Hub"
    Write-Host "  3) Manuell:"
    Write-Host "       cd `"$ScriptDir`""
    Write-Host "       pnpm start"
} else {
    Write-Host "Keine Shortcuts angelegt."
    Write-Host "Start manuell:"
    Write-Host "  cd `"$ScriptDir`""
    Write-Host "  pnpm start"
    Write-Host ""
    Write-Host "Shortcuts nachziehen:"
    Write-Host "  powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -SkipInstall"
}
Write-Host ""
Write-Host "Hub-URL: https://launcher.nachtblau-interactive.com/windows.html"
Write-Host ""

if ($Start) {
    Write-Host "Starte Hub …" -ForegroundColor Cyan
    pnpm start
}
