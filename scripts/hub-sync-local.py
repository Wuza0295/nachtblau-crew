#!/usr/bin/env python3
"""Copy ./hub/ to local webspace mirrors and optional native app paths.

Usage:
  python3 scripts/hub-sync-local.py
  python3 scripts/hub-sync-local.py --linux ~/NachtBlauHub/www
  python3 scripts/hub-sync-local.py --android ~/AndroidStudioProjects/NachtBlauHub/app/src/main/assets/hub
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "hub"
WEBSPACE_LAUNCHER = ROOT / "webspace" / "launcher.nachtblau-interactive.com"


def copy_tree(src: Path, dest: Path) -> int:
    if not src.is_dir():
        print(f"Fehler: {src} fehlt – zuerst `pnpm hub:pull` ausführen.", file=sys.stderr)
        sys.exit(1)
    shutil.copytree(src, dest, dirs_exist_ok=True)
    return sum(1 for _ in dest.rglob("*") if _.is_file())


def main() -> None:
    parser = argparse.ArgumentParser(description="Hub-Dateien auf Webspace-Spiegel und native Pfade kopieren")
    parser.add_argument("--linux", type=Path, help="Zielordner für Linux-Desktop-Launcher (www/assets)")
    parser.add_argument("--android", type=Path, help="Zielordner für Android-App-Assets")
    parser.add_argument("--skip-webspace", action="store_true", help="Nur native Pfade, kein webspace/launcher…")
    args = parser.parse_args()

    if not HUB.is_dir() or not any(HUB.iterdir()):
        print("hub/ ist leer – `pnpm hub:pull` ausführen.", file=sys.stderr)
        sys.exit(1)

    total = 0
    if not args.skip_webspace:
        n = copy_tree(HUB, WEBSPACE_LAUNCHER)
        print(f"✓ webspace/launcher.nachtblau-interactive.com/ ({n} Dateien)")
        total += n

    if args.linux:
        n = copy_tree(HUB, args.linux)
        print(f"✓ Linux: {args.linux} ({n} Dateien)")
        total += n

    if args.android:
        n = copy_tree(HUB, args.android)
        print(f"✓ Android: {args.android} ({n} Dateien)")
        total += n

    if args.skip_webspace and not args.linux and not args.android:
        n = copy_tree(HUB, WEBSPACE_LAUNCHER)
        print(f"✓ webspace/launcher.nachtblau-interactive.com/ ({n} Dateien)")
        total += n

    print(f"\nFTPS-Upload: pnpm webspace:sync:one launcher.nachtblau-interactive.com")
    print(f"Gesamt: {total} Dateien in Zielspiegel(n).")


if __name__ == "__main__":
    main()
