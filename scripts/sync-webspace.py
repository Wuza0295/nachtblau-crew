#!/usr/bin/env python3
"""Sync local webspace/ directory to ALL-INKL FTPS (https://nacht-blau.de)."""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `python3 scripts/sync-webspace.py` without installing a package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (
    FTP_HOST,
    FTP_REMOTE_DIR,
    FTP_USER,
    WEBSPACE_DIR,
    connect_ftp,
    cwd_makedirs,
    mirror_index_htm,
    require_credentials,
    upload_tree,
)


def ensure_local() -> None:
    if not WEBSPACE_DIR.is_dir() or not any(WEBSPACE_DIR.iterdir()):
        print(
            f"Fehler: lokales Verzeichnis fehlt oder ist leer: {WEBSPACE_DIR}",
            file=sys.stderr,
        )
        sys.exit(1)
    if not (WEBSPACE_DIR / "index.html").is_file():
        print("Fehler: webspace/index.html fehlt.", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    require_credentials()
    ensure_local()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, FTP_REMOTE_DIR or "/")
        print(f"Synchronisiere {WEBSPACE_DIR} → {FTP_REMOTE_DIR or '/'} …")
        n = upload_tree(ftp, WEBSPACE_DIR)
        n += mirror_index_htm(ftp, WEBSPACE_DIR)
        print(f"✓ {n} Dateien synchronisiert.")
        site = FTP_REMOTE_DIR.strip("/").split("/")[-1] if FTP_REMOTE_DIR else "nacht-blau.de"
        print(f"Prüfen: https://{site}/")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Synchronisierung fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
