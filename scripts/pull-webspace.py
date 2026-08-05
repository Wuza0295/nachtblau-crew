#!/usr/bin/env python3
"""Pull all (or one) ALL-INKL domain directories into webspace/<domain>/."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (
    FTP_HOST,
    FTP_USER,
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    download_tree,
    remote_domains,
    require_credentials,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Pull webspace domains to local webspace/")
    parser.add_argument(
        "domains",
        nargs="*",
        help="Domain folder names (default: all except logs/cgi-bin)",
    )
    args = parser.parse_args()

    require_credentials()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    total = 0
    try:
        domains = args.domains or remote_domains(ftp)
        print(f"Lade {len(domains)} Domain(s) nach {WEBSPACE_ROOT} …")
        for domain in domains:
            local = WEBSPACE_ROOT / domain
            print(f"\n=== ↓ /{domain} → {local} ===")
            cwd_makedirs(ftp, f"/{domain}")
            n = download_tree(ftp, local)
            print(f"  → {n} Dateien")
            total += n
        print(f"\n✓ Insgesamt {total} Dateien gezogen.")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Pull fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
