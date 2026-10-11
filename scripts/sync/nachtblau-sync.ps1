<#
.SYNOPSIS
  NachtBlau-Sync fuer Windows.

.DESCRIPTION
  Holt den aktuellen Projektstand, gleicht die Git-Konfiguration an, installiert
  die Abhaengigkeiten und schreibt einen Fingerabdruck in den Share-Ordner.
  Das Bazzite-/Linux-Gegenstueck ist scripts/sync/nachtblau-sync.sh - beide
  erzeugen denselben Fingerabdruck, damit "gleicher Stand" ueberpruefbar ist.

.EXAMPLE
  .\nachtblau-sync.ps1
  .\nachtblau-sync.ps1 sync -Branch main -Verify
  .\nachtblau-sync.ps1 compare
#>
[CmdletBinding()]
param(
  [ValidateSet('sync', 'status', 'compare', 'help')]
  [string]$Command = 'sync',

  [string]$Branch = '',
  [string]$Root = '',
  [string]$Share = '',
  [string[]]$CompareFiles = @(),
  [switch]$NoInstall,
  [switch]$Verify,
  [switch]$DryRun,
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'
$StateSchema = 1
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $ScriptDir 'sync-manifest.json'

# --- Ausgabe ---------------------------------------------------------------

function Write-Section([string]$Message) {
  if (-not $AsJson) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
  }
}

function Write-Step([string]$Message) {
  if (-not $AsJson) { Write-Host "    $Message" }
}

function Write-Warn([string]$Message) {
  Write-Warning $Message
}

function Test-Tool([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ToolVersion([string]$Name) {
  if (-not (Test-Tool $Name)) { return '' }
  try {
    return ((& $Name --version 2>$null) | Select-Object -First 1).ToString().Trim()
  } catch {
    return ''
  }
}

function Show-Usage {
  @'
NachtBlau-Sync (Windows)

  .\nachtblau-sync.ps1 [sync|status|compare|help] [Optionen]

Befehle:
  sync              Repo aktualisieren, Abhaengigkeiten installieren, Stand melden (Standard)
  status            Nur den aktuellen Stand ermitteln und anzeigen
  compare           Zustandsdateien von Bazzite und Windows vergleichen
  help              Diese Hilfe

Optionen:
  -Branch <name>    Zweig, der synchronisiert wird (Standard: main aus dem Manifest)
  -Root <pfad>      Arbeitskopie (Standard: aktuelles Repo bzw. %USERPROFILE%\NachtBlau\nachtblau-crew)
  -Share <pfad>     Gemeinsamer Ordner fuer die Zustandsdateien
                    (Standard: $env:NACHTBLAU_SYNC_SHARE oder <root>\.nachtblau-sync)
  -NoInstall        Abhaengigkeiten nicht installieren
  -Verify           Nach dem Sync "pnpm check" und "pnpm test" ausfuehren
  -DryRun           Nichts veraendern, nur zeigen, was passieren wuerde
  -AsJson           Nur die Zustandsdatei auf stdout ausgeben
'@ | Write-Host
}

# --- Manifest --------------------------------------------------------------

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifest nicht gefunden: $ManifestPath"
}
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json

# --- Plattform -------------------------------------------------------------

function Get-PlatformId {
  # Unter PowerShell 7 laeuft dieses Skript auch auf Linux (Testlauf); dann wird
  # die Plattform ehrlich gemeldet, damit der Vergleich nicht verfaelscht wird.
  if ($IsWindows -or $null -eq $IsWindows) { return 'windows' }
  if ($IsMacOS) { return 'macos' }
  return 'linux'
}

function Get-OsDescription {
  try {
    return [System.Runtime.InteropServices.RuntimeInformation]::OSDescription.Trim()
  } catch {
    return 'Windows'
  }
}

function Get-HomeDir {
  if ($env:USERPROFILE) { return $env:USERPROFILE }
  return $HOME
}

# --- Pfade -----------------------------------------------------------------

function Resolve-Root {
  if ($Root) { return $Root }
  if ($env:NACHTBLAU_ROOT) { return $env:NACHTBLAU_ROOT }
  $inner = & git -C $ScriptDir rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -eq 0 -and $inner) {
    return (Resolve-Path -LiteralPath ($inner | Select-Object -First 1)).Path
  }
  return (Join-Path (Join-Path (Get-HomeDir) $Manifest.workspace.windows) 'nachtblau-crew')
}

function Resolve-Share([string]$RootPath) {
  if ($Share) { return $Share }
  if ($env:NACHTBLAU_SYNC_SHARE) { return $env:NACHTBLAU_SYNC_SHARE }
  return (Join-Path $RootPath '.nachtblau-sync')
}

# --- Fingerabdruck ---------------------------------------------------------

function Get-Sha256OfBytes([byte[]]$Bytes) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    return (($sha.ComputeHash($Bytes) | ForEach-Object { $_.ToString('x2') }) -join '')
  } finally {
    $sha.Dispose()
  }
}

# Muss byte-gleich zu "printf ... | sha256sum" aus dem Bash-Skript sein:
# UTF-8 ohne BOM, Zeilenende LF.
function Get-Sha256OfText([string]$Text) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  return Get-Sha256OfBytes $encoding.GetBytes($Text)
}

function Get-Sha256OfFile([string]$Path) {
  return Get-Sha256OfBytes ([System.IO.File]::ReadAllBytes($Path))
}

function Get-RepoState([string]$RootPath, [string]$Platform) {
  $branchName = (& git -C $RootPath rev-parse --abbrev-ref HEAD 2>$null | Select-Object -First 1)
  if (-not $branchName) { $branchName = 'unbekannt' }
  $commit = (& git -C $RootPath rev-parse HEAD 2>$null | Select-Object -First 1)
  if (-not $commit) { $commit = '' }
  $tree = (& git -C $RootPath rev-parse 'HEAD^{tree}' 2>$null | Select-Object -First 1)
  if (-not $tree) { $tree = '' }

  $statusLines = @(& git -C $RootPath -c core.autocrlf=false status --porcelain=v1 2>$null |
      Where-Object { $_ -ne $null })
  $statusLines = [string[]]$statusLines
  if ($statusLines.Count -gt 0) {
    [System.Array]::Sort($statusLines, [System.StringComparer]::Ordinal)
    $statusHash = Get-Sha256OfText (($statusLines -join "`n") + "`n")
    $dirty = $true
  } else {
    $statusHash = Get-Sha256OfText ''
    $dirty = $false
  }

  # git schreibt den Diff selbst, damit keine PowerShell-Umkodierung dazwischen
  # kommt und der Hash exakt dem Bash-Pendant entspricht.
  $diffFile = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
  & git -C $RootPath -c core.autocrlf=false diff HEAD --binary --output=$diffFile 2>$null | Out-Null
  if (-not (Test-Path -LiteralPath $diffFile)) {
    [System.IO.File]::WriteAllBytes($diffFile, @())
  }
  $diffHash = Get-Sha256OfFile $diffFile
  Remove-Item -LiteralPath $diffFile -Force -ErrorAction SilentlyContinue

  $combined = Get-Sha256OfText "$tree`n$statusHash`n$diffHash`n"

  return [ordered]@{
    schema      = $StateSchema
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    host        = [ordered]@{
      platform = $Platform
      name     = [System.Environment]::MachineName
      os       = Get-OsDescription
    }
    repo        = [ordered]@{
      root   = $RootPath
      branch = $branchName
      commit = $commit
      dirty  = $dirty
    }
    fingerprint = [ordered]@{
      tree     = $tree
      status   = $statusHash
      diff     = $diffHash
      manifest = Get-Sha256OfFile $ManifestPath
      combined = $combined
    }
    toolchain   = [ordered]@{
      git  = Get-ToolVersion git
      node = Get-ToolVersion node
      pnpm = Get-ToolVersion pnpm
    }
  }
}

function Get-StateFilePath([string]$SharePath, [string]$Platform) {
  return (Join-Path $SharePath ("state-{0}-{1}.json" -f $Platform, [System.Environment]::MachineName))
}

# --- Schritte --------------------------------------------------------------

function Initialize-Checkout([string]$RootPath, [string]$BranchName, [string]$Url) {
  if (Test-Path -LiteralPath (Join-Path $RootPath '.git')) {
    Write-Step "Arbeitskopie: $RootPath"
  } else {
    if ($DryRun) {
      Write-Step "wuerde klonen: $Url -> $RootPath"
      return
    }
    Write-Step "Klone $Url -> $RootPath"
    $parent = Split-Path -Parent $RootPath
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
      New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    & git clone $Url $RootPath
    if ($LASTEXITCODE -ne 0) { throw "git clone fehlgeschlagen." }
  }

  if ($DryRun) {
    Write-Step "wuerde holen: origin/$BranchName"
    return
  }

  & git -C $RootPath fetch origin $BranchName --prune
  $pending = @(& git -C $RootPath status --porcelain=v1)
  if ($pending.Count -gt 0) {
    Write-Warn "Arbeitskopie hat lokale Aenderungen - kein automatischer Wechsel auf $BranchName."
    return
  }
  & git -C $RootPath checkout $BranchName 2>$null
  if ($LASTEXITCODE -ne 0) {
    & git -C $RootPath checkout -b $BranchName "origin/$BranchName"
  }
  & git -C $RootPath merge --ff-only "origin/$BranchName" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Kein Fast-Forward auf origin/$BranchName moeglich - bitte manuell mergen."
  }
}

function Set-RepoGitConfig([string]$RootPath) {
  foreach ($entry in $Manifest.gitConfig.PSObject.Properties) {
    if ($DryRun) {
      Write-Step "wuerde setzen: $($entry.Name)=$($entry.Value)"
    } else {
      & git -C $RootPath config $entry.Name $entry.Value
      Write-Step "$($entry.Name)=$($entry.Value)"
    }
  }
}

function Test-Toolchain {
  foreach ($tool in @('git', 'node', 'pnpm')) {
    if (Test-Tool $tool) {
      Write-Step "$tool $(Get-ToolVersion $tool)"
      continue
    }
    if ($tool -eq 'pnpm' -and (Test-Tool corepack)) {
      Write-Step 'pnpm fehlt - wird ueber corepack bereitgestellt.'
      continue
    }
    $pkg = $Manifest.platforms.windows.packages.$tool
    if ($pkg) {
      Write-Warn "$tool fehlt. Installation: winget install --id $pkg -e"
    } else {
      Write-Warn "$tool fehlt."
    }
  }
}

function Install-Dependencies([string]$RootPath) {
  if ($DryRun) {
    Write-Step 'wuerde ausfuehren: pnpm install --frozen-lockfile'
    return
  }
  if (Test-Tool corepack) { & corepack enable 2>$null | Out-Null }
  if (-not (Test-Tool pnpm)) {
    Write-Warn 'pnpm nicht verfuegbar - Installation uebersprungen.'
    return
  }
  Push-Location $RootPath
  try {
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'pnpm install fehlgeschlagen.' }
  } finally {
    Pop-Location
  }
}

function Invoke-Verification([string]$RootPath) {
  if ($DryRun) {
    Write-Step 'wuerde pruefen: pnpm check && pnpm test'
    return
  }
  Push-Location $RootPath
  try {
    foreach ($task in @('check', 'test')) {
      Write-Step "pnpm $task"
      & pnpm $task
      if ($LASTEXITCODE -ne 0) { throw "pnpm $task fehlgeschlagen." }
    }
  } finally {
    Pop-Location
  }
}

function Save-State($State, [string]$SharePath, [string]$Platform) {
  $target = Get-StateFilePath $SharePath $Platform
  if ($DryRun) {
    Write-Step "wuerde schreiben: $target"
    return
  }
  if (-not (Test-Path -LiteralPath $SharePath)) {
    New-Item -ItemType Directory -Path $SharePath -Force | Out-Null
  }
  $json = ($State | ConvertTo-Json -Depth 6)
  [System.IO.File]::WriteAllText($target, $json + "`n", (New-Object System.Text.UTF8Encoding($false)))
  Write-Step "Zustand gespeichert: $target"
}

function Show-StateSummary($State) {
  Write-Host ("    Plattform : {0} ({1})" -f $State.host.platform, $State.host.os)
  Write-Host ("    Zweig     : {0}" -f $State.repo.branch)
  Write-Host ("    Commit    : {0}" -f $State.repo.commit)
  Write-Host ("    Geaendert : {0}" -f $State.repo.dirty.ToString().ToLower())
  Write-Host ("    Fingerprint: {0}" -f $State.fingerprint.combined)
}

# --- compare ---------------------------------------------------------------

function Get-NewestState([string]$SharePath, [string]$Platform) {
  if (-not (Test-Path -LiteralPath $SharePath)) { return $null }
  return Get-ChildItem -LiteralPath $SharePath -Filter "state-$Platform-*.json" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
}

function Compare-States([string]$SharePath, [string]$PathA, [string]$PathB) {
  if (-not $PathA -or -not $PathB) {
    $a = Get-NewestState $SharePath 'bazzite'
    if (-not $a) { $a = Get-NewestState $SharePath 'linux' }
    if (-not $a) { $a = Get-NewestState $SharePath 'bootc' }
    $b = Get-NewestState $SharePath 'windows'
    if ($a) { $PathA = $a.FullName }
    if ($b) { $PathB = $b.FullName }
  }
  if (-not $PathA -or -not (Test-Path -LiteralPath $PathA)) {
    throw "Zustandsdatei der Linux-/Bazzite-Seite fehlt in $SharePath."
  }
  if (-not $PathB -or -not (Test-Path -LiteralPath $PathB)) {
    throw "Zustandsdatei der Windows-Seite fehlt in $SharePath."
  }

  $stateA = Get-Content -LiteralPath $PathA -Raw | ConvertFrom-Json
  $stateB = Get-Content -LiteralPath $PathB -Raw | ConvertFrom-Json

  Write-Section 'Vergleich'
  Write-Host ("    A: {0} ({1} @ {2})" -f $stateA.host.platform, $stateA.host.name, $stateA.generatedAt)
  Write-Host ("    B: {0} ({1} @ {2})" -f $stateB.host.platform, $stateB.host.name, $stateB.generatedAt)

  $fields = [ordered]@{
    'Zweig'       = { param($s) $s.repo.branch }
    'Commit'      = { param($s) $s.repo.commit }
    'Baum'        = { param($s) $s.fingerprint.tree }
    'Fingerprint' = { param($s) $s.fingerprint.combined }
    'Manifest'    = { param($s) $s.fingerprint.manifest }
  }

  $differences = 0
  foreach ($label in $fields.Keys) {
    $va = & $fields[$label] $stateA
    $vb = & $fields[$label] $stateB
    if ($va -ceq $vb) {
      Write-Host ("    = {0,-11} {1}" -f $label, $va)
    } else {
      Write-Host ("    x {0,-11} A={1} B={2}" -f $label, $va, $vb)
      $differences++
    }
  }

  if ($stateA.repo.dirty) { Write-Host ("    ! {0} hat ungespeicherte Aenderungen" -f $stateA.host.platform) }
  if ($stateB.repo.dirty) { Write-Host ("    ! {0} hat ungespeicherte Aenderungen" -f $stateB.host.platform) }

  if ($differences -eq 0 -and -not $stateA.repo.dirty -and -not $stateB.repo.dirty) {
    Write-Section 'Bazzite und Windows sind auf demselben Stand.'
    return 0
  }
  Write-Section 'Stand weicht ab - betroffene Seite erneut synchronisieren.'
  return 1
}

# --- main ------------------------------------------------------------------

if ($Command -eq 'help') {
  Show-Usage
  exit 0
}

if (-not (Test-Tool git)) {
  throw 'git fehlt - ohne git ist kein Sync moeglich. Installation: winget install --id Git.Git -e'
}

$platform = Get-PlatformId
$rootPath = Resolve-Root
$sharePath = Resolve-Share $rootPath
if (-not $Branch) { $Branch = $Manifest.repo.defaultBranch }

switch ($Command) {
  'compare' {
    $result = Compare-States $sharePath ($CompareFiles | Select-Object -First 1) ($CompareFiles | Select-Object -Skip 1 -First 1)
    exit $result
  }
  'status' {
    if (-not (Test-Path -LiteralPath (Join-Path $rootPath '.git'))) {
      throw "Keine Arbeitskopie unter $rootPath - zuerst 'sync' ausfuehren."
    }
    $state = Get-RepoState $rootPath $platform
    if ($AsJson) {
      $state | ConvertTo-Json -Depth 6
    } else {
      Write-Section "Stand ($platform)"
      Show-StateSummary $state
    }
  }
  'sync' {
    Write-Section "NachtBlau-Sync - $platform ($(Get-OsDescription))"
    Write-Step "Zweig: $Branch"
    Write-Step "Share: $sharePath"
    if ($DryRun) { Write-Step 'Probelauf - es wird nichts veraendert.' }

    Write-Section 'Arbeitskopie'
    Initialize-Checkout $rootPath $Branch $Manifest.repo.url

    if (Test-Path -LiteralPath (Join-Path $rootPath '.git')) {
      Write-Section 'Git-Konfiguration angleichen'
      Set-RepoGitConfig $rootPath

      Write-Section 'Toolchain'
      Test-Toolchain

      if (-not $NoInstall) {
        Write-Section 'Abhaengigkeiten'
        Install-Dependencies $rootPath
      }

      if ($Verify) {
        Write-Section 'Verifikation'
        Invoke-Verification $rootPath
      }

      $state = Get-RepoState $rootPath $platform
      Write-Section 'Stand'
      Show-StateSummary $state
      Save-State $state $sharePath $platform
      Write-Section "Naechster Schritt: auf der anderen Seite synchronisieren, danach 'compare'."
    } else {
      Write-Section 'Toolchain'
      Test-Toolchain
    }
  }
}
