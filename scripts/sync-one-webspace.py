#!/usr/bin/env python3
"""Sync a single domain: webspace/<domain>/ ↔ remote /<domain>.

Default domain: nacht-blau.de (GbR profile).
For all domains use: pnpm webspace:sync:all
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (
    FTP_HOST,
    FTP_REMOTE_DIR,
    FTP_USER,
    WEBSPACE_DIR,
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    mirror_index_htm,
    require_credentials,
    upload_tree,
)


def resolve_local_and_remote(domain: str | None) -> tuple[Path, str]:
    if domain:
        return WEBSPACE_ROOT / domain, f"/{domain}"
    # Legacy: FTP_REMOTE_DIR or nacht-blau.de
    remote = FTP_REMOTE_DIR or "/nacht-blau.de"
    name = remote.strip("/").split("/")[-1]
    local = WEBSPACE_ROOT / name
    if not local.is_dir() and WEBSPACE_DIR.is_dir():
        local = WEBSPACE_DIR
    return local, remote


def ensure_local(local: Path) -> None:
    if not local.is_dir() or not any(local.iterdir()):
        print(f"Fehler: lokales Verzeichnis fehlt oder ist leer: {local}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync one webspace domain")
    parser.add_argument("domain", nargs="?", help="Domain folder name, e.g. nacht-blau.de")
    args = parser.parse_args()

    require_credentials()
    local, remote = resolve_local_and_remote(args.domain)
    ensure_local(local)

    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, remote or "/")
        print(f"Synchronisiere {local} → {remote or '/'} …")
        n = upload_tree(ftp, local)
        n += mirror_index_htm(ftp, local)
        print(f"✓ {n} Dateien synchronisiert.")
        site = remote.strip("/").split("/")[-1] if remote else "nacht-blau.de"
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
