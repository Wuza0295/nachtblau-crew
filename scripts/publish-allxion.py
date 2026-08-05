#!/usr/bin/env python3
"""Copy Vite build (dist/public) into webspace/nacht-blau.de/allxion/ for FTPS sync."""

from __future__ import annotations

import json
import re
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

ALLXION_MANIFEST = {
    "name": "NachtBlau Crew · Allxion",
    "short_name": "Allxion",
    "description": "Allxion – Hybrid-Social-Hub plus NachtBlau Crew Gaming Community.",
    "start_url": "/allxion/",
    "scope": "/allxion/",
    "display": "standalone",
    "background_color": "#0a0e1a",
    "theme_color": "#0a0e1a",
    "lang": "de",
    "icons": [
        {
            "src": "https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp",
            "sizes": "512x512",
            "type": "image/webp",
        }
    ],
}


def main() -> None:
    if not DIST.is_dir() or not any(DIST.iterdir()):
        print("Fehler: dist/public fehlt – zuerst `pnpm build:allxion` ausführen.", file=sys.stderr)
        sys.exit(1)

    TARGET.mkdir(parents=True, exist_ok=True)
    assets = TARGET / "assets"
    if assets.is_dir():
        shutil.rmtree(assets)

    for item in DIST.iterdir():
        dest = TARGET / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)

    (TARGET / ".htaccess").write_text(HTACCESS, encoding="utf-8")
    (TARGET / "manifest.json").write_text(
        json.dumps(ALLXION_MANIFEST, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    index = TARGET / "index.html"
    if index.is_file():
        text = index.read_text(encoding="utf-8")
        text = text.replace('href="/manifest.json"', 'href="/allxion/manifest.json"')
        text = text.replace('src="/assets/', 'src="/allxion/assets/')
        text = text.replace('href="/assets/', 'href="/allxion/assets/')
        title = "Allxion · NachtBlau Crew"
        if "<title>" in text:
            text = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", text, count=1)
        index.write_text(text, encoding="utf-8")
        shutil.copy2(index, TARGET / "index.htm")

    print(f"✓ Allxion-Build nach {TARGET} kopiert ({len(list(TARGET.rglob('*')))} Einträge).")
    print("  Web:     https://nacht-blau.de/allxion/")
    print("  Upload:  pnpm webspace:sync:one nacht-blau.de")


if __name__ == "__main__":
    main()
