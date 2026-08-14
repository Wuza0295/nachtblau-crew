#!/usr/bin/env python3
"""Installiert das ALL-INKL-Backup-System nach /nacht-blau.de/backup via FTPS."""

from __future__ import annotations

import os
import secrets
import ssl
import sys
from ftplib import FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / "webspace-backup"
ENV_FILE = ROOT / ".env.webspace"
REMOTE_DIR = "/nacht-blau.de/backup"
SKIP_UPLOAD_NAMES = {"archiv", "config.example.php", "backup.log"}


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


def require_credentials() -> tuple[str, str, str]:
    host = os.environ.get("FTP_HOST", "w02176b7.kasserver.com")
    user = os.environ.get("FTP_USER", "")
    password = os.environ.get("FTP_PASS", "")
    if not user or not password:
        print(
            "Fehler: FTP_USER und FTP_PASS fehlen.\n"
            "cp .env.webspace.example .env.webspace  # oder Cloud-Secrets setzen",
            file=sys.stderr,
        )
        sys.exit(1)
    return host, user, password


def connect(host: str, user: str, password: str) -> FTP_TLS:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ftp = FTP_TLS(context=ctx)
    ftp.connect(host, 21, timeout=30)
    ftp.login(user, password)
    try:
        ftp.prot_p()
    except error_perm:
        pass
    ftp.set_pasv(True)
    ftp.sock.settimeout(60)
    return ftp


def cwd_makedirs(ftp: FTP_TLS, path: str) -> None:
    ftp.cwd("/")
    for part in [p for p in path.strip("/").split("/") if p]:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def token_from_config(text: str) -> str:
    for line in text.splitlines():
        if "'token'" in line and "=>" in line:
            return line.split("=>", 1)[1].strip().strip(",").strip("'").strip('"')
    return ""


def ensure_local_config() -> str:
    config = KIT / "config.php"
    if config.is_file():
        text = config.read_text(encoding="utf-8")
        token = token_from_config(text)
        if token and token != "CHANGE_ME":
            return token
    token = secrets.token_urlsafe(32)
    config.write_text(
        "<?php\ndeclare(strict_types=1);\nreturn [\n"
        f"    'token' => {token!r},\n"
        "    'keep' => 7,\n"
        "    'home' => '',\n"
        "    'skip_roots' => ['backup', 'logs', 'cgi-bin', 'tmp', 'mail', '.ssh', '.php'],\n"
        "    'ignore_names' => ['node_modules', '.git', '__pycache__', 'cgi-bin', 'logs', 'tmp', 'backup', 'archiv'],\n"
        "    'databases' => [],\n"
        "];\n",
        encoding="utf-8",
    )
    return token


def upload_tree(ftp: FTP_TLS) -> int:
    count = 0
    for item in sorted(KIT.iterdir()):
        if item.name in SKIP_UPLOAD_NAMES:
            continue
        if item.name.startswith(".") and item.name != ".htaccess":
            continue
        if item.is_dir():
            continue
        print(f"  ↑ {item.name}", flush=True)
        with item.open("rb") as fh:
            ftp.storbinary(f"STOR {item.name}", fh)
        count += 1
    try:
        ftp.mkd("archiv")
    except error_perm:
        pass
    ftp.cwd("archiv")
    htaccess = KIT / "archiv" / ".htaccess"
    if htaccess.is_file():
        with htaccess.open("rb") as fh:
            ftp.storbinary("STOR .htaccess", fh)
        count += 1
        print("  ↑ archiv/.htaccess", flush=True)
    ftp.cwd("..")
    return count


def main() -> None:
    load_env()
    host, user, password = require_credentials()
    token = ensure_local_config()
    print(f"Verbinde mit {host} …")
    ftp = connect(host, user, password)
    try:
        cwd_makedirs(ftp, REMOTE_DIR)
        uploaded = upload_tree(ftp)
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()
    print(f"✓ {uploaded} Dateien nach {REMOTE_DIR}")
    print("KAS-Cronjob (täglich empfohlen):")
    print(f"  https://nacht-blau.de/backup/run.phpx?token={token}")
    print("Status:")
    print(f"  https://nacht-blau.de/backup/index.php?token={token}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Deploy fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
