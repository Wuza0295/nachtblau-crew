#!/usr/bin/env bash
# Silk-Website lokal starten
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
PORT="${1:-8765}"
echo "Silk-Website: http://127.0.0.1:${PORT}"
echo "Beenden: Strg+C"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
