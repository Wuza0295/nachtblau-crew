#!/usr/bin/env python3
"""Deploy dist/public to ALL-INKL via FTPS/FTP."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "public"
ENV_FILE = ROOT / ".env.webspace"


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


load_env_file()

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
"""


def ensure_build() -> None:
    if not DIST.exists() or not any(DIST.iterdir()):
        print("Build fehlt – bitte zuerst `pnpm build` ausführen.", file=sys.stderr)
        sys.exit(1)
    ht = DIST / ".htaccess"
    if not ht.exists():
        ht.write_text(HTACCESS)


def connect():
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


def upload_tree(ftp, local: Path, remote_prefix: str = "") -> int:
    count = 0
    for item in sorted(local.iterdir()):
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


def main() -> None:
    if not FTP_USER or not FTP_PASS:
        print(
            "Fehler: FTP_USER und FTP_PASS fehlen.\n\n"
            "Beispiel:\n"
            "  FTP_USER=wxxxxxx FTP_PASS='…' FTP_REMOTE_DIR=/autictreasures.nacht-blau.de "
            "python3 scripts/deploy-webspace.py\n\n"
            f"Host-Vorschlag für nacht-blau.de: {FTP_HOST}",
            file=sys.stderr,
        )
        sys.exit(1)

    ensure_build()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect()
    try:
        cwd_makedirs(ftp, FTP_REMOTE_DIR or "/")
        print(f"Upload nach {FTP_REMOTE_DIR or '/'} …")
        n = upload_tree(ftp, DIST)
        # ALL-INKL DirectoryIndex prefers index.htm over index.html – remove/overwrite placeholder
        index_html = DIST / "index.html"
        if index_html.exists():
            with index_html.open("rb") as fh:
                ftp.storbinary("STOR index.htm", fh)
            n += 1
            print("  ↑ index.htm (mirror of index.html)")
        print(f"✓ {n} Dateien hochgeladen.")
        print("Öffne: http://autictreasures.nacht-blau.de/")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    main()
