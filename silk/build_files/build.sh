#!/bin/bash
set -ouex pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# system_files → Root
cp -avf "/ctx/system_files"/. /

# Modularer Build
source "${SCRIPT_DIR}/01-packages.sh"
source "${SCRIPT_DIR}/02-themes.sh"
source "${SCRIPT_DIR}/03-gaming.sh"
source "${SCRIPT_DIR}/04-compat.sh"
source "${SCRIPT_DIR}/05-finalize.sh"

echo "Silk build complete."
