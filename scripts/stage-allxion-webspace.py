#!/usr/bin/env python3
"""Copy Vite build (dist/public) into webspace/nacht-blau.de/allxion/."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "public"
TARGET = ROOT / "webspace" / "nacht-blau.de" / "allxion"
HTACCESS = TARGET / ".htaccess"
HTACCESS_SRC = """Options -MultiViews
RewriteEngine On
RewriteBase /allxion/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
"""


def main() -> None:
    if not DIST.is_dir() or not any(DIST.iterdir()):
        print("Fehler: dist/public fehlt. Zuerst: pnpm build:allxion", file=sys.stderr)
        sys.exit(1)

    keep = {".htaccess", ".gitkeep", "README.md", "index.stub.html", "release.json"}
    if TARGET.exists():
        for child in TARGET.iterdir():
            if child.name in keep:
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    else:
        TARGET.mkdir(parents=True)

    for item in DIST.iterdir():
        dest = TARGET / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)

    HTACCESS.write_text(HTACCESS_SRC, encoding="utf-8")
    print(f"✓ Allxion nach {TARGET.relative_to(ROOT)} kopiert")
    print("  Live-URL: https://nacht-blau.de/allxion/")


if __name__ == "__main__":
    main()
