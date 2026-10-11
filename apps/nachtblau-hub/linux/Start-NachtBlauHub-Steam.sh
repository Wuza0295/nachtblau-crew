#!/usr/bin/env bash
# NachtBlau Hub — Start unter Steam (Bazzite / Game Mode / Desktop)
#
# Native Linux-Electron — KEIN Proton / KEINE Windows-Kompatibilitätsschicht.
# In Steam: „Als Nicht-Steam-Spiel hinzufügen“ → diese Datei wählen.
#
# Steam injiziert oft LD_PRELOAD (Game Overlay) und Runtime-Libs; das knallt
# Electron. Deshalb Overlay/Runtime hier zurücksetzen.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Steam Overlay / Runtime — nicht für Electron
unset LD_PRELOAD
unset STEAM_RUNTIME
unset STEAM_RUNTIME_LIBRARY_PATH
unset STEAM_RUNTIME_OVERLAY
# Proton-Pfade sind für diesen Launcher irrelevant (native Linux)
unset STEAM_COMPAT_DATA_PATH
unset STEAM_COMPAT_CLIENT_INSTALL_PATH
unset PROTON_LOG
unset WINEDLLOVERRIDES

# Saubere Library-Suche (Steam-Runtime-LD_LIBRARY_PATH entfernen)
if [[ -n "${LD_LIBRARY_PATH:-}" ]]; then
  cleaned=""
  IFS=':' read -ra _parts <<<"$LD_LIBRARY_PATH"
  for p in "${_parts[@]}"; do
    [[ -z "$p" ]] && continue
    case "$p" in
      *steam*|*Steam*|*SteamOS*|*pressure-vessel*|*steam-runtime*) continue ;;
    esac
    if [[ -z "$cleaned" ]]; then
      cleaned="$p"
    else
      cleaned="${cleaned}:${p}"
    fi
  done
  if [[ -n "$cleaned" ]]; then
    export LD_LIBRARY_PATH="$cleaned"
  else
    unset LD_LIBRARY_PATH
  fi
fi

export ELECTRON_OZONE_PLATFORM_HINT="${ELECTRON_OZONE_PLATFORM_HINT:-auto}"

if [[ ! -x "$SCRIPT_DIR/Start-NachtBlauHub.sh" ]]; then
  chmod +x "$SCRIPT_DIR/Start-NachtBlauHub.sh" 2>/dev/null || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm fehlt. Zuerst im Terminal:" >&2
  echo "  cd \"$SCRIPT_DIR\"" >&2
  echo "  ./Install-NachtBlauHub.sh" >&2
  echo "Oder: ./Install-SteamShortcut.sh" >&2
  exit 1
fi

if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
  echo "node_modules fehlt — einmalig installieren:" >&2
  echo "  cd \"$SCRIPT_DIR\" && ./Install-NachtBlauHub.sh" >&2
  exit 1
fi

exec "$SCRIPT_DIR/Start-NachtBlauHub.sh"
