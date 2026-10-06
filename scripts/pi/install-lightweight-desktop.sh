#!/usr/bin/env bash
# NachtBlau: leichtgewichtiger Desktop (XFCE) + apt-Update-Prüfung auf dem Raspberry Pi.
# Läuft auf dem Pi (nicht vom Cloud-Agent aus erreichbar). Idempotent. Erfordert Root.
set -euo pipefail

ASSUME_YES=0
FORCE=0
CHECK_ONLY=0
SKIP_DESKTOP=0
DO_UPGRADE=0
DO_DIST_UPGRADE=0

log() { printf '[pi-desktop] %s\n' "$*"; }
die() { printf '[pi-desktop] FEHLER: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Leichtgewichtiger Desktop (XFCE) und Paket-Updates auf Raspberry Pi OS

  --yes              Nicht nachfragen (Upgrade + Desktop installieren)
  --check-only       Nur apt update und anzeigen, was upgradbar wäre
  --upgrade          apt upgrade ausführen (ohne dist-upgrade)
  --dist-upgrade     zusätzlich apt full-upgrade (Vorsicht bei Kernel/Firmware)
  --skip-desktop     Keinen Desktop installieren (nur Update-Prüfung/-Upgrade)
  --force            Auch ohne erkanntes Raspberry-Pi-Board
  -h, --help         Diese Hilfe

Standard ohne Optionen: Update-Prüfung anzeigen, interaktiv fragen ob upgrade + Desktop.

Beispiel (empfohlen auf dem Pi):
  sudo ./scripts/pi/install-lightweight-desktop.sh --yes --upgrade

Gesamt-Upgrade (apt + git pull + Skripte aktuell):
  sudo ./scripts/pi/upgrade-all.sh --yes
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) ASSUME_YES=1 ;;
    --force) FORCE=1 ;;
    --check-only) CHECK_ONLY=1 ;;
    --skip-desktop) SKIP_DESKTOP=1 ;;
    --upgrade) DO_UPGRADE=1 ;;
    --dist-upgrade) DO_UPGRADE=1; DO_DIST_UPGRADE=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unbekannte Option: $1" ;;
  esac
  shift
done

[[ "$(id -u)" -eq 0 ]] || die "Bitte als root ausführen (sudo $0)."

is_pi() {
  local model=""
  if [[ -r /proc/device-tree/model ]]; then
    model="$(tr -d '\0' </proc/device-tree/model)"
  fi
  [[ "${model}" == *[Rr]aspberry* ]] && return 0
  grep -qi 'raspberry' /proc/cpuinfo 2>/dev/null
}

arch="$(uname -m)"
if ! is_pi && [[ "${FORCE}" -ne 1 ]]; then
  die "Kein Raspberry Pi erkannt (${arch}). Nutze --force nur zum Testen auf anderem Host."
fi

export DEBIAN_FRONTEND=noninteractive

report_upgradable() {
  local list count
  list="$(apt-get -s upgrade 2>/dev/null | awk '/^Inst / {print $2}' | sort -u || true)"
  count="$(printf '%s\n' "$list" | sed '/^$/d' | wc -l | tr -d ' ')"

  if [[ "${count}" -eq 0 ]]; then
    log "Keine Paket-Upgrades nötig (apt upgrade wäre leer)."
    return 1
  fi

  log "${count} Paket(e) können mit apt upgrade aktualisiert werden:"
  printf '%s\n' "$list" | sed 's/^/  - /'
  return 0
}

run_apt_update() {
  log "apt update …"
  apt-get update -qq
}

run_upgrade() {
  log "apt upgrade …"
  apt-get upgrade -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold
  if [[ "${DO_DIST_UPGRADE}" -eq 1 ]]; then
    log "apt full-upgrade (dist-upgrade) …"
    apt-get full-upgrade -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold
  fi
  apt-get autoremove -y || true
}

desktop_present() {
  dpkg -l lightdm 2>/dev/null | awk '$1=="ii" {found=1} END{exit !found}'
}

install_desktop() {
  if desktop_present; then
    log "Desktop-Umgebung (lightdm) ist bereits installiert – überspringe Paket-Installation."
    return 0
  fi

  log "Installiere leichtgewichtigen Desktop: XFCE + LightDM (ohne Empfehlungen) …"
  # Raspberry Pi OS Bookworm+: policykit-1 hat keinen Installationskandidaten mehr
  # (apt-cache show kann trotzdem noch Metadaten liefern → immer polkitd/pkexec).
  apt-get install -y --no-install-recommends \
    xserver-xorg \
    xserver-xorg-video-fbdev \
    xinit \
    lightdm \
    xfce4 \
    xfce4-terminal \
    polkitd \
    pkexec \
    dbus-x11

  log "Graphical Target aktivieren …"
  systemctl set-default graphical.target
  systemctl enable lightdm.service
  systemctl try-restart lightdm.service 2>/dev/null || true

  log "Fertig. Nach Reboot oder Anmeldung an der Konsole: Desktop sollte starten."
  log "Hinweis: XFCE braucht RAM/CPU – Minecraft-Server parallel kann spürbar werden."
}

confirm() {
  local prompt="$1"
  if [[ "${ASSUME_YES}" -eq 1 ]]; then
    return 0
  fi
  read -r -p "${prompt} [j/N] " answer
  [[ "${answer}" == [jJyY] ]]
}

run_apt_update

needs_upgrade=0
if report_upgradable; then
  needs_upgrade=1
fi

if [[ "${CHECK_ONLY}" -eq 1 ]]; then
  if [[ "${needs_upgrade}" -eq 1 ]]; then
    log "Empfehlung: sudo $0 --yes --upgrade"
    exit 2
  fi
  exit 0
fi

if [[ "${DO_UPGRADE}" -eq 1 ]]; then
  if [[ "${needs_upgrade}" -eq 1 ]] || [[ "${ASSUME_YES}" -eq 1 ]]; then
    run_upgrade
  else
    log "Kein Upgrade nötig – übersprungen."
  fi
elif [[ "${needs_upgrade}" -eq 1 ]]; then
  if confirm "Jetzt apt upgrade ausführen?"; then
    run_upgrade
  else
    log "Upgrade übersprungen (manuell: sudo apt upgrade)."
  fi
fi

if [[ "${SKIP_DESKTOP}" -eq 1 ]]; then
  log "Desktop-Installation übersprungen (--skip-desktop)."
  exit 0
fi

if desktop_present; then
  log "Desktop bereits vorhanden."
  exit 0
fi

if confirm "Leichtgewichtigen Desktop (XFCE) jetzt installieren?"; then
  install_desktop
else
  log "Desktop-Installation abgebrochen."
fi
