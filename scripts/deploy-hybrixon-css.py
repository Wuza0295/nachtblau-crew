#!/usr/bin/env python3
"""Upload Hybrixon static assets to ALL-INKL FTPS (CSS + JS)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (  # noqa: E402
    FTP_HOST,
    FTP_USER,
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    require_credentials,
)


DOMAIN = "hybrixon.com"
ASSETS: tuple[Path, ...] = (
    Path("assets/css/style.css"),
    Path("assets/js/app.js"),
)


def main() -> None:
    require_credentials()
    root = WEBSPACE_ROOT / DOMAIN
    missing = [rel for rel in ASSETS if not (root / rel).is_file()]
    if missing:
        print(f"Fehler: fehlende Dateien: {', '.join(str(p) for p in missing)}", file=sys.stderr)
        sys.exit(1)

    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        for rel in ASSETS:
            local = root / rel
            remote_dir = f"/{DOMAIN}/{rel.parent.as_posix()}"
            cwd_makedirs(ftp, remote_dir)
            print(f"  ↑ /{DOMAIN}/{rel} ({local.stat().st_size} bytes)")
            with local.open("rb") as fh:
                ftp.storbinary(f"STOR {rel.name}", fh)
        print(f"✓ Assets deployed → https://{DOMAIN}/")
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
