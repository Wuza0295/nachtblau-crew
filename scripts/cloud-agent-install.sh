#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

NODE_VERSION=22.22.2
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export PATH="/usr/local/bin:${PATH}"

if [[ ! -x /usr/local/bin/node ]]; then
  tmp="$(mktemp)"
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o "${tmp}"
  sudo tar -xJf "${tmp}" -C /usr/local --strip-components=1 --no-same-owner
  rm -f "${tmp}"
fi

sudo corepack enable
sudo corepack prepare pnpm@10.4.1 --activate

if ! command -v mysql >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
fi

pnpm install --frozen-lockfile
