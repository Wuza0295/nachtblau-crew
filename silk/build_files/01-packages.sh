#!/bin/bash
# Basispakete: leicht, nützlich, ohne Desktop-Bloat

set -ouex pipefail

dnf5 -y install \
  git \
  curl \
  wget \
  jq \
  unzip \
  rsync \
  fuse \
  fuse-overlayfs \
  distrobox \
  podman-compose \
  zstd \
  htop \
  btop \
  lm_sensors \
  power-profiles-daemon \
  plasma-browser-integration \
  kde-cli-tools \
  kdialog \
  qt6-qttools \
  xdg-utils \
  desktop-file-utils \
  shared-mime-info \
  flatpak \
  gnome-keyring \
  seahorse \
  p7zip \
  p7zip-plugins \
  ntfs-3g \
  exfatprogs \
  fuse-exfat \
  udisks2 \
  samba-client \
  cifs-utils \
  cups \
  cups-filters \
  system-config-printer \
  liberation-fonts-all \
  google-noto-sans-fonts \
  google-noto-serif-fonts \
  google-noto-emoji-fonts \
  google-noto-sans-mono-fonts \
  dejavu-sans-fonts \
  zip \
  file-roller \
  ark \
  spectacle \
  gwenview \
  okular \
  kate \
  kcalc \
  dolphin \
  fuse3 \
  fuse \
  squashfs-tools \
  xdg-desktop-portal \
  xdg-desktop-portal-kde

# libfuse2 oft für ältere AppImages (Name je nach Fedora-Release)
dnf5 -y install fuse-libs 2>/dev/null || true
dnf5 -y install libfuse2 2>/dev/null || true

# Microsoft Core Fonts (Liberation deckt viel ab; mscorefonts optional via RPM Fusion)
dnf5 -y install curl cabextract 2>/dev/null || true
dnf5 -y install mscore-fonts 2>/dev/null || \
  dnf5 -y install msttcore-fonts-installer 2>/dev/null || true

# Globales Menü / Fenstersteuerung für Mac-ähnliches Layout
dnf5 -y install \
  plasma-workspace \
  kdeplasma-addons \
  || true

# Optional: Latte-Nachfolger / Dock-Hilfen falls verfügbar
dnf5 -y install plasma-nano 2>/dev/null || true
