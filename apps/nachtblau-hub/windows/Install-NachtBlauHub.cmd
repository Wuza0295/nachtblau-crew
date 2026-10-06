@echo off
REM Doppelklick-Wrapper: startet Install-NachtBlauHub.ps1
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-NachtBlauHub.ps1" %*
endlocal
