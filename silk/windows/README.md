# Silk VM unter Windows
#
# Doppelklick oder PowerShell (Admin empfohlen für Hyper-V):
#
#   windows\Install-SilkVM.cmd
#   powershell -ExecutionPolicy Bypass -File windows\Install-SilkVM.ps1
#
# Optionen:
#   -Backend Auto|HyperV|VirtualBox
#   -Mode Installer|Ready   (ISO-Installer vs. fertige QCOW/VHDX-Disk)
#   -Start                  VM nach dem Anlegen starten (Standard: an)
#   -NoStart
#   -MemMB 4096 -Cpus 2 -DiskGB 50
#
# Voraussetzungen:
#   • VirtualBox ODER Hyper-V (Windows Pro/Education/Enterprise)
#   • ~8 GB freier Speicher für Download
#   • Internet (lädt Release silk-media-latest)
