#!/usr/bin/env bash
# Startet den NachtBlau Hub (Electron). Working directory = dieses Verzeichnis.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm fehlt. Zuerst: ./Install-NachtBlauHub.sh" >&2
  exit 1
fi
exec pnpm start
