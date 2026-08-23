#!/usr/bin/env bash
set -euo pipefail

echo "=== NachtBlau Pi Status ==="
if [[ -f /var/lib/nachtblau/install.ok ]]; then
  echo "Install: OK ($(cat /var/lib/nachtblau/install.ok))"
elif [[ -f /var/lib/nachtblau/install.running ]]; then
  echo "Install: läuft seit $(cat /var/lib/nachtblau/install.running)"
elif [[ -f /var/lib/nachtblau/install.failed ]]; then
  echo "Install: FEHLGESCHLAGEN"
  cat /var/lib/nachtblau/install.failed
else
  echo "Install: noch nicht gestartet"
fi

echo
for svc in minecraft-java minecraft-bedrock minecraft-geyser nachtblau-install; do
  if systemctl list-unit-files "${svc}.service" >/dev/null 2>&1; then
    printf '%-24s %s\n' "$svc" "$(systemctl is-active "$svc" 2>/dev/null || echo missing)"
  fi
done

echo
echo "Ports:"
ss -lntup 2>/dev/null | grep -E ':25565|:19132|:19134' || netstat -lntu 2>/dev/null | grep -E ':25565|:19132|:19134' || echo "(keine Listener oder ss/netstat fehlt)"

if [[ -f /var/log/nachtblau-pi-install.log ]]; then
  echo
  echo "Letzte Install-Zeilen:"
  tail -n 20 /var/log/nachtblau-pi-install.log
fi
