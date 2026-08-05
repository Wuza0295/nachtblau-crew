#!/usr/bin/env python3
"""Ensure NachtBlau Hub Web / Linux / Android stay in sync, optionally push to ALL-INKL."""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (  # noqa: E402
    FTP_HOST,
    FTP_USER,
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    require_credentials,
    upload_tree,
)

DOMAIN = "launcher.nachtblau-interactive.com"
HUB = WEBSPACE_ROOT / DOMAIN

REQUIRED = [
    "index.html",
    "linux.html",
    "android.html",
    "site-bridge.js",
    "linux-bridge.js",
    "android-bridge.js",
    "styles-web.css",
    "styles-linux.css",
    "styles-android.css",
    "app.js",
    "config/games.json",
    "PLATFORMS.md",
]


def verify() -> list[str]:
    errors: list[str] = []
    if not HUB.is_dir():
        return [f"Hub fehlt: {HUB} (zuerst: pnpm webspace:pull {DOMAIN})"]

    for rel in REQUIRED:
        if not (HUB / rel).is_file():
            errors.append(f"fehlt: {rel}")

    cfg = json.loads((HUB / "config" / "games.json").read_text(encoding="utf-8"))
    games = cfg.get("games") or []
    if not games:
        errors.append("config/games.json hat keine Spiele")

    for g in games:
        if g.get("type") != "game":
            continue
        web = (g.get("web") or {}).get("playUrl")
        for plat in ("linux", "android"):
            url = (g.get(plat) or {}).get("playUrl")
            if web and not url:
                errors.append(f"{g['id']}: {plat}.playUrl fehlt (web={web})")
            elif web and url and url != web:
                # allow divergence but warn
                print(f"  · Hinweis {g['id']}: {plat}.playUrl weicht von web ab")

    # Platform HTML must point at matching bridge/styles
    for plat in ("linux", "android"):
        html = (HUB / f"{plat}.html").read_text(encoding="utf-8")
        if f'class="platform-{plat}"' not in html:
            errors.append(f"{plat}.html: body class platform-{plat} fehlt")
        if f"{plat}-bridge.js" not in html:
            errors.append(f"{plat}.html: {plat}-bridge.js fehlt")
        if f"styles-{plat}.css" not in html:
            errors.append(f"{plat}.html: styles-{plat}.css fehlt")

    return errors


def rebuild_zip() -> Path:
    zip_path = HUB / "launcher.nachtblau-interactive.com.zip"
    skip = {"launcher.nachtblau-interactive.com.zip", ".DS_Store", "games.local.json"}
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(HUB.rglob("*")):
            if not path.is_file() or path.name in skip:
                continue
            zf.write(path, path.relative_to(HUB).as_posix())
    print(f"✓ Zip: {zip_path} ({zip_path.stat().st_size} bytes)")
    return zip_path


def push(include_zip: bool = True) -> None:
    require_credentials()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, f"/{DOMAIN}")
        # upload_tree skips .zip by design — push content first
        n = upload_tree(ftp, HUB)
        print(f"  → {n} Dateien hochgeladen")
        if include_zip:
            zip_path = HUB / "launcher.nachtblau-interactive.com.zip"
            if zip_path.is_file():
                ftp.voidcmd("TYPE I")
                with zip_path.open("rb") as fh:
                    ftp.storbinary(
                        "STOR launcher.nachtblau-interactive.com.zip",
                        fh,
                        blocksize=64 * 1024,
                    )
                print("  ↑ launcher.nachtblau-interactive.com.zip")
        # mirror index.htm
        index_html = HUB / "index.html"
        if index_html.is_file():
            with index_html.open("rb") as fh:
                ftp.storbinary("STOR index.htm", fh)
            print("  ↑ index.htm")
        for plat in ("linux", "android"):
            src = HUB / f"{plat}.html"
            if src.is_file():
                with src.open("rb") as fh:
                    ftp.storbinary(f"STOR {plat}.htm", fh)
                print(f"  ↑ {plat}.htm")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync Hub platforms Web/Linux/Android")
    parser.add_argument("--push", action="store_true", help="Nach ALL-INKL hochladen")
    parser.add_argument("--zip", action="store_true", help="Distributions-Zip neu bauen")
    parser.add_argument("--no-zip-upload", action="store_true")
    args = parser.parse_args()

    errors = verify()
    if errors:
        print("Verify fehlgeschlagen:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)
    print(f"✓ Hub-Parität OK ({HUB})")

    if args.zip or args.push:
        rebuild_zip()

    if args.push:
        push(include_zip=not args.no_zip_upload)
        print("✓ Webspace Sync abgeschlossen (Web = Linux = Android Katalog)")


if __name__ == "__main__":
    main()
