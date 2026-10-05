@echo off
REM Silk VM unter Windows – Doppelklick zum Start
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Starte mit Administrator-Rechten (fuer Hyper-V) ...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo  Silk VM Setup
echo  =============
echo  1^) Installer-ISO ^(empfohlen, Hyper-V oder VirtualBox^)
echo  2^) Fertige Disk ^(Ready, braucht qemu-img fuer Konvertierung^)
echo.
set /p CHOICE=Wahl [1/2, Enter=1]: 
if "%CHOICE%"=="2" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-SilkVM.ps1" -Mode Ready -Backend Auto
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-SilkVM.ps1" -Mode Installer -Backend Auto
)

echo.
pause
