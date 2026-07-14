#!/usr/bin/env bash
# Deploy Autic Treasures static build to ALL-INKL webspace via FTP/FTPS
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${ROOT}/dist/public"

FTP_HOST="${FTP_HOST:-w02176b7.kasserver.com}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/autic.nacht-blau.de}"

if [[ -z "${FTP_USER}" || -z "${FTP_PASS}" ]]; then
  echo "Fehler: FTP_USER und FTP_PASS müssen gesetzt sein."
  echo ""
  echo "Beispiel:"
  echo "  FTP_USER=dein_login FTP_PASS='geheim' FTP_REMOTE_DIR=/autic.nacht-blau.de pnpm deploy:webspace"
  echo ""
  echo "ALL-INKL Tipp: Host ist meist w02176b7.kasserver.com"
  echo "Passwort findest du in der Members Area → Passwörter / FTP-Accounts."
  exit 1
fi

if [[ ! -d "${DIST}" ]]; then
  echo "Build fehlt – starte pnpm build …"
  (cd "${ROOT}" && pnpm build)
fi

# Ensure SPA rewrite is present
if [[ ! -f "${DIST}/.htaccess" ]]; then
  cat > "${DIST}/.htaccess" <<'HTACCESS'
Options -MultiViews
RewriteEngine On
RewriteBase /
# Don't rewrite real files/folders
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
# SPA fallback
RewriteRule ^ index.html [L]
# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 7 days"
  ExpiresByType image/jpeg "access plus 7 days"
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
</IfModule>
HTACCESS
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
echo "Prüfen: http://autic.nacht-blau.de/"
