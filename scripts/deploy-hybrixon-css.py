#!/usr/bin/env python3
"""Upload Hybrixon static assets to ALL-INKL FTPS and verify both live files."""

from __future__ import annotations

import hashlib
import sys
import urllib.request
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


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_live_asset_sha(rel: Path, local_sha: str) -> tuple[str, int]:
    url = f"https://{DOMAIN}/{rel.as_posix()}?deploy-check={local_sha}"
    req = urllib.request.Request(
        url,
        headers={"Cache-Control": "no-cache, no-store", "Pragma": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    return hashlib.sha256(data).hexdigest(), len(data)


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
        for rel in ASSETS:
            local_sha = sha256_file(root / rel)
            try:
                live_sha, live_len = fetch_live_asset_sha(rel, local_sha)
            except Exception as exc:
                print(f"Fehler: Live-Prüfung für {rel} fehlgeschlagen ({exc}).", file=sys.stderr)
                sys.exit(2)
            if live_sha != local_sha:
                print(
                    f"Fehler: Live-Datei {rel} weicht ab "
                    f"(lokal sha256={local_sha[:16]}…, live sha256={live_sha[:16]}…, "
                    f"live {live_len} bytes). Falscher Document Root oder CDN-Cache.",
                    file=sys.stderr,
                )
                sys.exit(2)
            print(f"✓ Live-Datei {rel} stimmt bytegenau mit dem Upload überein.")
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
