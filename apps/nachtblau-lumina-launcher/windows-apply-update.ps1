# NachtBlau Lumina — Windows Apply-Update Helper
# Wait until the launcher process exits, then replace files and relaunch.
# Invoked detached by the Electron app shortly before quit.
param(
  [Parameter(Mandatory = $true)][int]$AppPid,
  [Parameter(Mandatory = $true)][string]$PackagePath,
  [Parameter(Mandatory = $true)][string]$InstallDir,
  [Parameter(Mandatory = $true)][string]$ExeName,
  [int]$WaitSeconds = 120
)

$ErrorActionPreference = 'Stop'
$log = Join-Path $env:TEMP 'nachtblau-lumina-update.log'

function Write-Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'o'), $Message
  Add-Content -LiteralPath $log -Value $line -Encoding UTF8
}

Write-Log "Start apply-update pid=$AppPid package=$PackagePath install=$InstallDir exe=$ExeName"

if (-not (Test-Path -LiteralPath $PackagePath)) {
  Write-Log "ERROR: package missing: $PackagePath"
  exit 2
}

$deadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $deadline) {
  $proc = Get-Process -Id $AppPid -ErrorAction SilentlyContinue
  if (-not $proc) { break }
  Start-Sleep -Milliseconds 400
}
Start-Sleep -Seconds 1
Write-Log 'Main process exited (or wait timed out)'

$exePath = Join-Path $InstallDir $ExeName
$staging = Join-Path $env:TEMP ('nachtblau-update-' + [guid]::NewGuid().ToString('N'))

try {
  $ext = [IO.Path]::GetExtension($PackagePath).ToLowerInvariant()

  if ($ext -eq '.exe') {
    # NSIS / Setup: silent install, then relaunch existing install dir.
    Write-Log "Running installer silently: $PackagePath"
    $p = Start-Process -FilePath $PackagePath -ArgumentList '/S' -Wait -PassThru
    Write-Log ("Installer exit code: {0}" -f $p.ExitCode)
    if ($p.ExitCode -ne 0 -and $null -ne $p.ExitCode) {
      # Non-zero: still try relaunch in case files were updated.
      Write-Log 'Installer reported non-zero; continuing to relaunch'
    }
  }
  elseif ($ext -eq '.zip') {
    New-Item -ItemType Directory -Path $staging -Force | Out-Null
    Write-Log "Extracting zip to $staging"
    Expand-Archive -LiteralPath $PackagePath -DestinationPath $staging -Force

    $root = $staging
    $children = @(Get-ChildItem -LiteralPath $staging -Force)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
      $root = $children[0].FullName
    }

    if (-not (Test-Path -LiteralPath $InstallDir)) {
      New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }

    Write-Log "Copying files from $root -> $InstallDir"
    # /IS /IT: include same/tweaked files so locked-then-free exe gets replaced.
    & robocopy.exe $root $InstallDir /E /IS /IT /R:3 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    $rc = $LASTEXITCODE
    # robocopy: 0-7 are success-ish
    if ($rc -ge 8) {
      Write-Log "ERROR: robocopy failed with code $rc"
      exit 3
    }
    Write-Log "robocopy ok (code $rc)"
  }
  else {
    Write-Log "ERROR: unsupported package type: $ext"
    exit 4
  }

  if (-not (Test-Path -LiteralPath $exePath)) {
    Write-Log "ERROR: exe missing after update: $exePath"
    exit 5
  }

  Write-Log "Relaunching $exePath"
  Start-Process -FilePath $exePath | Out-Null
  Write-Log 'Done'
  exit 0
}
catch {
  Write-Log ("ERROR: {0}" -f $_)
  exit 1
}
finally {
  if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
  }
}
