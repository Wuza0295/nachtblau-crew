@echo off
REM Doppelklick-Wrapper: startet Install-NachtBlauHub.ps1 (ExecutionPolicy Bypass)
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-NachtBlauHub.ps1" %*
set "ERR=%ERRORLEVEL%"
echo.
if not "%ERR%"=="0" (
  echo Install fehlgeschlagen ^(Exit %ERR%^). Fenster offen lassen zum Lesen.
  pause
  exit /b %ERR%
)
REM Bei Doppelklick: Pfade der Shortcuts sichtbar lassen
echo Fenster mit einer Taste schliessen …
pause >nul
endlocal
