#!/usr/bin/env bash
# Kopiert das Nacht-Install auf ein geflashtes Raspberry-Pi-OS (bootfs + optional rootfs).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOT=""
ROOT=""

usage() {
  cat <<'EOF'
prepare-boot.sh --boot /mnt/bootfs [--root /mnt/rootfs]

Nach dem Flashen von Raspberry Pi OS Lite (64-bit) beide Partitionen mounten
und dieses Skript als root ausführen. Es legt das Nacht-Install so, dass es
beim ersten Boot mit Netz automatisch startet.

Beispiel:
  sudo ./prepare-boot.sh --boot /media/$USER/bootfs --root /media/$USER/rootfs
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --boot) BOOT="${2:-}"; shift 2 ;;
    --root) ROOT="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unbekanntes Argument: $1" >&2; usage; exit 1 ;;
  esac
done

[[ -n "$BOOT" && -d "$BOOT" ]] || { usage; exit 1; }
[[ -f "$BOOT/cmdline.txt" || -f "$BOOT/config.txt" ]] || {
  echo "Kein Pi-Boot-Dateisystem unter $BOOT (cmdline.txt/config.txt fehlen)." >&2
  exit 1
}

echo "[nachtblau] Kopiere Installer nach $BOOT/nachtblau-install"
rm -rf "$BOOT/nachtblau-install"
mkdir -p "$BOOT/nachtblau-install"
cp -a "$SCRIPT_DIR/." "$BOOT/nachtblau-install/"
# Cache und Git-Müll nicht auf den Stick
rm -rf "$BOOT/nachtblau-install/.cache" "$BOOT/nachtblau-install/.git"
chmod +x "$BOOT/nachtblau-install/"*.sh
install -m 0755 "$SCRIPT_DIR/firstboot.sh" "$BOOT/nachtblau-firstboot.sh"
touch "$BOOT/ssh"

inject_firstrun() {
  local firstrun="$1"
  local hook='if [ -x /boot/firmware/nachtblau-firstboot.sh ]; then /boot/firmware/nachtblau-firstboot.sh; elif [ -x /boot/nachtblau-firstboot.sh ]; then /boot/nachtblau-firstboot.sh; fi'
  if [[ -f "$firstrun" ]]; then
    if grep -q 'nachtblau-firstboot' "$firstrun"; then
      echo "[nachtblau] firstrun.sh enthält den Hook schon"
      return
    fi
    local tmp
    tmp="$(mktemp)"
    if grep -q 'rm -f /boot/.*/firstrun.sh\|sed -i .*systemd.run' "$firstrun"; then
      awk -v hook="$hook" '
        /rm -f \/boot.*firstrun\.sh/ && !done { print hook; done=1 }
        { print }
        END { if (!done) print hook }
      ' "$firstrun" >"$tmp"
    else
      printf '%s\n%s\n' "$(cat "$firstrun")" "$hook" >"$tmp"
    fi
    cat "$tmp" >"$firstrun"
    rm -f "$tmp"
    echo "[nachtblau] Hook in bestehende firstrun.sh eingefügt"
  else
    cat >"$firstrun" <<EOF
#!/bin/bash
set +e
$hook
EOF
    chmod +x "$firstrun"
    echo "[nachtblau] Neue firstrun.sh geschrieben – cmdline.txt prüfen"
  fi
}

if [[ -f "$BOOT/firstrun.sh" ]]; then
  inject_firstrun "$BOOT/firstrun.sh"
else
  inject_firstrun "$BOOT/firstrun.sh"
  if [[ -f "$BOOT/cmdline.txt" ]] && ! grep -q 'nachtblau-firstboot\|systemd.run=/boot' "$BOOT/cmdline.txt"; then
    # Nur ergänzen, wenn Imager noch keinen systemd.run-Hook gesetzt hat.
    # Eigene cmdline-Änderung ist riskant; rootfs-Unit ist der bevorzugte Weg.
    echo "[nachtblau] Kein Imager-firstrun in cmdline.txt – bitte --root mitgeben oder Imager-OS-Anpassung nutzen."
  fi
fi

if [[ -n "$ROOT" ]]; then
  [[ -d "$ROOT" ]] || { echo "rootfs $ROOT nicht gefunden" >&2; exit 1; }
  echo "[nachtblau] Installiere systemd-Unit in $ROOT"
  mkdir -p "$ROOT/opt" "$ROOT/etc/systemd/system" "$ROOT/var/lib/nachtblau" "$ROOT/var/log"
  rm -rf "$ROOT/opt/nachtblau-install"
  cp -a "$SCRIPT_DIR/." "$ROOT/opt/nachtblau-install/"
  rm -rf "$ROOT/opt/nachtblau-install/.cache"
  chmod +x "$ROOT/opt/nachtblau-install/"*.sh
  install -m 0644 "$SCRIPT_DIR/systemd/nachtblau-install.service" "$ROOT/etc/systemd/system/nachtblau-install.service"
  mkdir -p "$ROOT/etc/systemd/system/multi-user.target.wants"
  ln -sfn /etc/systemd/system/nachtblau-install.service \
    "$ROOT/etc/systemd/system/multi-user.target.wants/nachtblau-install.service"
  touch "$ROOT/var/log/nachtblau-pi-install.log"
  echo "[nachtblau] rootfs vorbereitet – das Nacht-Install startet nach dem ersten Netz-Boot."
else
  echo "[nachtblau] Nur bootfs: firstboot kopiert den Installer beim Start."
fi

echo
echo "Fertig. Stick/SSD auswerfen, in den BLAUEN USB-3-Port des Pi 4, Ethernet + Netzteil."
echo "Über Nacht laufen lassen. Morgens auf dem Pi:"
echo "  sudo /opt/nachtblau-install/status.sh"
