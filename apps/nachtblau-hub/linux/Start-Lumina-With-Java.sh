#!/usr/bin/env bash
# Startet ein Lumina-AppImage mit JAVA_HOME aus Install-Java21-Bazzite.sh.
#
# Nutzung:
#   ./Start-Lumina-With-Java.sh
#   ./Start-Lumina-With-Java.sh /pfad/zu/NachtBlau-Lumina.AppImage
#
# Ohne Argument: sucht übliche Download-Pfade.

set -euo pipefail

NB_JAVA_ENV="${XDG_CONFIG_HOME:-$HOME/.config}/nachtblau/java.env"
if [[ -f "$NB_JAVA_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$NB_JAVA_ENV"
fi
export PATH="${HOME}/.local/bin:${JAVA_HOME:+$JAVA_HOME/bin:}${PATH}"
if [[ -z "${JAVA_HOME:-}" ]]; then
  for _nb_jdk in \
    "${XDG_DATA_HOME:-$HOME/.local/share}/nachtblau/jdk-21" \
    "$HOME/jdk-21"; do
    if [[ -x "$_nb_jdk/bin/java" ]]; then
      export JAVA_HOME="$_nb_jdk"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
  unset _nb_jdk
fi

if [[ -z "${JAVA_HOME:-}" ]] || [[ ! -x "${JAVA_HOME}/bin/java" ]]; then
  echo "Kein Java 21. Zuerst:" >&2
  echo "  $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/Install-Java21-Bazzite.sh" >&2
  exit 1
fi

APPIMAGE="${1:-}"
if [[ -z "$APPIMAGE" ]]; then
  for cand in \
    "$HOME/Downloads/"*[Ll]umina*.AppImage \
    "$HOME/Downloads/"*[Nn]acht*[Bb]lau*.AppImage \
    "$HOME/Schreibtisch/"*[Ll]umina*.AppImage \
    "$HOME/Desktop/"*[Ll]umina*.AppImage \
    "$HOME/Applications/"*[Ll]umina*.AppImage; do
    if [[ -f "$cand" ]]; then
      APPIMAGE="$cand"
      break
    fi
  done
fi

if [[ -z "$APPIMAGE" || ! -f "$APPIMAGE" ]]; then
  echo "Kein Lumina-AppImage gefunden." >&2
  echo "Download: https://launcher.nachtblau-interactive.com/downloads/" >&2
  echo "Dann: $0 /pfad/zur/Datei.AppImage" >&2
  exit 1
fi

chmod +x "$APPIMAGE" 2>/dev/null || true
echo "JAVA_HOME=$JAVA_HOME"
echo "Starte: $APPIMAGE"
exec "$APPIMAGE"
