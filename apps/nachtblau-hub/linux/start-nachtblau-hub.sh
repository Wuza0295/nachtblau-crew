#!/usr/bin/env bash
# Startet den NachtBlau Hub (Electron) unter Bazzite / Linux.
set -euo pipefail
cd "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")"
exec pnpm start
