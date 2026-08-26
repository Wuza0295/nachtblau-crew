#!/bin/bash
# AMD + Gaming: Mesa/RADV, GameMode, MangoHud, Kernel-/Sysctl-Tuning liegt in system_files

set -ouex pipefail

# Gaming-Runtime & Tools (RPM wo sinnvoll; Steam/Heroic bevorzugt als Flatpak via silk-setup)
dnf5 -y install \
  gamemode \
  mangohud \
  goverlay \
  vkBasalt \
  mesa-vulkan-drivers \
  mesa-dri-drivers \
  mesa-libGL \
  libva \
  libva-utils \
  vulkan-tools \
  gamescope \
  || true

# AMD Firmware / Sensorik
dnf5 -y install \
  amd-gpu-firmware \
  radeontop \
  || true

# Proton-Hilfen (CLI); eigentliche Proton-Builds kommen über Steam/ProtonUp Flatpak
dnf5 -y install wine-core wine-dxgi winetricks 2>/dev/null || \
  dnf5 -y install wine winetricks 2>/dev/null || true

# Empfohlene Flatpaks liegen in system_files/usr/share/silk/recommended-flatpaks.txt
# (Steam, Heroic, itch, Discord, OBS, Minecraft, osu!, … – Win/Mac-Äquivalente)

# AMD Kernel-Parameter Hinweis für bootc/rpm-ostree (Dokumentation + Helper)
cat >/usr/share/silk/kernel-args-amd.txt <<'EOF'
# Empfohlene Kernel-Args (als root, einmalig):
#   rpm-ostree kargs --append=amd_pstate=active
#   rpm-ostree kargs --append=amdgpu.ppfeaturemask=0xffffffff
# Silk setzt sinnvolle Sysctl/Udev-Defaults; Kargs bleiben user-gesteuert.
EOF

echo "AMD/Gaming packages staged."
