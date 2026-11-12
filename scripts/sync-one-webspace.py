#!/usr/bin/env python3
"""Sync a single domain: webspace/<domain>/ ↔ remote /<domain>.

Default domain: nacht-blau.de (GbR profile).
For all domains use: pnpm webspace:sync:all

Hybrixon example (after .env.webspace is loaded):
  python3 scripts/sync-one-webspace.py hybrixon.com --health-check
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
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


def health_check(site: str, expect_engine: str | None, retries: int = 4) -> None:
    """GET https://<site>/api/health and optionally assert engine id."""
    url = f"https://{site}/api/health"
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"Cache-Control": "no-cache", "User-Agent": "hybrixon-sync-health/1"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="replace"))
            ok = bool(data.get("ok"))
            engine = str(data.get("engine") or "")
            php = str(data.get("php") or "")
            print(f"Health: ok={ok} engine={engine} php={php} schema={data.get('schemaVersion')}")
            if not ok:
                raise RuntimeError("health ok=false")
            if expect_engine and engine != expect_engine:
                raise RuntimeError(f"engine mismatch: live={engine!r} expected={expect_engine!r}")
            print(f"✓ Health-Check bestanden → {url}")
            return
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, RuntimeError) as exc:
            last_err = exc
            wait = min(8, 2 ** (attempt - 1))
            print(f"  · Health Versuch {attempt}/{retries} fehlgeschlagen ({exc}); warte {wait}s …")
            time.sleep(wait)
    print(f"Warnung: Health-Check fehlgeschlagen nach {retries} Versuchen: {last_err}", file=sys.stderr)
    sys.exit(2)


def read_local_engine(local: Path) -> str | None:
    cfg = local / "includes" / "config.php"
    if not cfg.is_file():
        return None
    text = cfg.read_text(encoding="utf-8", errors="replace")
    import re

    m = re.search(r"const\s+HYBRIXON_ENGINE\s*=\s*'([^']+)'", text)
    return m.group(1) if m else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync one webspace domain")
    parser.add_argument("domain", nargs="?", help="Domain folder name, e.g. nacht-blau.de")
    parser.add_argument(
        "--health-check",
        action="store_true",
        help="After sync, GET https://<domain>/api/health (Hybrixon)",
    )
    parser.add_argument(
        "--expect-engine",
        default="",
        help="Optional engine id that live health must report (defaults to local HYBRIXON_ENGINE)",
    )
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

    if args.health_check:
        expect = args.expect_engine or read_local_engine(local) or None
        health_check(site, expect)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Synchronisierung fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
