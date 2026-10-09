#!/usr/bin/env bash
# NachtBlau Hub — Steam / Bazzite: Deps + .desktop + Hinweis „Nicht-Steam-Spiel“
#
# Kein fragiles Schreiben in Steam userdata/shortcuts.vdf.
# Empfohlen: Steam → Spiele → Nicht-Steam-Spiel hinzufügen → Start-NachtBlauHub-Steam.sh
#
# Nutzung (bash auf Bazzite — NICHT PowerShell, NICHT auf dem Pi):
#   ./Install-SteamShortcut.sh
#   ./Install-SteamShortcut.sh --skip-install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SKIP_INSTALL=0
NO_HUB_INSTALL=0

usage() {
  cat <<EOF
NachtBlau Hub — Steam-Shortcut-Setup (Bazzite)

  Installiert Hub-Deps (falls nötig), legt ~/.local/share/applications/nachtblau-hub.desktop
  an und druckt die genauen Steam-Klicks.

  --skip-install    Kein pnpm install (nur .desktop + chmod)
  --no-hub-install  Install-NachtBlauHub.sh nicht aufrufen (nur Steam-Dateien)
  -h, --help        Diese Hilfe

Kein Proton: Hub ist natives Linux-Electron.
Pi-Upgrade (upgrade-all.sh) gehört NICHT hierher — nur per SSH auf dem Pi.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install) SKIP_INSTALL=1 ;;
    --no-hub-install) NO_HUB_INSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "[FEHLER] Unbekanntes Argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

STEAM_START="$SCRIPT_DIR/Start-NachtBlauHub-Steam.sh"
DESKTOP_SRC="$SCRIPT_DIR/nachtblau-hub.desktop"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_DST="$APPS_DIR/nachtblau-hub.desktop"

chmod +x \
  "$SCRIPT_DIR/Install-NachtBlauHub.sh" \
  "$SCRIPT_DIR/Install-Java21-Bazzite.sh" \
  "$SCRIPT_DIR/Start-NachtBlauHub.sh" \
  "$SCRIPT_DIR/Start-Lumina-With-Java.sh" \
  "$STEAM_START" \
  "$SCRIPT_DIR/Install-SteamShortcut.sh" \
  2>/dev/null || true

if [[ "$NO_HUB_INSTALL" -eq 0 ]]; then
  hub_args=()
  [[ "$SKIP_INSTALL" -eq 1 ]] && hub_args+=(--skip-install)
  # Install-Skript schreibt selbst schon nach applications/; wir überschreiben danach mit Steam-Exec
  echo "=== Hub-Abhängigkeiten / Basis-Shortcut ==="
  "$SCRIPT_DIR/Install-NachtBlauHub.sh" "${hub_args[@]}"
else
  echo "[Skip] Install-NachtBlauHub.sh (--no-hub-install)."
fi

write_steam_desktop() {
  local target="$1"
  mkdir -p "$(dirname "$target")"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=NachtBlau Hub
GenericName=NachtBlau Hub
Comment=NachtBlau Hub — Discord/Webspace-Launcher (Electron). Steam: natives Linux, kein Proton.
Exec=${STEAM_START}
Path=${SCRIPT_DIR}
Icon=applications-games
Terminal=false
Categories=Game;Network;
Keywords=NachtBlau;Hub;Minecraft;Lumina;Steam;Bazzite;
StartupNotify=true
StartupWMClass=NachtBlau Hub
EOF
  chmod +x "$target"
  if command -v gio >/dev/null 2>&1; then
    gio set "$target" metadata::trusted true 2>/dev/null || true
  fi
  echo "[OK] Desktop-Datei: $target"
}

echo ""
echo "=== Steam / App-Menü .desktop ==="
write_steam_desktop "$DESKTOP_DST"

# Optional Desktop-Kopie mit Steam-Starter (wenn Desktop-Ordner existiert)
desktop_candidates=()
[[ -n "${XDG_DESKTOP_DIR:-}" ]] && desktop_candidates+=("$XDG_DESKTOP_DIR")
desktop_candidates+=("$HOME/Desktop" "$HOME/Schreibtisch")
if command -v xdg-user-dir >/dev/null 2>&1; then
  d="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
  [[ -n "$d" ]] && desktop_candidates+=("$d")
fi
seen=""
for d in "${desktop_candidates[@]}"; do
  [[ -z "$d" || ! -d "$d" ]] && continue
  resolved="$(cd "$d" && pwd)"
  case " $seen " in
    *" $resolved "*) continue ;;
  esac
  seen="$seen $resolved"
  write_steam_desktop "$resolved/NachtBlau Hub.desktop"
done

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" 2>/dev/null || true
fi

cat <<EOF

=== Fertig — Steam auf Bazzite ===

1) Steam öffnen (Desktop oder Game Mode → Desktop wechseln).
2) Menü: Spiele → Ein Nicht-Steam-Spiel hinzufügen…
3) „Durchsuchen…“ → diese Datei wählen:

     ${STEAM_START}

   (Pfad kopieren oder zu apps/nachtblau-hub/linux navigieren.)
4) Eintrag umbenennen zu:  NachtBlau Hub
5) Hinzufügen → in der Bibliothek starten.

WICHTIG:
  • Kompatibilitätstool / Proton:  AUS  (natives Linux, kein Proton)
  • Properties → Launch Options: leer lassen
  • Game Mode: gleicher Non-Steam-Eintrag erscheint in der Bibliothek

App-Menü / „Add Non-Steam Game“ alternativ:
  ${DESKTOP_DST}

Minecraft spielen:
  Hub öffnen → Lumina Launcher downloaden (Webspace), oder siehe README
  „Minecraft / Lumina“.
  Java fehlt?  ./Install-Java21-Bazzite.sh  → Launcher neu starten
  RAM im Launcher auf 6–8 GB (nicht 29 GB).

Pi-Server-Upgrade ist getrennt (nur SSH auf den Pi):
  ssh administrator@192.168.178.33
  cd ~/nachtblau-crew && sudo ./scripts/pi/upgrade-all.sh --yes

Manuell testen ohne Steam:
  ${STEAM_START}

EOF
