#!/usr/bin/env python3
"""Copy Vite build (dist/public) into webspace/nacht-blau.de/allxion/."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "public"
TARGET = ROOT / "webspace" / "nacht-blau.de" / "allxion"
HTACCESS = """Options -MultiViews
RewriteEngine On
RewriteBase /allxion/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
"""


def sync_tree(src: Path, dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        target = dest / item.name
        if item.is_dir():
            sync_tree(item, target)
        else:
            shutil.copy2(item, target)
    for stale in dest.iterdir():
        if stale.name not in {p.name for p in src.iterdir()}:
            if stale.is_dir():
                shutil.rmtree(stale)
            else:
                stale.unlink()


def main() -> None:
    if not DIST.is_dir() or not any(DIST.iterdir()):
        print("Build fehlt – führe `pnpm build` aus.", file=sys.stderr)
        sys.exit(1)

    sync_tree(DIST, TARGET)
    (TARGET / ".htaccess").write_text(HTACCESS, encoding="utf-8")
    index = TARGET / "index.html"
    if index.is_file():
        shutil.copy2(index, TARGET / "index.htm")

    n = sum(1 for _ in TARGET.rglob("*") if _.is_file())
    print(f"✓ Allxion nach {TARGET} ({n} Dateien).")
    print("Upload: pnpm webspace:sync:one nacht-blau.de")


if __name__ == "__main__":
    main()
