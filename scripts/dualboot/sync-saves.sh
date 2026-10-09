#!/usr/bin/env bash
# Wrapper: Dual-Boot Spielstände (Bazzite/Linux). Windows: Sync-Saves.ps1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 "$ROOT/scripts/dualboot/sync_saves.py" "${@:-sync}"
