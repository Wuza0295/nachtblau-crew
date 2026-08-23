#!/usr/bin/env bash
# Läuft beim ersten Boot (von der Bootpartition) und startet das Nacht-Install.
set -euo pipefail

BOOT_CANDIDATES=(/boot/firmware /boot)
SRC=""
for boot in "${BOOT_CANDIDATES[@]}"; do
  if [[ -d "$boot/nachtblau-install" ]]; then
    SRC="$boot/nachtblau-install"
    break
  fi
done

if [[ -z "$SRC" ]]; then
  echo "[nachtblau] firstboot: kein nachtblau-install auf der Bootpartition gefunden" >&2
  exit 0
fi

mkdir -p /opt /var/log /var/lib/nachtblau
rm -rf /opt/nachtblau-install
cp -a "$SRC" /opt/nachtblau-install
chmod +x /opt/nachtblau-install/*.sh || true

install -m 0644 /opt/nachtblau-install/systemd/nachtblau-install.service /etc/systemd/system/nachtblau-install.service
touch /var/log/nachtblau-pi-install.log
systemctl daemon-reload
systemctl enable nachtblau-install.service
systemctl start --no-block nachtblau-install.service || true

echo "[nachtblau] firstboot: Nacht-Install gestartet (siehe /var/log/nachtblau-pi-install.log)"
