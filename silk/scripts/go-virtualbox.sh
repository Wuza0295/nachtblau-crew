#!/usr/bin/env bash
# Silk in VirtualBox – EIN Befehl: ISO laden, VM anlegen, starten.
# Kein Aurora. Kein manuelles reassemble. Kein Fedora-Label.
#
#   curl -fsSL …/go-virtualbox.sh | bash
#   ./silk/scripts/go-virtualbox.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/test-silk-virtualbox.sh" go "$@"
