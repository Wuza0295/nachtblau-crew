@echo off
REM Silk VM unter Windows – Doppelklick zum Start
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo  Silk VM Setup fuer Windows
echo  ==========================
echo.
echo  Voraussetzung: VirtualBox  ODER  Hyper-V (Win Pro, Admin)
echo  Download ca. 6 GB nach %%USERPROFILE%%\Silk-VMs
echo.
echo  1^) VirtualBox (kein Admin noetig, empfohlen fuer Home)
echo  2^) Hyper-V    (Admin, Windows Pro)
echo  3^) Auto       (Hyper-V wenn Admin+Feature, sonst VirtualBox)
echo.
set /p BACKEND=Wahl [1/2/3, Enter=1]: 
if "%BACKEND%"=="2" (
  set BE=HyperV
) else if "%BACKEND%"=="3" (
  set BE=Auto
) else (
  set BE=VirtualBox
)

echo.
echo  A^) Installer-ISO ^(empfohlen^)
echo  B^) Fertige Disk ^(Ready – braucht qemu-img^)
echo.
set /p MODE=Wahl [A/B, Enter=A]: 
if /I "%MODE%"=="B" (
  set MD=Ready
) else (
  set MD=Installer
)

REM Hyper-V braucht Admin
if /I "%BE%"=="HyperV" (
  net session >nul 2>&1
  if errorlevel 1 (
    echo Starte mit Administrator-Rechten fuer Hyper-V ...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
  )
)

echo.
echo Starte: Backend=%BE% Mode=%MD%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-SilkVM.ps1" -Mode %MD% -Backend %BE%
set ERR=%ERRORLEVEL%
echo.
if %ERR% neq 0 (
  echo Fehlercode %ERR% – siehe Meldung oben.
  echo Hilfe: silk\docs\VM-WINDOWS.md
)
pause
exit /b %ERR%
