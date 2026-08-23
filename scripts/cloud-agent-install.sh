#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

corepack enable 2>/dev/null || true
pnpm install --frozen-lockfile
