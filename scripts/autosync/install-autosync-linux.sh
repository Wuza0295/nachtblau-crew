#!/usr/bin/env bash
# Installiert und aktiviert NachtBlau Auto-Sync (systemd --user) auf Bazzite/Linux.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
ENV_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/nachtblau"
ENV_FILE="$ENV_DIR/autosync.env"
DROPIN_DIR="$UNIT_DIR/nachtblau-autosync.service.d"

usage() {
  cat <<EOF
Usage: $0 [--enable|--disable|--status|--run-now]

  --enable   Units installieren, Timer aktivieren (Standard)
  --disable  Timer/Services deaktivieren (Dateien bleiben)
  --status   systemctl --user status
  --run-now  Einmal sofort ausführen

Repo: $ROOT
Env:  $ENV_FILE
EOF
}

cmd="${1:---enable}"

install_units() {
  mkdir -p "$UNIT_DIR" "$ENV_DIR" "$DROPIN_DIR"
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$SCRIPT_DIR/autosync.env.example" "$ENV_FILE"
    echo "NACHTBLAU_REPO=$ROOT" >>"$ENV_FILE"
    echo "→ Env angelegt: $ENV_FILE  (NACHTBLAU_SYNC_ROOT bei Bedarf setzen)"
  elif ! grep -q '^NACHTBLAU_REPO=' "$ENV_FILE"; then
    echo "NACHTBLAU_REPO=$ROOT" >>"$ENV_FILE"
  fi

  install -m 0644 "$SCRIPT_DIR/nachtblau-autosync.service" "$UNIT_DIR/"
  install -m 0644 "$SCRIPT_DIR/nachtblau-autosync.timer" "$UNIT_DIR/"
  install -m 0644 "$SCRIPT_DIR/nachtblau-autosync-logout.service" "$UNIT_DIR/"
  chmod +x "$SCRIPT_DIR/run-autosync.sh"

  cat >"$DROPIN_DIR/repo-path.conf" <<EOF
[Service]
Environment=NACHTBLAU_AUTOSYNC_ENV=$ENV_FILE
ExecStart=
ExecStart=$SCRIPT_DIR/run-autosync.sh
EOF

  # Logout-Service auf dieses Repo zeigen
  mkdir -p "$UNIT_DIR/nachtblau-autosync-logout.service.d"
  cat >"$UNIT_DIR/nachtblau-autosync-logout.service.d/repo-path.conf" <<EOF
[Service]
Environment=NACHTBLAU_AUTOSYNC_ENV=$ENV_FILE
Environment=NACHTBLAU_REPO=$ROOT
EOF

  systemctl --user daemon-reload
}

case "$cmd" in
  -h|--help) usage; exit 0 ;;
  --status)
    systemctl --user status nachtblau-autosync.timer nachtblau-autosync.service --no-pager || true
    systemctl --user list-timers --all | grep -E 'nachtblau|NEXT' || true
    exit 0
    ;;
  --disable)
    systemctl --user disable --now nachtblau-autosync.timer 2>/dev/null || true
    systemctl --user disable nachtblau-autosync-logout.service 2>/dev/null || true
    echo "Auto-Sync deaktiviert (Timer stop)."
    exit 0
    ;;
  --run-now)
    install_units
    systemctl --user start nachtblau-autosync.service
    journalctl --user -u nachtblau-autosync.service -n 40 --no-pager || true
    tail -n 40 "${XDG_STATE_HOME:-$HOME/.local/state}/nachtblau/autosync.log" 2>/dev/null || true
    exit 0
    ;;
  --enable|"")
    install_crontab() {
      local line="*/30 * * * * $SCRIPT_DIR/run-autosync.sh >>${XDG_STATE_HOME:-$HOME/.local/state}/nachtblau/autosync.log 2>&1"
      mkdir -p "${XDG_STATE_HOME:-$HOME/.local/state}/nachtblau"
      (crontab -l 2>/dev/null | grep -v 'run-autosync.sh' || true; echo "$line") | crontab -
      echo "✓ Auto-Sync aktiv (crontab alle 30 Min)"
      echo "  Env:  $ENV_FILE"
      echo "  Log:  ~/.local/state/nachtblau/autosync.log"
      echo "  Zeile: $line"
    }

    if ! command -v systemctl >/dev/null; then
      echo "systemd fehlt — Fallback crontab" >&2
      mkdir -p "$ENV_DIR"
      if [[ ! -f "$ENV_FILE" ]]; then
        cp "$SCRIPT_DIR/autosync.env.example" "$ENV_FILE"
        echo "NACHTBLAU_REPO=$ROOT" >>"$ENV_FILE"
      fi
      install_crontab
      exit 0
    fi
    install_units
    if systemctl --user enable --now nachtblau-autosync.timer 2>/dev/null \
      && systemctl --user enable nachtblau-autosync-logout.service 2>/dev/null; then
      if command -v loginctl >/dev/null; then
        loginctl enable-linger "$USER" 2>/dev/null || true
      fi
      echo "✓ Auto-Sync aktiv (systemd --user)"
      echo "  Timer:   systemctl --user status nachtblau-autosync.timer"
      echo "  Env:     $ENV_FILE"
      echo "  Log:     ~/.local/state/nachtblau/autosync.log"
      echo "  Saves:   NACHTBLAU_SYNC_ROOT in Env setzen + Partition mounten"
      systemctl --user list-timers --all 2>/dev/null | grep -E 'nachtblau|NEXT' || true
    else
      echo "systemd --user nicht verfügbar — Fallback crontab" >&2
      install_crontab
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
