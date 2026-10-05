# NachtBlau: Desktop + Updates auf dem Pi vom Windows-PC (Heimnetz).
# Voraussetzung: OpenSSH Client (Windows 10+), Pi erreichbar unter $PiHost.

$ErrorActionPreference = "Stop"
$PiHost = "192.168.178.33"
$PiUser = "administrator"
$Branch = "cursor/pi-lightweight-desktop-3ddb"
$RepoUrl = "https://github.com/Wuza0295/nachtblau-crew.git"

Write-Host "Verbinde zu ${PiUser}@${PiHost} ..."
Write-Host "Passwort eingeben wenn gefragt (Imager-Passwort)."

$Remote = @"
cd ~
if [ -d nachtblau-crew/.git ]; then
  cd nachtblau-crew
  git fetch origin $Branch
  git checkout $Branch
  git pull
else
  git clone -b $Branch $RepoUrl nachtblau-crew
  cd nachtblau-crew
fi
chmod +x scripts/pi/install-lightweight-desktop.sh
sudo ./scripts/pi/install-lightweight-desktop.sh --yes --upgrade
"@

ssh "${PiUser}@${PiHost}" "bash -lc $(($Remote -replace "`r`n", "; " -replace '"', '\"'))"

Write-Host ""
Write-Host "Fertig. Bei Bedarf auf dem Pi: sudo reboot"
