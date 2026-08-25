#!/usr/bin/env python3
"""Upload only Hybrixon CSS to ALL-INKL FTPS (assets/css/style.css)."""

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


CSS_REL = Path("assets/css/style.css")
DOMAIN = "hybrixon.com"


def main() -> None:
    require_credentials()
    local = WEBSPACE_ROOT / DOMAIN / CSS_REL
    if not local.is_file():
        print(f"Fehler: Datei fehlt: {local}", file=sys.stderr)
        sys.exit(1)

    remote_dir = f"/{DOMAIN}/assets/css"
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, remote_dir)
        print(f"  ↑ /{DOMAIN}/{CSS_REL} ({local.stat().st_size} bytes)")
        with local.open("rb") as fh:
            ftp.storbinary(f"STOR {CSS_REL.name}", fh)
        print(f"✓ CSS deployed → https://{DOMAIN}/assets/css/style.css")
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
