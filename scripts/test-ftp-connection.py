#!/usr/bin/env python3
"""Test ALL-INKL FTPS connection using env vars or .env.webspace in project root."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.webspace"


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'\"")
        os.environ.setdefault(key, value)


def main() -> None:
    load_env_file()
    host = os.environ.get("FTP_HOST", "w02176b7.kasserver.com")
    user = os.environ.get("FTP_USER", "")
    password = os.environ.get("FTP_PASS", "")
    remote = os.environ.get("FTP_REMOTE_DIR", "/autictreasures.nacht-blau.de")

    if not user or not password:
        print("FEHLER: FTP_USER und FTP_PASS fehlen (.env.webspace oder Umgebung).", file=sys.stderr)
        sys.exit(1)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ftp = FTP_TLS(context=ctx)
    print(f"Verbinde mit {host} als {user} …")
    ftp.connect(host, 21, timeout=30)
    ftp.login(user, password)
    try:
        ftp.prot_p()
    except error_perm:
        pass
    pwd = ftp.pwd()
    print(f"Login OK — aktuelles Verzeichnis: {pwd}")

    parts = [p for p in remote.strip("/").split("/") if p]
    ftp.cwd("/")
    for part in parts:
        try:
            ftp.cwd(part)
        except error_perm:
            print(f"WARN: Unterordner /{part} nicht erreichbar von {ftp.pwd()}")
            break
    listing = []
    ftp.retrlines("LIST", listing.append)
    print(f"Remote {remote}: {len(listing)} Einträge (erste 5):")
    for line in listing[:5]:
        print(f"  {line}")
    ftp.quit()
    print("FTPS-Verbindung erfolgreich.")


if __name__ == "__main__":
    main()
