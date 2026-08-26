#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

corepack enable 2>/dev/null || true
pnpm install --frozen-lockfile

# Provision the local development database (MariaDB) and seed the schema.
./scripts/cloud-agent-db.sh

# Seed demo content (idempotent: the app's seeds skip when data exists).
set -a
# shellcheck disable=SC1091
. ./.env
set +a
pnpm db:seed
