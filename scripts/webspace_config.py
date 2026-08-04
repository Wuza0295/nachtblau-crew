"""ALL-INKL (kasserver.com) FTP/FTPS helpers – shared by sync/deploy/connect."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Static GbR site (source of truth for https://nacht-blau.de)
WEBSPACE_DIR = ROOT / "webspace"
# React SPA build output (optional deploy to a subdomain)
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
FTP_REMOTE_DIR = os.environ.get("FTP_REMOTE_DIR", "/nacht-blau.de").rstrip("/")
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
    if FTP_USER and FTP_PASS:
        return
    print(
        "Fehler: FTP_USER und FTP_PASS fehlen.\n\n"
        "Option A – Datei anlegen (lokal, nicht committen):\n"
        "  cp .env.webspace.example .env.webspace\n"
        "  # Zugangsdaten aus ALL-INKL Members Area → Passwörter / FTP-Accounts\n\n"
        "Option B – Umgebungsvariablen (z. B. Cursor Cloud Environment Secrets):\n"
        "  FTP_USER=… FTP_PASS=… FTP_REMOTE_DIR=/nacht-blau.de\n\n"
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


def upload_tree(ftp, local: Path, remote_prefix: str = "") -> int:
    """Recursively upload local directory contents into the current FTP cwd."""
    count = 0
    for item in sorted(local.iterdir()):
        if item.name.startswith(".") and item.name not in {".htaccess"}:
            continue
        remote_name = f"{remote_prefix}/{item.name}" if remote_prefix else item.name
        if item.is_dir():
            try:
                ftp.mkd(item.name)
            except error_perm:
                pass
            ftp.cwd(item.name)
            count += upload_tree(ftp, item, remote_name)
            ftp.cwd("..")
        else:
            print(f"  ↑ {remote_name}")
            with item.open("rb") as fh:
                ftp.storbinary(f"STOR {item.name}", fh)
            count += 1
    return count


def mirror_index_htm(ftp, local_dir: Path) -> int:
    """ALL-INKL DirectoryIndex often prefers index.htm – mirror index.html."""
    index_html = local_dir / "index.html"
    if not index_html.exists():
        return 0
    with index_html.open("rb") as fh:
        ftp.storbinary("STOR index.htm", fh)
    print("  ↑ index.htm (mirror of index.html)")
    return 1
