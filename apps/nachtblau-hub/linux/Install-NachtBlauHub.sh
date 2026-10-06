#!/usr/bin/env bash
# NachtBlau Hub — Installation auf Linux (Bazzite / Aurora / Fedora Desktop)
# Kein root nötig. Legt standardmäßig eine Desktop-Datei an.
#
# Nutzung (bash im Repo — NICHT PowerShell, NICHT auf dem Pi):
#   ./Install-NachtBlauHub.sh
#   ./Install-NachtBlauHub.sh --start
#   ./Install-NachtBlauHub.sh --skip-install   # nur Desktop-Shortcut nachziehen
#   ./Install-NachtBlauHub.sh --no-shortcut

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

START=0
NO_SHORTCUT=0
SKIP_INSTALL=0

usage() {
  cat <<EOF
NachtBlau Hub — Linux Install (Bazzite / Aurora)

  --start           Nach Install sofort pnpm start
  --no-shortcut     Keine Desktop-Datei
  --skip-install    Nur Shortcut / Checks, kein pnpm install
  -h, --help        Diese Hilfe

Voraussetzungen: Node.js LTS + pnpm (kein sudo für den Hub selbst).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start) START=1 ;;
    --no-shortcut) NO_SHORTCUT=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "[FEHLER] Unbekanntes Argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

echo ""
echo "=== NachtBlau Hub — Linux Install ==="
echo "Ordner: $SCRIPT_DIR"
echo ""

have_cmd() { command -v "$1" >/dev/null 2>&1; }

ensure_node() {
  if have_cmd node; then
    echo "[OK] Node.js: $(node -v)"
    return
  fi
  echo "[FEHLER] Node.js fehlt." >&2
  echo "" >&2
  echo "Auf Bazzite / Aurora (empfohlen — Homebrew):" >&2
  echo "  brew install node" >&2
  echo "" >&2
  echo "Oder: https://nodejs.org/ (LTS) bzw. fnm/nvm." >&2
  echo "Danach Terminal neu öffnen und dieses Skript erneut ausführen." >&2
  exit 1
}

ensure_pnpm() {
  if have_cmd pnpm; then
    echo "[OK] pnpm: $(pnpm -v)"
    return
  fi
  echo "[FEHLER] pnpm fehlt." >&2
  echo "" >&2
  echo "Nach Node-Installation:" >&2
  echo "  npm install -g pnpm" >&2
  echo "Oder:  corepack enable && corepack prepare pnpm@latest --activate" >&2
  echo "Danach Terminal neu öffnen und dieses Skript erneut ausführen." >&2
  exit 1
}

desktop_dirs() {
  local -a candidates=()
  [[ -n "${XDG_DESKTOP_DIR:-}" ]] && candidates+=("$XDG_DESKTOP_DIR")
  candidates+=("$HOME/Desktop" "$HOME/Schreibtisch")
  if have_cmd xdg-user-dir; then
    local d
    d="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
    [[ -n "$d" ]] && candidates+=("$d")
  fi
  local -A seen=()
  local c resolved
  for c in "${candidates[@]}"; do
    [[ -z "$c" || ! -d "$c" ]] && continue
    resolved="$(cd "$c" && pwd)"
    [[ -n "${seen[$resolved]:-}" ]] && continue
    seen[$resolved]=1
    printf '%s\n' "$resolved"
  done
}

write_desktop_file() {
  local target="$1"
  local start_script="$SCRIPT_DIR/Start-NachtBlauHub.sh"
  mkdir -p "$(dirname "$target")"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=NachtBlau Hub
Comment=NachtBlau Hub Launcher (Electron → Webspace)
Exec=${start_script}
Path=${SCRIPT_DIR}
Terminal=false
Categories=Game;Network;
StartupNotify=true
EOF
  chmod +x "$target" "$start_script"
  # Mark as trusted on some GNOME/KDE setups (best-effort, no fail)
  if have_cmd gio; then
    gio set "$target" metadata::trusted true 2>/dev/null || true
  fi
  echo "[OK] Desktop: $target"
}

ensure_node
ensure_pnpm

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo ""
  echo "pnpm install …"
  pnpm install
  echo "[OK] Abhängigkeiten installiert."
else
  echo "[Skip] pnpm install übersprungen (--skip-install)."
fi

CREATED=()
if [[ "$NO_SHORTCUT" -eq 0 ]]; then
  echo ""
  echo "Desktop-Shortcut anlegen …"
  mapfile -t dirs < <(desktop_dirs)
  if [[ ${#dirs[@]} -eq 0 ]]; then
    echo "[WARN] Kein Desktop-Ordner gefunden — lege Datei unter ~/.local/share/applications/ an."
  else
    echo "Desktop-Ordner:"
    for d in "${dirs[@]}"; do
      echo "  - $d"
      write_desktop_file "$d/NachtBlau Hub.desktop"
      CREATED+=("$d/NachtBlau Hub.desktop")
    done
  fi
  apps_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  write_desktop_file "$apps_dir/nachtblau-hub.desktop"
  CREATED+=("$apps_dir/nachtblau-hub.desktop")
else
  echo "[Skip] Keine Shortcuts (--no-shortcut)."
fi

echo ""
echo "=== Fertig ==="
if [[ ${#CREATED[@]} -gt 0 ]]; then
  echo "Shortcuts erstellt:"
  for p in "${CREATED[@]}"; do
    echo "  $p"
  done
  echo ""
  echo "So starten:"
  echo "  1) Desktop: Doppelklick „NachtBlau Hub“ (ggf. „Erlauben“ / vertrauenswürdig)"
  echo "  2) App-Menü: NachtBlau Hub"
  echo "  3) Manuell:"
  echo "       cd \"$SCRIPT_DIR\""
  echo "       pnpm start"
else
  echo "Start manuell:"
  echo "  cd \"$SCRIPT_DIR\""
  echo "  pnpm start"
fi
echo ""
echo "Hub-URL: https://launcher.nachtblau-interactive.com/linux.html"
echo ""

if [[ "$START" -eq 1 ]]; then
  echo "Starte Hub …"
  pnpm start
fi
