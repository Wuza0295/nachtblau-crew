#!/usr/bin/env bash
# Per-boot startup: make sure the local MariaDB daemon is running before the
# dev server starts. Runs on every environment boot and must be idempotent.
set -euo pipefail

cd "$(dirname "$0")/.."

sudo service mariadb start >/dev/null 2>&1 || true

for _ in $(seq 1 30); do
  if sudo mysqladmin ping >/dev/null 2>&1; then
    echo "[start] MariaDB is ready."
    exit 0
  fi
  sleep 1
done

echo "[start] WARNING: MariaDB did not report ready in time." >&2
exit 0
