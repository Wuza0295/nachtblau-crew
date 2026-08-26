#!/usr/bin/env bash
# Provision a local MariaDB instance for NachtBlau Crew development.
# Idempotent: safe to run repeatedly. Installs the server if missing,
# starts it, creates the database/user, applies the drizzle migrations
# once, and writes a local .env if one is not already present.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_NAME="nachtblau"
DB_USER="nachtblau"
DB_PASS="nachtblau"
DB_HOST="127.0.0.1"
DB_PORT="3306"

# 1. Ensure the MariaDB server is installed.
if ! command -v mariadbd >/dev/null 2>&1 && ! command -v mysqld >/dev/null 2>&1; then
  echo "[db] Installing mariadb-server..."
  export DEBIAN_FRONTEND=noninteractive
  sudo apt-get update -qq
  sudo apt-get install -y -qq mariadb-server
fi

# 2. Start the server (idempotent) and wait until it accepts connections.
sudo service mariadb start >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  if sudo mysqladmin ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 3. Create the database and application user.
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;
SQL

# 4. Apply the drizzle migrations once, when the schema is not yet present.
#    The drizzle journal does not track 0003_social_portal.sql, so we apply
#    the raw migration files in order. Only the "--> statement-breakpoint"
#    marker is stripped (it can share a line with real SQL).
HAS_USERS_TABLE=$(mysql -u"${DB_USER}" -p"${DB_PASS}" -h"${DB_HOST}" -N -B \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}' AND table_name='users';" 2>/dev/null || echo 0)

if [ "${HAS_USERS_TABLE}" != "1" ]; then
  echo "[db] Applying migrations..."
  for f in drizzle/0000_*.sql drizzle/0001_*.sql drizzle/0002_*.sql drizzle/0003_*.sql; do
    [ -f "$f" ] || continue
    echo "[db]   -> $f"
    sed 's/--> statement-breakpoint//g' "$f" | mysql -u"${DB_USER}" -p"${DB_PASS}" -h"${DB_HOST}" "${DB_NAME}"
  done
else
  echo "[db] Schema already present, skipping migrations."
fi

# 5. Write a local .env for the dev server if the developer has not created one.
if [ ! -f .env ]; then
  echo "[db] Writing local .env..."
  cat > .env <<ENV
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
JWT_SECRET=local-dev-only-secret-change-me
PORT=3000
NODE_ENV=development
ENV
fi

echo "[db] MariaDB ready on ${DB_HOST}:${DB_PORT}/${DB_NAME}"
