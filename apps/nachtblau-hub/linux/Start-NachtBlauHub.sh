#!/usr/bin/env bash
# Startet den NachtBlau Hub (Electron). Working directory = dieses Verzeichnis.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Java 21 für nachgelagerte Lumina-Starts (Bazzite User-Space JDK)
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

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm fehlt. Zuerst: ./Install-NachtBlauHub.sh" >&2
  exit 1
fi
exec pnpm start
