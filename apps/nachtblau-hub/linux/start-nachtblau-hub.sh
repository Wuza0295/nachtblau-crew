#!/usr/bin/env bash
# Startet den NachtBlau Hub im Linux-/Bazzite-Electron-Shell.
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")"
exec pnpm start
