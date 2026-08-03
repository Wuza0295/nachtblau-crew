"""ALL-INKL (kasserver.com) FTP/FTPS helpers – shared by deploy and connect scripts."""

from __future__ import annotations

import os
import ssl
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "public"
ENV_FILE = ROOT / ".env.webspace"


def load_webspace_env() -> None:
    """Load FTP_* variables from .env.webspace if present (not committed)."""
    if not ENV_FILE.is_file():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


load_webspace_env()

FTP_HOST = os.environ.get("FTP_HOST", "w02176b7.kasserver.com")
FTP_USER = os.environ.get("FTP_USER", "")
FTP_PASS = os.environ.get("FTP_PASS", "")
FTP_REMOTE_DIR = os.environ.get("FTP_REMOTE_DIR", "/autictreasures.nacht-blau.de").rstrip("/")
USE_TLS = os.environ.get("FTP_TLS", "1") != "0"

HTACCESS = """Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 7 days"
  ExpiresByType image/jpeg "access plus 7 days"
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
</IfModule>
"""


def require_credentials() -> None:
    import sys

    if FTP_USER and FTP_PASS:
        return
    print(
        "Fehler: FTP_USER und FTP_PASS fehlen.\n\n"
        "Option A – Datei anlegen (lokal, nicht committen):\n"
        "  cp .env.webspace.example .env.webspace\n"
        "  # Zugangsdaten aus ALL-INKL Members Area eintragen\n\n"
        "Option B – Umgebungsvariablen setzen (z. B. Cursor Cloud Environment):\n"
        "  FTP_USER=… FTP_PASS=… FTP_REMOTE_DIR=/autictreasures.nacht-blau.de\n\n"
        f"Host (ALL-INKL): {FTP_HOST}",
        file=sys.stderr,
    )
    sys.exit(1)


def connect_ftp():
    if USE_TLS:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ftp = FTP_TLS(context=ctx)
        ftp.connect(FTP_HOST, 21, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        try:
            ftp.prot_p()
        except error_perm:
            pass
        return ftp
    ftp = FTP()
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    return ftp


def cwd_makedirs(ftp, path: str) -> None:
    ftp.cwd("/")
    parts = [p for p in path.strip("/").split("/") if p]
    for part in parts:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def list_dir(ftp, max_entries: int = 50) -> list[str]:
    names: list[str] = []
    ftp.retrlines("LIST", names.append)
    return names[:max_entries]
