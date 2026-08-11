#!/usr/bin/env python3
"""Upload GbR static pages (with ALL-INKL partner banner) via FTPS."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / "webspace" / "nacht-blau.de"
ENV_FILE = ROOT / ".env.webspace"

FILES = [
    "index.html",
    "index.htm",
    "impressum.html",
    "datenschutz.html",
    "css/style.css",
]


def load_env() -> None:
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


def connect():
    host = os.environ.get("FTP_HOST", "w02176b7.kasserver.com")
    user = os.environ.get("FTP_USER", "")
    password = os.environ.get("FTP_PASS", "")
    use_tls = os.environ.get("FTP_TLS", "1") != "0"
    if not user or not password:
        print(
            "FTP_USER/FTP_PASS fehlen (Environment Secrets oder .env.webspace).",
            file=sys.stderr,
        )
        sys.exit(1)
    if use_tls:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ftp = FTP_TLS(context=ctx)
        ftp.connect(host, 21, timeout=45)
        ftp.login(user, password)
        try:
            ftp.prot_p()
        except Exception:
            pass
    else:
        ftp = FTP()
        ftp.connect(host, 21, timeout=45)
        ftp.login(user, password)
    return ftp


def cwd_makedirs(ftp, remote: str) -> None:
    parts = [p for p in remote.strip("/").split("/") if p]
    ftp.cwd("/")
    for part in parts:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def main() -> None:
    load_env()
    remote_root = os.environ.get("FTP_REMOTE_DIR", "/nacht-blau.de").rstrip("/") or "/"
    if not LOCAL.is_dir():
        print(f"Lokal fehlt: {LOCAL}", file=sys.stderr)
        sys.exit(1)

    ftp = connect()
    uploaded = 0
    try:
        for rel in FILES:
            local_path = LOCAL / rel
            if not local_path.is_file():
                print(f"übersprungen (fehlt): {rel}")
                continue
            remote_dir = str(Path(remote_root) / Path(rel).parent).replace("\\", "/")
            if remote_dir.endswith("/."):
                remote_dir = remote_dir[:-2]
            cwd_makedirs(ftp, remote_dir if remote_dir != "." else remote_root)
            with local_path.open("rb") as fh:
                ftp.storbinary(f"STOR {Path(rel).name}", fh)
            print(f"✓ {rel}")
            uploaded += 1
        print(f"Fertig: {uploaded} Dateien → {remote_root}")
        print("Prüfen: https://nacht-blau.de/")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    main()
