#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PATH="/usr/local/bin:${PATH}"
export DATABASE_URL="${DATABASE_URL:-mysql://nachtblau:nachtblau@127.0.0.1:3306/nachtblau}"
export JWT_SECRET="${JWT_SECRET:-cloud-agent-dev-jwt-secret}"
export PORT="${PORT:-3000}"

MYSQL_SOCKET="${MYSQL_SOCKET:-/var/run/mysqld/mysqld.sock}"

mysql_root() {
  if sudo mysql --protocol=socket --socket="${MYSQL_SOCKET}" -e "SELECT 1" >/dev/null 2>&1; then
    sudo mysql --protocol=socket --socket="${MYSQL_SOCKET}" "$@"
  else
    mysql --protocol=socket --socket="${MYSQL_SOCKET}" -uroot "$@"
  fi
}

start_mysql() {
  sudo mkdir -p /var/run/mysqld /var/log/mysql
  sudo chown mysql:mysql /var/run/mysqld /var/log/mysql

  if sudo mysqladmin --protocol=socket --socket="${MYSQL_SOCKET}" ping --silent 2>/dev/null; then
    return
  fi

  sudo rm -f /var/run/mysqld/mysqld.pid
  if ! sudo test -d /var/lib/mysql/mysql; then
    if sudo find /var/lib/mysql -mindepth 1 -print -quit | grep -q .; then
      echo "MySQL-Datenverzeichnis ist unvollständig." >&2
      exit 1
    fi
    sudo mysqld --initialize-insecure --user=mysql
  fi

  sudo mysqld --user=mysql --daemonize \
    --pid-file=/var/run/mysqld/mysqld.pid \
    --socket="${MYSQL_SOCKET}" \
    --bind-address=127.0.0.1 \
    --mysqlx=0

  for _ in $(seq 1 60); do
    if sudo mysqladmin --protocol=socket --socket="${MYSQL_SOCKET}" ping --silent 2>/dev/null; then
      return
    fi
    sleep 1
  done

  echo "MySQL ist nicht bereit." >&2
  sudo tail -n 80 /var/log/mysql/error.log >&2 || true
  exit 1
}

ensure_database() {
  mysql_root <<'SQL'
CREATE DATABASE IF NOT EXISTS nachtblau CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nachtblau'@'127.0.0.1' IDENTIFIED BY 'nachtblau';
ALTER USER 'nachtblau'@'127.0.0.1' IDENTIFIED BY 'nachtblau';
GRANT ALL PRIVILEGES ON nachtblau.* TO 'nachtblau'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
}

apply_migrations() {
  pnpm exec drizzle-kit migrate

  local has_social has_handle
  has_social="$(mysql --protocol=TCP -h127.0.0.1 -unachtblau -pnachtblau nachtblau -Nse "SHOW TABLES LIKE 'social_communities'")"
  has_handle="$(mysql --protocol=TCP -h127.0.0.1 -unachtblau -pnachtblau nachtblau -Nse "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='nachtblau' AND TABLE_NAME='users' AND COLUMN_NAME='handle'")"

  if [[ -z "${has_social}" ]]; then
    sed '/statement-breakpoint/d; /ALTER TABLE `users`/d' drizzle/0003_social_portal.sql \
      | mysql --protocol=TCP -h127.0.0.1 -unachtblau -pnachtblau nachtblau
  fi

  if [[ "${has_handle}" == "0" ]]; then
    mysql --protocol=TCP -h127.0.0.1 -unachtblau -pnachtblau nachtblau -e \
      "ALTER TABLE \`users\` ADD COLUMN \`handle\` varchar(32); ALTER TABLE \`users\` ADD CONSTRAINT \`users_handle_unique\` UNIQUE(\`handle\`);"
  fi
}

start_mysql
ensure_database
apply_migrations

if curl -fsS --max-time 2 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "Dev-Server läuft bereits auf Port ${PORT}."
  exit 0
fi

exec pnpm dev
