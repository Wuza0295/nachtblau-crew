#!/usr/bin/env bash
# Auto-Sync-Lauf für Bazzite/Linux (von systemd-Timer oder manuell).
# Windows: scripts/autosync/Run-AutoSync.ps1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/nachtblau"
LOG_FILE="${LOG_DIR}/autosync.log"
ENV_FILE="${NACHTBLAU_AUTOSYNC_ENV:-$HOME/.config/nachtblau/autosync.env}"
LOCK_DIR="${XDG_RUNTIME_DIR:-/tmp}/nachtblau-autosync.lock"

mkdir -p "$LOG_DIR" "$(dirname "$ENV_FILE")" 2>/dev/null || true

log() {
  local line="[$(date -Iseconds)] $*"
  echo "$line" | tee -a "$LOG_FILE"
}

load_env() {
  # Defaults
  AUTO_SYNC_GIT=1
  AUTO_SYNC_SILK=1
  AUTO_SYNC_SAVES=1
  AUTO_SYNC_HUB_CHECK=1
  AUTO_SYNC_HUB_DEPLOY=0
  AUTO_SYNC_DESKTOP=0
  AUTO_SYNC_PNPM=1
  SYNC_REMOTE=origin
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
    log "Env geladen: $ENV_FILE"
  else
    log "Kein Env ($ENV_FILE) — Defaults + Umgebung"
  fi
  if [[ -n "${NACHTBLAU_REPO:-}" ]]; then
    ROOT="$NACHTBLAU_REPO"
  fi
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo $$ >"$LOCK_DIR/pid"
    trap 'rm -rf "$LOCK_DIR"' EXIT
    return 0
  fi
  log "Übersprungen — anderer Auto-Sync läuft ($LOCK_DIR)"
  exit 0
}

sync_git() {
  [[ "${AUTO_SYNC_GIT}" == "1" ]] || { log "Git: aus"; return 0; }
  cd "$ROOT"
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log "FEHLER: kein Git-Repo unter $ROOT"
    return 1
  fi
  local branch remote
  remote="${SYNC_REMOTE:-origin}"
  branch="${SYNC_BRANCH:-$(git branch --show-current 2>/dev/null || true)}"
  if [[ -z "$branch" ]]; then
    log "Git: detached HEAD — übersprungen"
    return 0
  fi
  # Nur wenn Working Tree clean (sonst Konflikte riskieren)
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    log "Git: Working Tree dirty — pull übersprungen (manuell bereinigen)"
    return 0
  fi
  log "Git: fetch/pull $remote $branch"
  git fetch "$remote" "$branch" || { log "Git fetch fehlgeschlagen"; return 1; }
  if git pull --ff-only "$remote" "$branch"; then
    log "Git: OK $(git rev-parse --short HEAD)"
  else
    log "Git: ff-only fehlgeschlagen (Remote divergiert?) — übersprungen"
    return 0
  fi
  if [[ "${AUTO_SYNC_PNPM}" == "1" ]] && [[ -f package.json ]] && command -v pnpm >/dev/null 2>&1; then
    log "pnpm install"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install || log "pnpm install Warnung"
  fi
}

sync_silk() {
  [[ "${AUTO_SYNC_SILK}" == "1" ]] || { log "Silk: aus"; return 0; }
  local bin="$ROOT/silk/system_files/usr/bin/silk-sync-config"
  if [[ -f "$bin" ]]; then
    log "Silk-Config"
    bash "$bin" || log "Silk-Config Warnung"
  else
    log "Silk: silk-sync-config fehlt"
  fi
}

sync_saves() {
  [[ "${AUTO_SYNC_SAVES}" == "1" ]] || { log "Saves: aus"; return 0; }
  if [[ -z "${NACHTBLAU_SYNC_ROOT:-}" ]]; then
    log "Saves: NACHTBLAU_SYNC_ROOT nicht gesetzt — übersprungen"
    return 0
  fi
  if [[ ! -d "${NACHTBLAU_SYNC_ROOT}" ]]; then
    log "Saves: Sync-Root nicht gemountet (${NACHTBLAU_SYNC_ROOT}) — übersprungen"
    return 0
  fi
  log "Saves: sync → ${NACHTBLAU_SYNC_ROOT}"
  python3 "$ROOT/scripts/dualboot/sync_saves.py" sync || log "Saves Warnung"
}

hub_check() {
  [[ "${AUTO_SYNC_HUB_CHECK}" == "1" ]] || { log "Hub-Check: aus"; return 0; }
  if [[ -f "$ROOT/scripts/hub-sync.py" ]]; then
    log "Hub Live-Check"
    python3 "$ROOT/scripts/hub-sync.py" check || log "Hub-Check: windows ggf. noch 404"
  fi
}

hub_deploy() {
  [[ "${AUTO_SYNC_HUB_DEPLOY}" == "1" ]] || { log "Hub-Deploy: aus"; return 0; }
  # Credentials aus Env oder .env.webspace
  if [[ -f "$ROOT/.env.webspace" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/.env.webspace"
    set +a
  fi
  if [[ -z "${FTP_USER:-}" || -z "${FTP_PASS:-}" ]]; then
    log "Hub-Deploy: wartet auf FTP_USER/FTP_PASS — kein Upload"
    return 0
  fi
  log "Hub-Deploy: windows.html hochladen"
  python3 "$ROOT/scripts/sync_bazzite_windows.py" || log "Hub-Deploy fehlgeschlagen"
}

sync_desktop() {
  [[ "${AUTO_SYNC_DESKTOP}" == "1" ]] || { log "Desktop-MC: aus (manuell: pnpm sync:bazzite)"; return 0; }
  log "Desktop-MC: Install (sudo)"
  sudo "$ROOT/scripts/desktop/nacht-install-bazzite.sh" --yes --no-start || log "Desktop-MC Warnung"
}

main() {
  load_env
  acquire_lock
  log "=== Auto-Sync Start (repo=$ROOT) ==="
  local rc=0
  sync_git || rc=1
  sync_silk || true
  sync_saves || true
  hub_check || true
  hub_deploy || true
  sync_desktop || true
  log "=== Auto-Sync Ende (rc=$rc) ==="
  return "$rc"
}

main "$@"
