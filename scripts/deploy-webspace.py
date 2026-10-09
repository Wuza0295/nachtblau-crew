#!/usr/bin/env python3
"""Deploy dist/public (SPA build) to ALL-INKL via FTPS/FTP."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (
    DIST,
    FTP_HOST,
    FTP_REMOTE_DIR,
    FTP_USER,
    HTACCESS,
    connect_ftp,
    cwd_makedirs,
    mirror_index_htm,
    require_credentials,
    upload_tree,
)


def ensure_build() -> None:
    if not DIST.exists() or not any(DIST.iterdir()):
        print("Build fehlt – bitte zuerst `pnpm build` ausführen.", file=sys.stderr)
        sys.exit(1)
    ht = DIST / ".htaccess"
    if not ht.exists():
        ht.write_text(HTACCESS)


def main() -> None:
    require_credentials()
    ensure_build()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, FTP_REMOTE_DIR or "/")
        print(f"Upload nach {FTP_REMOTE_DIR or '/'} …")
        n = upload_tree(ftp, DIST)
        n += mirror_index_htm(ftp, DIST)
        print(f"✓ {n} Dateien hochgeladen.")
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
        print(f"Deploy fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
