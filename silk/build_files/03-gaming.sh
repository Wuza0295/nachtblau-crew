#!/bin/bash
# Gaming: Mesa/Vulkan, GameMode, MangoHud + GPU + Controller (AMD/Intel/NVIDIA)

set -ouex pipefail

# Gemeinsame Gaming-Runtime (alle GPUs)
dnf5 -y install \
  gamemode \
  mangohud \
  goverlay \
  vkBasalt \
  mesa-vulkan-drivers \
  mesa-dri-drivers \
  mesa-libGL \
  mesa-libEGL \
  mesa-libgbm \
  libva \
  libva-utils \
  vulkan-tools \
  gamescope \
  || true

# 32-Bit OpenGL/Vulkan für Steam/Proton (wichtig)
dnf5 -y install \
  mesa-vulkan-drivers.i686 \
  mesa-libGL.i686 \
  mesa-dri-drivers.i686 \
  2>/dev/null || true

# AMD – Firmware, RADV, Monitoring, VAAPI
dnf5 -y install \
  amd-gpu-firmware \
  radeontop \
  libva-mesa-driver \
  mesa-va-drivers \
  mesa-vdpau-drivers \
  || true

# AMDVLK optional (zusätzlich zu RADV)
dnf5 -y install amdvlk 2>/dev/null || true

# Intel – iGPU/Arc Firmware, VAAPI, Diagnose
dnf5 -y install \
  intel-gpu-firmware \
  intel-media-driver \
  intel-gpu-tools \
  libva-intel-media-driver \
  || true

# NVIDIA – Firmware; Treiber kommen aus Upstream-Image (nvidia / nvidia-open)
dnf5 -y install \
  nvidia-gpu-firmware \
  || true
# Userspace-Helfer falls im Repo (auf nvidia-Images oft schon vorhanden)
dnf5 -y install \
  nvidia-settings \
  nvidia-vaapi-driver \
  2>/dev/null || true

# Proton / Wine-Hilfen
dnf5 -y install wine-core wine-dxgi winetricks 2>/dev/null || \
  dnf5 -y install wine winetricks 2>/dev/null || true

# Controller / Gamepads – Steam + generische HID
dnf5 -y install \
  steam-devices \
  joystick \
  jstest-gtk \
  kernel-modules-extra \
  2>/dev/null || true

# game-devices-udev (falls paketiert) – breitere Controller-Abdeckung
dnf5 -y install game-devices-udev 2>/dev/null || true

# Bluetooth-Gamepads (DualSense/Xbox Wireless oft darüber)
dnf5 -y install \
  bluez \
  bluez-tools \
  2>/dev/null || true

echo "Gaming + AMD/Intel/NVIDIA + Controller packages staged."
