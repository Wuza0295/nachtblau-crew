#!/bin/bash
# Windows (.exe) & Android (.apk) Kompatibilitätsschicht

set -ouex pipefail

# Auf Apple Silicon / aarch64: Wine/Waydroid oft unbrauchbar oder kaputt → skip
if [[ "${IS_ASAHI:-0}" == "1" || "${IS_AARCH64:-0}" == "1" ]]; then
  echo "Asahi/aarch64: Wine/Waydroid-Compat übersprungen."
  update-desktop-database /usr/share/applications 2>/dev/null || true
  update-mime-database /usr/share/mime 2>/dev/null || true
  echo "Compat layer ready (asahi-lite)."
  exit 0
fi

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

# Waydroid Service vorbereiten (nicht auto-starten bis User will)
systemctl disable waydroid-container.service 2>/dev/null || true

echo "Compat layer ready."
