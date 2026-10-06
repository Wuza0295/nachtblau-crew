#!/usr/bin/env python3
"""Upload Hybrixon static assets to ALL-INKL FTPS (CSS + JS).

After upload, verifies that https://hybrixon.com/ serves the same app.js bytes
(CSRF fix). If the live site still serves an older copy, the KAS/FTP login likely
does not own the hybrixon.com document root (only a stray /hybrixon.com/assets tree).
"""

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


def fetch_live_app_js_sha() -> tuple[str, int]:
    url = f"https://{DOMAIN}/assets/js/app.js?deploy-check=1"
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
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
        js_local = root / "assets/js/app.js"
        local_sha = sha256_file(js_local)
        try:
            live_sha, live_len = fetch_live_app_js_sha()
        except Exception as exc:
            print(
                f"Warnung: Live-Check für app.js fehlgeschlagen ({exc}).",
                file=sys.stderr,
            )
            return
        if live_sha != local_sha:
            print(
                f"Warnung: Live app.js weicht ab (lokal sha256={local_sha[:16]}…, "
                f"live sha256={live_sha[:16]}…, live {live_len} bytes).\n"
                f"Dieser FTP-Account liefert vermutlich nicht den Document Root von "
                f"https://{DOMAIN}/ — bitte Hybrixon-KAS/FTP-Zugang prüfen.",
                file=sys.stderr,
            )
            sys.exit(2)
        print("✓ Live app.js stimmt mit dem Upload überein (CSRF-Fix aktiv).")
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
