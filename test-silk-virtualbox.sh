#!/usr/bin/env bash
# Silk → VirtualBox in einem Schritt (ruft go-virtualbox.sh auf).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
exec "$ROOT/silk/scripts/go-virtualbox.sh" "$@"
