#!/bin/bash
set -ouex pipefail

chmod 755 /usr/bin/silk-* 2>/dev/null || true
chmod 755 /usr/libexec/silk/* 2>/dev/null || true
systemctl enable silk-firstboot.service 2>/dev/null || true

# Leichtgewicht: unnötige Dienste nicht erzwingen.
systemctl enable tuned-ppd.service 2>/dev/null || \
  systemctl enable power-profiles-daemon.service 2>/dev/null || true

# Podman-Socket erst bei Bedarf (silk-ensure-boxes), nicht global offen
systemctl disable podman.socket 2>/dev/null || true

# Produktidentität: überall „Silk“, nicht Aurora/Fedora als Produktname
/usr/libexec/silk/brand-os-release

# Cache aufräumen
dnf5 clean all
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

echo "Finalize done (Silk identity)."
