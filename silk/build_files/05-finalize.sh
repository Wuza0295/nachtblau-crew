#!/bin/bash
set -ouex pipefail

chmod 755 /usr/bin/silk-* 2>/dev/null || true
chmod 755 /usr/libexec/silk/* 2>/dev/null || true
systemctl enable silk-firstboot.service 2>/dev/null || true

# Podman socket für Distrobox/Dev
systemctl enable podman.socket 2>/dev/null || true

# Leichtgewicht: unnötige Dienste nicht erzwingen.
# Aurora nutzt tuned-ppd statt power-profiles-daemon.
systemctl enable tuned-ppd.service 2>/dev/null || \
  systemctl enable power-profiles-daemon.service 2>/dev/null || true

# --- Produktidentität: Silk (nicht Aurora/Fedora in der UI) ---
# ID/VERSION_ID bleiben kompatibel zur Atomic-Basis; sichtbarer Name = Silk.
brand_os_release() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  sed -i \
    -e 's/^NAME=.*/NAME="Silk"/' \
    -e 's/^PRETTY_NAME=.*/PRETTY_NAME="Silk"/' \
    -e 's/^VARIANT=.*/VARIANT="Silk"/' \
    -e 's/^VARIANT_ID=.*/VARIANT_ID=silk/' \
    -e 's/^ID_LIKE=.*/ID_LIKE="fedora"/' \
    "$f" || true
  if ! grep -q '^HOME_URL=' "$f"; then
    echo 'HOME_URL="https://github.com/Wuza0295/nachtblau-crew"' >> "$f"
  fi
  if grep -q '^HOME_URL=' "$f"; then
    sed -i 's|^HOME_URL=.*|HOME_URL="https://github.com/Wuza0295/nachtblau-crew"|' "$f" || true
  fi
  # DOCUMENTATION_URL / SUPPORT_URL auf Silk-Docs
  sed -i \
    -e 's|^DOCUMENTATION_URL=.*|DOCUMENTATION_URL="https://github.com/Wuza0295/nachtblau-crew/blob/main/silk/QUICKSTART.md"|' \
    -e 's|^SUPPORT_URL=.*|SUPPORT_URL="https://github.com/Wuza0295/nachtblau-crew/issues"|' \
    "$f" 2>/dev/null || true
}

brand_os_release /usr/lib/os-release
brand_os_release /etc/os-release
# Manche Images spiegeln nach /usr/share/ublue-os/
if [[ -f /usr/share/ublue-os/image-info.json ]]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY' || true
import json, pathlib
p = pathlib.Path("/usr/share/ublue-os/image-info.json")
data = json.loads(p.read_text())
data["image-name"] = "silk"
data["image-vendor"] = "wuza0295"
data["name"] = "Silk"
p.write_text(json.dumps(data, indent=2) + "\n")
PY
  fi
fi

# Cache aufräumen
dnf5 clean all
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

echo "Finalize done (Silk identity)."
