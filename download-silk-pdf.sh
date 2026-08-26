#!/usr/bin/env bash
# PDF lokal speichern (Downloads oder aktuelles Verzeichnis)
set -euo pipefail

URL="https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/main/Silk-Zusammenfassung.pdf"
NAME="Silk-Zusammenfassung.pdf"
DEST="${1:-${XDG_DOWNLOAD_DIR:-$HOME/Downloads}/$NAME}"

mkdir -p "$(dirname "$DEST")"
echo "Lade PDF …"
curl -fsSL "$URL" -o "$DEST"
echo "Gespeichert: $DEST"
echo "Öffnen: xdg-open \"$DEST\""
