#!/usr/bin/env bash
# NachtBlau Hub auf Bazzite (und anderen Linux-Desktops) einrichten.
# Kein Root nötig. Legt einen Anwendungs- und Desktop-Starter an.
#
#   ./install-bazzite.sh
#   ./install-bazzite.sh --start
#   ./install-bazzite.sh --skip-install
#   ./install-bazzite.sh --no-shortcut
set -euo pipefail

START=0
SKIP_INSTALL=0
NO_SHORTCUT=0
for arg in "$@"; do
  case "$arg" in
    --start) START=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    --no-shortcut) NO_SHORTCUT=1 ;;
    -h|--help)
      echo "Nutzung: $0 [--start] [--skip-install] [--no-shortcut]"
      exit 0
      ;;
    *)
      echo "Unbekannte Option: $arg" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
cd "$SCRIPT_DIR"
START_SH="${SCRIPT_DIR}/start-nachtblau-hub.sh"
DESKTOP_NAME="nachtblau-hub.desktop"
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"

echo ""
echo "=== NachtBlau Hub — Bazzite / Linux ==="
echo "Ordner: ${SCRIPT_DIR}"
if [[ -r /etc/os-release ]] && grep -qi 'bazzite' /etc/os-release; then
  echo "System: Bazzite"
else
  echo "System: Linux (Installer gilt auch für Bazzite)"
fi
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[FEHLER] Node.js fehlt."
  echo "Auf Bazzite, ohne das System umzubauen:"
  echo "  brew install node"
  echo "Danach ein neues Terminal öffnen und dieses Skript erneut ausführen."
  exit 1
fi
echo "[OK] Node.js: $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[FEHLER] pnpm fehlt."
  echo "  corepack enable && corepack prepare pnpm@latest --activate"
  echo "oder: npm install -g pnpm"
  exit 1
fi
echo "[OK] pnpm: $(pnpm -v)"

chmod +x "$START_SH"

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo ""
  echo "pnpm install …"
  pnpm install
  echo "[OK] Abhängigkeiten installiert."
else
  echo "[Skip] pnpm install übersprungen (--skip-install)."
fi

if [[ "$NO_SHORTCUT" -eq 0 ]]; then
  echo ""
  echo "Starter anlegen (ohne Root) …"
  mkdir -p "$APP_DIR"
  DESKTOP_FILE="${APP_DIR}/${DESKTOP_NAME}"
  cat >"$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=NachtBlau Hub
GenericName=NachtBlau Hub
Comment=NachtBlau Hub — gleicher Stand wie Windows
Exec=${START_SH}
Path=${SCRIPT_DIR}
Terminal=false
Categories=Game;Network;
StartupNotify=true
EOF
  chmod +x "$DESKTOP_FILE"
  echo "[OK] Anwendungsmenü: ${DESKTOP_FILE}"

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
  fi

  DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
  if [[ -z "$DESKTOP_DIR" || ! -d "$DESKTOP_DIR" ]]; then
    for candidate in "$HOME/Desktop" "$HOME/Schreibtisch"; do
      if [[ -d "$candidate" ]]; then
        DESKTOP_DIR="$candidate"
        break
      fi
    done
  fi
  if [[ -n "${DESKTOP_DIR:-}" && -d "$DESKTOP_DIR" ]]; then
    cp -f "$DESKTOP_FILE" "${DESKTOP_DIR}/${DESKTOP_NAME}"
    chmod +x "${DESKTOP_DIR}/${DESKTOP_NAME}"
    # Auf manchen Desktops (auch Bazzite/KDE) müssen Desktop-Dateien vertrauenswürdig sein.
    if command -v gio >/dev/null 2>&1; then
      gio set "${DESKTOP_DIR}/${DESKTOP_NAME}" metadata::trusted true >/dev/null 2>&1 || true
    fi
    echo "[OK] Desktop: ${DESKTOP_DIR}/${DESKTOP_NAME}"
  else
    echo "[Hinweis] Kein Desktop-Ordner gefunden. Der Starter liegt im Anwendungsmenü."
  fi
else
  echo "[Skip] Keine Starter (--no-shortcut)."
fi

echo ""
echo "=== Fertig ==="
echo "So starten:"
echo "  1) Anwendungsmenü: NachtBlau Hub"
echo "  2) Desktop: NachtBlau Hub (falls der Ordner existiert)"
echo "  3) Manuell:"
echo "       cd \"${SCRIPT_DIR}\""
echo "       pnpm start"
echo ""
echo "Hub-URL: https://launcher.nachtblau-interactive.com/linux.html"
echo ""

if [[ "$START" -eq 1 ]]; then
  echo "Starte Hub …"
  exec pnpm start
fi
