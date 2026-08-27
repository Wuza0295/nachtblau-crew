#!/bin/bash
# Gaming: Mesa/Vulkan, GameMode, MangoHud + GPU-spezifische Firmware/Tools (AMD/Intel/NVIDIA)

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
  libva \
  libva-utils \
  vulkan-tools \
  gamescope \
  || true

# AMD – Firmware & Monitoring
dnf5 -y install \
  amd-gpu-firmware \
  radeontop \
  || true

# Intel – iGPU/Arc Firmware, VAAPI, Diagnose
dnf5 -y install \
  intel-gpu-firmware \
  intel-media-driver \
  intel-gpu-tools \
  || true

# NVIDIA – Firmware-Hints (Treiber kommen aus aurora-nvidia-open Base-Image)
if [[ "${IS_ASAHI:-0}" != "1" ]]; then
  dnf5 -y install \
    nvidia-gpu-firmware \
    || true
fi

# Proton-Hilfen (CLI); Proton-Builds über Steam/ProtonUp Flatpak
# Auf Asahi/aarch64 oft nicht sinnvoll – optional belassen.
if [[ "${IS_ASAHI:-0}" != "1" && "${IS_AARCH64:-0}" != "1" ]]; then
  dnf5 -y install wine-core wine-dxgi winetricks 2>/dev/null || \
    dnf5 -y install wine winetricks 2>/dev/null || true
else
  echo "Asahi/aarch64: Wine/Proton-Pakete übersprungen (optional später)."
fi

# Empfohlene Flatpaks: system_files/usr/share/silk/recommended-flatpaks.txt

echo "Gaming + AMD/Intel/NVIDIA packages staged (asahi=${IS_ASAHI:-0})."
