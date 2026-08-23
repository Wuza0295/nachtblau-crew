#!/usr/bin/env bash
# Deploy SPA build (dist/public) to ALL-INKL via lftp FTPS.
# Prefer: pnpm deploy:webspace (Python). This script needs `lftp` installed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${ROOT}/dist/public"

# shellcheck disable=SC1091
if [[ -f "${ROOT}/.env.webspace" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ROOT}/.env.webspace"
  set +a
fi

FTP_HOST="${FTP_HOST:-w02176b7.kasserver.com}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/nacht-blau.de}"

if [[ -z "${FTP_USER}" || -z "${FTP_PASS}" ]]; then
  echo "Fehler: FTP_USER und FTP_PASS müssen gesetzt sein."
  echo "  cp .env.webspace.example .env.webspace  # und Zugangsdaten eintragen"
  exit 1
fi

if [[ ! -d "${DIST}" ]]; then
  echo "Build fehlt – starte pnpm build …"
  (cd "${ROOT}" && pnpm build)
fi

if [[ ! -f "${DIST}/.htaccess" ]]; then
  cp "${ROOT}/client/public/.htaccess" "${DIST}/.htaccess" 2>/dev/null || true
fi

echo "→ Upload nach ${FTP_HOST}:${FTP_REMOTE_DIR}"
echo "  Quelle: ${DIST}"

lftp -u "${FTP_USER},${FTP_PASS}" "ftps://${FTP_HOST}" <<EOF
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate no
set net:max-retries 3
set net:timeout 20
mkdir -p ${FTP_REMOTE_DIR}
cd ${FTP_REMOTE_DIR}
mirror -R --delete --verbose --parallel=4 ${DIST}/ .
bye
EOF

echo "✓ Upload fertig."
echo "Prüfen: https://nacht-blau.de/"
