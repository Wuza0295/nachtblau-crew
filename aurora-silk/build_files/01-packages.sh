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
  seahorse

# Globales Menü / Fenstersteuerung für Mac-ähnliches Layout
dnf5 -y install \
  plasma-workspace \
  kdeplasma-addons \
  || true

# Optional: Latte-Nachfolger / Dock-Hilfen falls verfügbar
dnf5 -y install plasma-nano 2>/dev/null || true
