#!/bin/bash
# Windows (.exe) & Android (.apk) Kompatibilitätsschicht

set -ouex pipefail

# Wine / Winetricks (Fallback wenn 03 schon installiert hat)
dnf5 -y install wine winetricks cabextract 2>/dev/null || true

# Waydroid (Android-Container) – COPR
if ! rpm -q waydroid &>/dev/null; then
  dnf5 -y copr enable aleasto/waydroid 2>/dev/null || \
    dnf5 -y copr enable mywaydroid/waydroid 2>/dev/null || true
  dnf5 -y install waydroid binder-linux 2>/dev/null || \
    dnf5 -y install waydroid 2>/dev/null || \
    echo "WARN: waydroid nicht aus Repos installierbar – silk-run-apk nutzt Flatpak-Fallback."
  dnf5 -y copr disable aleasto/waydroid 2>/dev/null || true
  dnf5 -y copr disable mywaydroid/waydroid 2>/dev/null || true
fi

# Desktop-Integration: MIME + Handler bereits in system_files
update-desktop-database /usr/share/applications 2>/dev/null || true
update-mime-database /usr/share/mime 2>/dev/null || true

dnf5 -y install \
  kdeconnectd \
  qrencode \
  2>/dev/null || true

echo "Compat layer ready."
