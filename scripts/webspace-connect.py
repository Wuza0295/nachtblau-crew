#!/usr/bin/env python3
"""Test FTPS login to ALL-INKL and list the configured remote directory."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (
    FTP_HOST,
    FTP_REMOTE_DIR,
    FTP_USER,
    connect_ftp,
    cwd_makedirs,
    list_dir,
    require_credentials,
)


def main() -> None:
    require_credentials()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        print("✓ Login erfolgreich (FTPS).")
        print("\nStammverzeichnis:")
        for line in list_dir(ftp):
            print(f"  {line}")
        if FTP_REMOTE_DIR:
            cwd_makedirs(ftp, FTP_REMOTE_DIR)
            pwd = ftp.pwd()
            print(f"\nZielverzeichnis {FTP_REMOTE_DIR} (pwd: {pwd}):")
            for line in list_dir(ftp):
                print(f"  {line}")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Verbindung fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
