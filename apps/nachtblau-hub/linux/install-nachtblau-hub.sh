#!/usr/bin/env bash
# NachtBlau Hub — Installation auf Bazzite / Aurora / Fedora Atomic / Desktop-Linux
# Kein Root nötig. Legt standardmäßig Desktop- und Anwendungsmenü-Shortcuts an.
#
# Nutzung:
#   ./install-nachtblau-hub.sh
#   ./install-nachtblau-hub.sh --start
#   ./install-nachtblau-hub.sh --skip-install   # nur Shortcuts nachziehen
#   ./install-nachtblau-hub.sh --no-shortcut

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

START=0
NO_SHORTCUT=0
SKIP_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --start) START=1 ;;
    --no-shortcut) NO_SHORTCUT=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

SHORTCUT_NAME="NachtBlau Hub.desktop"
CREATED=()

echo
echo "=== NachtBlau Hub — Bazzite / Linux Install ==="
echo "Ordner: $SCRIPT_DIR"
echo

command_exists() { command -v "$1" >/dev/null 2>&1; }

ensure_node() {
  if command_exists node; then
    echo "[OK] Node.js: $(node -v)"
    return
  fi
  echo "[FEHLER] Node.js fehlt."
  echo
  echo "Auf Bazzite / Aurora (unveränderliches OS) eine der Varianten:"
  echo "  1) Homebrew:  brew install node"
  echo "  2) Toolbox:   toolbox create && toolbox enter && sudo dnf install nodejs"
  echo "  3) fnm:       curl -fsSL https://fnm.vercel.app/install | bash"
  echo
  echo "Danach dieses Skript erneut ausführen."
  exit 1
}

ensure_pnpm() {
  if command_exists pnpm; then
    echo "[OK] pnpm: $(pnpm -v)"
    return
  fi
  if command_exists corepack; then
    echo "corepack enable + pnpm …"
    corepack enable
    corepack prepare pnpm@latest --activate
    if command_exists pnpm; then
      echo "[OK] pnpm: $(pnpm -v)"
      return
    fi
  fi
  if command_exists npm; then
    echo "npm install -g pnpm …"
    npm install -g pnpm
    if command_exists pnpm; then
      echo "[OK] pnpm: $(pnpm -v)"
      return
    fi
  fi
  echo "[FEHLER] pnpm fehlt. Nach Node:  npm install -g pnpm"
  echo "Oder:  corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
}

desktop_dirs() {
  local dirs=()
  if [[ -n "${XDG_DESKTOP_DIR:-}" && -d "${XDG_DESKTOP_DIR}" ]]; then
    dirs+=("$XDG_DESKTOP_DIR")
  fi
  if [[ -d "$HOME/Desktop" ]]; then
    dirs+=("$HOME/Desktop")
  fi
  if [[ -d "$HOME/Schreibtisch" ]]; then
    dirs+=("$HOME/Schreibtisch")
  fi
  # unique
  printf '%s\n' "${dirs[@]}" | awk 'NF && !seen[$0]++'
}

write_desktop_file() {
  local dest="$1"
  local parent
  parent="$(dirname "$dest")"
  mkdir -p "$parent"
  cat > "$dest" <<EOF
[Desktop Entry]
Type=Application
Name=NachtBlau Hub
Comment=NachtBlau Launcher — gleicher Stand wie Windows
Exec=${SCRIPT_DIR}/start-nachtblau-hub.sh
Path=${SCRIPT_DIR}
Terminal=false
Categories=Game;
StartupWMClass=NachtBlau Hub
EOF
  chmod +x "$dest" "$SCRIPT_DIR/start-nachtblau-hub.sh"
  # Bazzite / GNOME: Datei als vertrauenswürdig markieren
  if command_exists gio; then
    gio set "$dest" metadata::trusted true 2>/dev/null || true
  fi
  echo "[OK] Shortcut: $dest"
  CREATED+=("$dest")
}

ensure_node
ensure_pnpm

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo
  echo "pnpm install …"
  pnpm install
  echo "[OK] Abhängigkeiten installiert."
else
  echo "[Skip] pnpm install übersprungen (--skip-install)."
fi

if [[ "$NO_SHORTCUT" -eq 0 ]]; then
  echo
  echo "Shortcuts anlegen (ohne Root) …"
  mapfile -t DESKS < <(desktop_dirs)
  if [[ ${#DESKS[@]} -eq 0 ]]; then
    echo "[Hinweis] Kein Desktop-Ordner — nur Anwendungsmenü."
  else
    echo "Desktop-Ordner:"
    for d in "${DESKS[@]}"; do
      echo "  - $d"
      write_desktop_file "$d/$SHORTCUT_NAME"
    done
  fi
  write_desktop_file "${XDG_DATA_HOME:-$HOME/.local/share}/applications/$SHORTCUT_NAME"
else
  echo "[Skip] Keine Shortcuts (--no-shortcut)."
fi

echo
echo "=== Fertig ==="
if [[ ${#CREATED[@]} -gt 0 ]]; then
  echo "Shortcuts erstellt:"
  for p in "${CREATED[@]}"; do
    echo "  $p"
  done
  echo
  echo "So starten:"
  echo "  1) Desktop: Doppelklick auf „NachtBlau Hub“"
  echo "  2) Anwendungsmenü: NachtBlau Hub"
  echo "  3) Manuell:  cd \"$SCRIPT_DIR\" && pnpm start"
else
  echo "Keine Shortcuts angelegt."
  echo "Start manuell:  cd \"$SCRIPT_DIR\" && pnpm start"
fi
echo
echo "Hub-URL: https://launcher.nachtblau-interactive.com/linux.html"
echo "(gleicher Inhalt wie Windows, nur Plattform-Einstieg)"
echo

if [[ "$START" -eq 1 ]]; then
  echo "Starte Hub …"
  pnpm start
fi
