#!/bin/bash
set -ouex pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ARCH="$(uname -m)"
IS_AARCH64=0
IS_ASAHI=0
[[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]] && IS_AARCH64=1
if grep -qiE 'asahi|fedora-asahi' /etc/os-release /usr/lib/os-release 2>/dev/null \
  || [[ -d /usr/share/asahi-scripts ]] \
  || [[ -e /usr/bin/update-m1n1 ]]; then
  IS_ASAHI=1
fi
export ARCH IS_AARCH64 IS_ASAHI
echo "Silk build arch=${ARCH} asahi=${IS_ASAHI}"

# system_files → Root
cp -avf "/ctx/system_files"/. /

# Modularer Build
source "${SCRIPT_DIR}/01-packages.sh"
source "${SCRIPT_DIR}/02-themes.sh"
source "${SCRIPT_DIR}/03-gaming.sh"
source "${SCRIPT_DIR}/04-compat.sh"
source "${SCRIPT_DIR}/05-finalize.sh"

echo "Silk build complete (arch=${ARCH} asahi=${IS_ASAHI})."
