#!/usr/bin/env bash
# NachtBlau Pi: idempotentes Gesamt-Upgrade (apt + Repo-Branch + Desktop-Skript).
# Läuft NUR auf dem Raspberry Pi (per SSH oder lokal am Pi).
# NICHT auf Bazzite / Windows / Notebook — dort fehlt das Skript oft und apt/Pi-Pfade passen nicht.
# Auf Bazzite zum Spielen: apps/nachtblau-hub/linux/Install-SteamShortcut.sh (Steam, kein Proton).
# Cloud-Agent hat keinen SSH. Erfordert Root.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DESKTOP_SCRIPT="${SCRIPT_DIR}/install-lightweight-desktop.sh"

BRANCH="${NACHT_BRANCH:-cursor/pi-lightweight-desktop-3ddb}"
ASSUME_YES=0
CHECK_ONLY=0
SKIP_GIT=0
WITH_DESKTOP=0
DIST_UPGRADE=0
FORCE_HOST=0

log() { printf '[pi-upgrade] %s\n' "$*"; }
die() { printf '[pi-upgrade] FEHLER: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
NachtBlau Pi — apt upgrade + Git-Branch aktualisieren + Desktop-Skript

  NUR auf dem Raspberry Pi ausführen (ssh administrator@192.168.178.33).
  Nicht auf Bazzite/Windows — zum Spielen dort:
    apps/nachtblau-hub/linux/Install-SteamShortcut.sh
  (Steam → Nicht-Steam-Spiel → Start-NachtBlauHub-Steam.sh, kein Proton.)

  --yes              Nicht nachfragen (apt upgrade + git pull)
  --check-only       Nur apt-Check (install-lightweight-desktop --check-only), kein git pull
  --skip-git         Kein git fetch/pull (nur apt + Desktop-Skript)
  --with-desktop     XFCE/LightDM nachziehen falls noch nicht installiert
  --dist-upgrade     Zusätzlich apt full-upgrade (Vorsicht: Kernel/Firmware)
  --force            Auch ohne erkanntes Raspberry-Pi-Board (selten)
  -h, --help         Diese Hilfe

Umgebung:
  NACHT_BRANCH       Git-Branch (Standard: ${BRANCH})
  NACHT_REPO         Repo-Pfad (Standard: ${REPO_ROOT})

Von Bazzite aus:
  ssh administrator@192.168.178.33
  cd ~/nachtblau-crew && sudo ./scripts/pi/upgrade-all.sh --yes

Empfohlen auf dem Pi (nach erstem Clone):
  cd ~/nachtblau-crew
  sudo ./scripts/pi/upgrade-all.sh --yes

Nur prüfen:
  sudo ./scripts/pi/upgrade-all.sh --check-only
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) ASSUME_YES=1 ;;
    --check-only) CHECK_ONLY=1 ;;
    --skip-git) SKIP_GIT=1 ;;
    --with-desktop) WITH_DESKTOP=1 ;;
    --dist-upgrade) DIST_UPGRADE=1 ;;
    --force) FORCE_HOST=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unbekannte Option: $1" ;;
  esac
  shift
done

[[ "$(id -u)" -eq 0 ]] || die "Bitte als root ausführen (sudo $0)."

is_raspberry_pi() {
  [[ -f /proc/device-tree/model ]] && grep -qi 'raspberry pi' /proc/device-tree/model 2>/dev/null && return 0
  [[ -f /proc/cpuinfo ]] && grep -qiE 'Raspberry Pi|BCM2[0-9]+' /proc/cpuinfo 2>/dev/null && return 0
  return 1
}

if [[ "${FORCE_HOST}" -eq 0 ]] && ! is_raspberry_pi; then
  die "Kein Raspberry Pi erkannt (Host: $(uname -n)). Dieses Skript gehört auf den Pi — von Bazzite: ssh administrator@192.168.178.33 und dort im Clone ausführen. Notfalls: --force"
fi

if [[ -n "${NACHT_REPO:-}" ]]; then
  REPO_ROOT="$(cd "${NACHT_REPO}" && pwd)"
fi

[[ -x "${DESKTOP_SCRIPT}" ]] || die "Desktop-Skript fehlt: ${DESKTOP_SCRIPT}"

desktop_args=(--check-only)
if [[ "${CHECK_ONLY}" -eq 0 ]]; then
  desktop_args=(--yes --upgrade)
  [[ "${DIST_UPGRADE}" -eq 1 ]] && desktop_args+=(--dist-upgrade)
  [[ "${WITH_DESKTOP}" -eq 0 ]] && desktop_args+=(--skip-desktop)
fi

log "Paket-Updates (${DESKTOP_SCRIPT} ${desktop_args[*]}) …"
"${DESKTOP_SCRIPT}" "${desktop_args[@]}"
desktop_rc=$?

git_behind=0
run_git() {
  local git_owner="${SUDO_USER:-root}"
  if [[ "${git_owner}" == root ]]; then
    git -C "${REPO_ROOT}" "$@"
  else
    sudo -u "${git_owner}" -H git -C "${REPO_ROOT}" "$@"
  fi
}

if [[ "${SKIP_GIT}" -eq 0 && -d "${REPO_ROOT}/.git" ]]; then
  run_git fetch origin "${BRANCH}" --quiet || true
  local_head="$(run_git rev-parse HEAD 2>/dev/null || true)"
  remote_head="$(run_git rev-parse "origin/${BRANCH}" 2>/dev/null || true)"
  if [[ -n "${local_head}" && -n "${remote_head}" && "${local_head}" != "${remote_head}" ]]; then
    git_behind=1
    log "Git: lokaler Branch hinter origin/${BRANCH} — pull mit: sudo $0 --yes"
  elif [[ "${CHECK_ONLY}" -eq 1 ]]; then
    log "Git: Branch ${BRANCH} ist aktuell (origin)."
  fi
elif [[ "${SKIP_GIT}" -eq 0 && ! -d "${REPO_ROOT}/.git" ]]; then
  log "Kein Git-Repo unter ${REPO_ROOT}."
  log "Clone: git clone -b ${BRANCH} https://github.com/Wuza0295/nachtblau-crew.git"
fi

if [[ "${CHECK_ONLY}" -eq 1 ]]; then
  if [[ "${desktop_rc}" -eq 2 ]]; then
    log "Es stehen apt-Upgrades an. Ausführen: sudo $0 --yes"
  fi
  exit $(( desktop_rc == 2 || git_behind == 1 ? 2 : 0 ))
fi

if [[ "${SKIP_GIT}" -eq 1 ]]; then
  log "Git pull übersprungen (--skip-git)."
  exit 0
fi

if [[ ! -d "${REPO_ROOT}/.git" ]]; then
  exit 0
fi

log "Git pull auf origin/${BRANCH} …"
run_git checkout "${BRANCH}" 2>/dev/null || run_git checkout -B "${BRANCH}" "origin/${BRANCH}"
run_git pull --ff-only origin "${BRANCH}"
log "Repo auf origin/${BRANCH} aktualisiert."

log "Optional Minecraft-Stack aktualisieren: sudo ${SCRIPT_DIR}/nacht-install.sh --yes"
log "Status: sudo ${SCRIPT_DIR}/nacht-status.sh"
log "Fertig."
