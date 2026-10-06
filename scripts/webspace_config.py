"""ALL-INKL (kasserver.com) FTP/FTPS helpers – shared by sync/deploy/connect."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Per-domain mirrors live under webspace/<domain>/
WEBSPACE_ROOT = ROOT / "webspace"
# Convenience alias: GbR profile site
WEBSPACE_DIR = WEBSPACE_ROOT / "nacht-blau.de"
# React SPA build output (optional deploy to a subdomain)
DIST = ROOT / "dist" / "public"
ENV_FILE = ROOT / ".env.webspace"

# Domains / dirs to skip when syncing the whole account
SKIP_DIRS = {"logs", "cgi-bin", ".", ".."}

# Paths (relative segment names) skipped during pull/push of large or sensitive data
SKIP_NAME_PARTS = {
    "vendor",
    "node_modules",
    "__pycache__",
    ".git",
    "tmp",
    "logs",
    "uploads",
    "storage",
}


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
        ftp.set_pasv(True)
        ftp.sock.settimeout(45)
        return ftp
    ftp = FTP()
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    ftp.sock.settimeout(45)
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


def list_entries(ftp) -> list[tuple[str, bool]]:
    """Return [(name, is_dir), ...] for the current FTP directory."""
    entries: list[tuple[str, bool]] = []
    lines: list[str] = []
    ftp.retrlines("LIST", lines.append)
    for line in lines:
        parts = line.split(None, 8)
        if len(parts) < 9:
            continue
        name = parts[8]
        if name in {".", ".."}:
            continue
        is_dir = line.startswith("d")
        entries.append((name, is_dir))
    return entries


def remote_domains(ftp) -> list[str]:
    ftp.cwd("/")
    domains = []
    for name, is_dir in list_entries(ftp):
        if is_dir and name not in SKIP_DIRS:
            domains.append(name)
    return sorted(domains)


def should_skip_name(name: str) -> bool:
    if name in SKIP_NAME_PARTS:
        return True
    if name.endswith(".zip"):
        return True
    if name.startswith(".env") and name != ".env.example":
        return True
    return False


def upload_tree(ftp, local: Path, remote_prefix: str = "") -> int:
    """Recursively upload local directory contents into the current FTP cwd."""
    count = 0
    for item in sorted(local.iterdir()):
        if should_skip_name(item.name):
            print(f"  · skip {remote_prefix + '/' if remote_prefix else ''}{item.name}")
            continue
        if item.name.startswith(".") and item.name not in {".htaccess", ".gitignore", ".htaccess.passenger"}:
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
            print(f"  ↑ {remote_name}", flush=True)
            with item.open("rb") as fh:
                ftp.storbinary(f"STOR {item.name}", fh, blocksize=64 * 1024)
            count += 1
    return count


# Skip re-downloading / hanging on very large binaries during bulk pull
MAX_PULL_BYTES = int(os.environ.get("FTP_MAX_PULL_BYTES", str(8 * 1024 * 1024)))


def _remote_size(ftp, name: str) -> int | None:
    try:
        return ftp.size(name)
    except Exception:
        return None


def download_tree(ftp, local: Path, remote_prefix: str = "") -> int:
    """Recursively download current FTP cwd into local directory."""
    local.mkdir(parents=True, exist_ok=True)
    count = 0
    for name, is_dir in list_entries(ftp):
        if should_skip_name(name):
            print(f"  · skip {remote_prefix + '/' if remote_prefix else ''}{name}")
            continue
        remote_name = f"{remote_prefix}/{name}" if remote_prefix else name
        target = local / name
        if is_dir:
            ftp.cwd(name)
            count += download_tree(ftp, target, remote_name)
            ftp.cwd("..")
            continue

        size = _remote_size(ftp, name)
        if size is not None and size > MAX_PULL_BYTES:
            print(f"  · skip large {remote_name} ({size} bytes)")
            continue
        if target.is_file() and size is not None and target.stat().st_size == size:
            print(f"  = keep {remote_name}")
            count += 1
            continue

        print(f"  ↓ {remote_name}", flush=True)
        try:
            with target.open("wb") as fh:
                ftp.retrbinary(f"RETR {name}", fh.write, blocksize=64 * 1024)
            count += 1
        except Exception as exc:
            print(f"  ! fail {remote_name}: {exc}", flush=True)
            if target.exists() and target.stat().st_size == 0:
                target.unlink(missing_ok=True)
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
