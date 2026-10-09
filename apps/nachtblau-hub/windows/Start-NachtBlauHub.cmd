@echo off
REM Startet den NachtBlau Hub (Electron). Working directory = dieses Verzeichnis.
cd /d "%~dp0"
pnpm start
if errorlevel 1 (
  echo.
  echo Hub-Start fehlgeschlagen. Zuerst Install-NachtBlauHub.cmd ausfuehren?
  pause
)
