#!/usr/bin/env python3
"""Upload all local webspace/<domain>/ trees back to ALL-INKL."""

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
    mirror_index_htm,
    remote_domains,
    require_credentials,
    upload_tree,
)


def local_domains() -> list[str]:
    if not WEBSPACE_ROOT.is_dir():
        return []
    return sorted(
        p.name
        for p in WEBSPACE_ROOT.iterdir()
        if p.is_dir() and not p.name.startswith(".")
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync all local webspace/<domain>/ to FTPS")
    parser.add_argument(
        "domains",
        nargs="*",
        help="Domain folder names (default: all local webspace/* dirs)",
    )
    args = parser.parse_args()

    require_credentials()
    domains = args.domains or local_domains()
    if not domains:
        print(f"Keine lokalen Domains unter {WEBSPACE_ROOT}", file=sys.stderr)
        sys.exit(1)

    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …", flush=True)
    total = 0
    existing: set[str] | None = None
    for domain in domains:
        local = WEBSPACE_ROOT / domain
        if not local.is_dir() or not any(local.iterdir()):
            print(f"\n· überspringe {domain} (lokal leer)", flush=True)
            continue

        # Fresh connection per domain – avoids long-lived FTPS stalls
        ftp = connect_ftp()
        try:
            if existing is None:
                existing = set(remote_domains(ftp))
            if domain not in existing and not args.domains:
                print(f"\n· überspringe {domain} (nicht auf dem Webspace)", flush=True)
                continue
            print(f"\n=== ↑ {local} → /{domain} ===", flush=True)
            cwd_makedirs(ftp, f"/{domain}")
            n = upload_tree(ftp, local)
            if (local / "index.html").exists():
                n += mirror_index_htm(ftp, local)
            print(f"  → {n} Dateien", flush=True)
            total += n
        except Exception as exc:
            print(f"  ! Fehler bei {domain}: {exc}", flush=True)
        finally:
            try:
                ftp.quit()
            except Exception:
                try:
                    ftp.close()
                except Exception:
                    pass
    print(f"\n✓ Insgesamt {total} Dateien synchronisiert.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Sync-all fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
