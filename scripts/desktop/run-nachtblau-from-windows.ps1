# NachtBlau Minecraft-Sync für Windows (PowerShell, als Administrator ausführen).
# Gleicher Stand wie Pi und Bazzite: Java (Paper) :25565/TCP, Bedrock Dedicated :19132/UDP,
# Geyser+Floodgate als Paper-Plugin :19134/UDP. Idempotent.
#
# Start in einer PowerShell mit Admin-Rechten:
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\run-nachtblau-from-windows.ps1 -Yes
#
# Schalter: -Yes (EULA akzeptieren), -NoStart (Dienste nicht starten),
#           -SkipBedrock (nur Java + Geyser), -Force (Warnungen ignorieren).
param(
  [switch]$Yes,
  [switch]$NoStart,
  [switch]$SkipBedrock,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$JavaDir    = "C:\NachtBlau\java"
$BedrockDir = "C:\NachtBlau\bedrock"
$JavaPort = 25565
$BedrockPort = 19132
$GeyserPort = 19134
$FillApi = "https://fill.papermc.io/v3"
$GeyserSpigotUrl = "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot"
$FloodgateUrl = "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot"
$BedrockLinksApi = "https://net-secondary.web.minecraft-services.net/api/v1.0/download/links"
$BrowserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

function Write-Info($msg) { Write-Host "[nachtblau] $msg" }

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin -and -not $Force) {
  throw "Bitte als Administrator ausführen (Rechtsklick -> Als Administrator starten). Oder -Force verwenden."
}

if (-not $Yes) {
  Write-Host "Mit dem Sync akzeptierst du die Minecraft-EULA: https://aka.ms/MinecraftEULA"
  Write-Host "Es werden Paper (Java), Geyser/Floodgate und (optional) Bedrock Dedicated eingerichtet."
  $answer = Read-Host "Fortfahren? [j/N]"
  if ($answer -notmatch '^[jJyY]') { throw "Abgebrochen." }
}

# Java 21+ prüfen (Temurin, Microsoft oder Oracle).
$javaOk = $false
try {
  $ver = (& java -version 2>&1 | Out-String)
  if ($ver -match 'version "(2[1-9]|[3-9][0-9])') { $javaOk = $true; Write-Info "Java ist vorhanden: $($ver.Split("`n")[0])" }
  else { Write-Info "Gefundene Java-Version ist zu alt, bitte Java 21+ installieren." }
} catch { Write-Info "Kein Java gefunden." }
if (-not $javaOk) {
  Write-Info "Installiere Microsoft OpenJDK 21 per winget …"
  try {
    winget install --silent --accept-package-agreements --accept-source-agreements Microsoft.OpenJDK.21
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + $env:Path
  } catch {
    throw "Java 21+ wird benötigt. Bitte manuell installieren (z. B. winget install Microsoft.OpenJDK.21) und das Skript erneut starten."
  }
}

New-Item -ItemType Directory -Force -Path $JavaDir, "$JavaDir\plugins", $BedrockDir | Out-Null

# Paper auflösen (STABLE bevorzugt, sonst neuester Build).
Write-Info "Paper (Fill v3) auflösen …"
$projects = Invoke-RestMethod -Uri "$FillApi/projects/paper" -Headers @{ "User-Agent" = $BrowserUA }
$version = $null
foreach ($group in @("26.2", "1.21")) {
  if ($projects.versions.$group) { $version = $projects.versions.$group[0]; break }
}
if (-not $version) { throw "Keine Paper-Version von fill.papermc.io." }
$builds = Invoke-RestMethod -Uri "$FillApi/projects/paper/versions/$version/builds" -Headers @{ "User-Agent" = $BrowserUA }
$stable = @($builds | Where-Object { $_.channel -eq "STABLE" })
$chosen = if ($stable.Count -gt 0) { $stable[0] } else { $builds[0] }
$paperUrl = $chosen.downloads."server:default".url
if (-not $paperUrl) { throw "Keine Paper-Download-URL für $version." }
Write-Info "Paper $version …"
Invoke-WebRequest -Uri $paperUrl -OutFile "$JavaDir\paper.jar" -Headers @{ "User-Agent" = $BrowserUA }

# Geyser + Floodgate (Paper-Plugins).
Write-Info "Geyser/Floodgate laden …"
Invoke-WebRequest -Uri $GeyserSpigotUrl -OutFile "$JavaDir\plugins\Geyser-Spigot.jar"
Invoke-WebRequest -Uri $FloodgateUrl -OutFile "$JavaDir\plugins\Floodgate-Spigot.jar"

# Java-Konfiguration (identisch zu Pi/Bazzite: MOTD NachtBlau, Ports 25565/19134).
"eula=true`n" | Out-File -FilePath "$JavaDir\eula.txt" -Encoding ascii -NoNewline
@"
motd=NachtBlau
server-port=$JavaPort
online-mode=true
enforce-secure-profile=true
view-distance=6
simulation-distance=4
max-players=10
difficulty=normal
spawn-protection=16
network-compression-threshold=256
sync-chunk-writes=false
white-list=false
enable-rcon=false
enable-status=true
hide-online-players=false
"@ | Out-File -FilePath "$JavaDir\server.properties" -Encoding ascii

New-Item -ItemType Directory -Force -Path "$JavaDir\plugins\Geyser-Spigot" | Out-Null
@"
bedrock:
  address: 0.0.0.0
  port: $GeyserPort
  clone-remote-port: false
  motd1: NachtBlau
  motd2: Crossplay Java + Bedrock
remote:
  address: 127.0.0.1
  port: $JavaPort
  auth-type: floodgate
passthrough-motd: true
passthrough-player-counts: true
max-players: 10
debug-mode: false
"@ | Out-File -FilePath "$JavaDir\plugins\Geyser-Spigot\config.yml" -Encoding ascii

@"
@echo off
cd /d "$JavaDir"
java -Xms1G -Xmx3G -XX:+UseG1GC -jar paper.jar nogui
"@ | Out-File -FilePath "$JavaDir\Start-Java.cmd" -Encoding ascii

if (-not $SkipBedrock) {
  # Bedrock Dedicated (offizielle Windows-Builds, nativ ohne Emulation).
  Write-Info "Bedrock Dedicated Server (Windows, nativ) …"
  $links = Invoke-RestMethod -Uri $BedrockLinksApi -Headers @{ "User-Agent" = $BrowserUA }
  $bedrockUrl = ($links.result.links | Where-Object { $_.downloadType -eq "serverBedrockWindows" }).downloadUrl | Select-Object -First 1
  if (-not $bedrockUrl) { throw "Keine Bedrock-Windows-URL von Minecraft Services." }
  $zip = "$env:TEMP\bedrock-server.zip"
  Invoke-WebRequest -Uri $bedrockUrl -OutFile $zip -Headers @{ "User-Agent" = $BrowserUA }
  Expand-Archive -Path $zip -DestinationPath $BedrockDir -Force
  Remove-Item $zip -Force

  $props = Join-Path $BedrockDir "server.properties"
  if (Test-Path $props) {
    (Get-Content $props) `
      -replace '^server-name=.*', 'server-name=NachtBlau' `
      -replace '^server-port=.*', "server-port=$BedrockPort" `
      -replace '^max-players=.*', 'max-players=10' `
      -replace '^online-mode=.*', 'online-mode=true' |
      Set-Content $props -Encoding ascii
  } else {
    @"
server-name=NachtBlau
server-port=$BedrockPort
max-players=10
online-mode=true
gamemode=survival
difficulty=normal
allow-cheats=false
"@ | Out-File -FilePath $props -Encoding ascii
  }

  @"
@echo off
cd /d "$BedrockDir"
bedrock_server.exe
"@ | Out-File -FilePath "$BedrockDir\Start-Bedrock.cmd" -Encoding ascii
}

# Firewall-Regeln (idempotent).
Write-Info "Firewall-Regeln prüfen …"
foreach ($rule in @(
  @{ Name = "NachtBlau Java 25565/TCP"; Port = $JavaPort; Protocol = "TCP" },
  @{ Name = "NachtBlau Bedrock 19132/UDP"; Port = $BedrockPort; Protocol = "UDP" },
  @{ Name = "NachtBlau Geyser 19134/UDP"; Port = $GeyserPort; Protocol = "UDP" }
)) {
  if ($rule.Name -like "*Bedrock*" -and $SkipBedrock) { continue }
  if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Action Allow `
      -Protocol $rule.Protocol -LocalPort $rule.Port | Out-Null
    Write-Info "Firewall-Regel angelegt: $($rule.Name)"
  } else {
    Write-Info "Firewall-Regel vorhanden: $($rule.Name)"
  }
}

if (-not $NoStart) {
  Write-Info "Server starten …"
  Start-Process -FilePath "$JavaDir\Start-Java.cmd" -WorkingDirectory $JavaDir
  if (-not $SkipBedrock) {
    Start-Process -FilePath "$BedrockDir\Start-Bedrock.cmd" -WorkingDirectory $BedrockDir
  }
  Write-Info "Gestartet. Java-Konsole und Bedrock-Konsole laufen in eigenen Fenstern."
} else {
  Write-Info "Start übersprungen (-NoStart)."
}

Write-Info "Fertig (Windows-Sync)."
Write-Info "  Java:    $JavaDir  Port $JavaPort/TCP  (Start: Start-Java.cmd)"
if (-not $SkipBedrock) {
  Write-Info "  Bedrock: $BedrockDir  Port $BedrockPort/UDP  (Start: Start-Bedrock.cmd)"
}
Write-Info "  Geyser:  Plugin in Paper, Port $GeyserPort/UDP"
Write-Info "Ops/Allowlist später in: $JavaDir\ops.json, whitelist.json bzw. $BedrockDir\permissions.json, allowlist.json"
