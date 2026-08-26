#!/bin/bash
set -ouex pipefail

chmod 755 /usr/bin/silk-* 2>/dev/null || true
chmod 755 /usr/libexec/silk/* 2>/dev/null || true
systemctl enable silk-firstboot.service 2>/dev/null || true

# Podman socket für Distrobox/Dev
systemctl enable podman.socket 2>/dev/null || true

# Leichtgewicht: unnötige Dienste nicht erzwingen; power-profiles an
systemctl enable power-profiles-daemon.service 2>/dev/null || true

# Cache aufräumen
dnf5 clean all
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

echo "Finalize done."
