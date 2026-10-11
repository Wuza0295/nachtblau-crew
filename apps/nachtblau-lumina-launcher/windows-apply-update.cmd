@echo off
REM Wrapper: startet das PowerShell-Apply-Update-Skript (detached-freundlich).
setlocal
set "SCRIPT=%~dp0windows-apply-update.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT%" %*
exit /b %ERRORLEVEL%
