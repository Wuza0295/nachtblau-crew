#!/usr/bin/env python3
"""Copy dist/allxion into webspace/nacht-blau.de/allxion/ for FTPS upload."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "dist" / "allxion"
TARGET = ROOT / "webspace" / "nacht-blau.de" / "allxion"
HTACCESS = """Options -MultiViews
RewriteEngine On
RewriteBase /allxion/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
"""

MANIFEST_TEMPLATE = {
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


def load_release_version() -> str:
    release = ROOT / "shared" / "release.ts"
    if not release.is_file():
        return "unknown"
    for line in release.read_text(encoding="utf-8").splitlines():
        if "version:" in line and '"' in line:
            return line.split('"')[1]
    return "unknown"


def main() -> None:
    if not BUILD.is_dir() or not (BUILD / "index.html").is_file():
        print("Fehler: dist/allxion fehlt — zuerst `pnpm build:allxion` ausführen.", file=sys.stderr)
        sys.exit(1)

    if TARGET.exists():
        for child in TARGET.iterdir():
            if child.name == ".htaccess":
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    else:
        TARGET.mkdir(parents=True, exist_ok=True)

    for item in BUILD.iterdir():
        dest = TARGET / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)

    (TARGET / ".htaccess").write_text(HTACCESS, encoding="utf-8")

    manifest = MANIFEST_TEMPLATE.copy()
    manifest["version"] = load_release_version()
    (TARGET / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Mirror index.htm for ALL-INKL default docs + Allxion title
    index = TARGET / "index.html"
    if index.is_file():
        html = index.read_text(encoding="utf-8")
        html = html.replace(
            "<title>NachtBlau Crew – Gaming Community</title>",
            "<title>Allxion · NachtBlau Crew</title>",
            1,
        )
        index.write_text(html, encoding="utf-8")
        shutil.copy2(index, TARGET / "index.htm")

    projects = ROOT / "webspace" / "nacht-blau.de" / "data" / "projects.json"
    if projects.is_file():
        data = json.loads(projects.read_text(encoding="utf-8"))
        data["updated"] = manifest["version"]
        projects.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    n = sum(1 for _ in TARGET.rglob("*") if _.is_file())
    print(f"✓ {n} Dateien nach {TARGET.relative_to(ROOT)} gestaged (Version {manifest['version']}).")


if __name__ == "__main__":
    main()
