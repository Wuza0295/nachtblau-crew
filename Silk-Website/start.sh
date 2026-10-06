#!/usr/bin/env bash
# Silk-Website lokal starten (Bazzite, Fedora, macOS, …)
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
PORT="${1:-8765}"
URL="http://127.0.0.1:${PORT}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Fehler: python3 nicht gefunden."
  echo "Bazzite: python3 ist normalerweise vorinstalliert."
  exit 1
fi

if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "Port ${PORT} ist schon belegt. Anderen Port wählen: ./start.sh 8080"
  exit 1
fi

echo "Silk-Website: ${URL}"
echo "Beenden: Strg+C"
echo ""

# Browser automatisch öffnen (Bazzite/KDE, GNOME, macOS)
if command -v xdg-open >/dev/null 2>&1; then
  (sleep 0.5 && xdg-open "${URL}") &
elif command -v open >/dev/null 2>&1; then
  (sleep 0.5 && open "${URL}") &
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1
