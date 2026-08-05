#!/usr/bin/env python3
"""Pull NachtBlau Hub static files from the canonical web host into ./hub/."""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "hub"
BASE = "https://launcher.nachtblau-interactive.com"


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def wget(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["wget", "-q", "-O", str(dest), url],
        check=True,
    )


def wget_to_dir(url: str, dest_dir: Path) -> Path:
    """Download URL; strip ?query from filename (ALL-INKL serves versioned JS)."""
    from urllib.parse import urlparse

    name = Path(urlparse(url).path).name
    dest = dest_dir / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["wget", "-q", "-O", str(dest), url], check=True)
    return dest


def main() -> None:
    HUB.mkdir(parents=True, exist_ok=True)
    print(f"Spiegele Hub von {BASE} nach {HUB} …", flush=True)

    subprocess.run(
        [
            "wget",
            "-e",
            "robots=off",
            "-r",
            "-l",
            "5",
            "-np",
            "-nH",
            "-P",
            str(HUB),
            "--reject",
            "*.php",
            f"{BASE}/",
        ],
        check=True,
    )

    for name in (
        "config/games.json",
        "config/monetization.json",
        "config/symbiose-band1.json",
        "config/symbiose-illustrations.json",
    ):
        wget(f"{BASE}/{name}", HUB / name)

    games = fetch_json(f"{BASE}/config/games.json")
    extra_dirs: set[str] = set()
    for game in games.get("games", []):
        play = (game.get("web") or {}).get("playUrl") or ""
        if play and not play.startswith("http"):
            extra_dirs.add(play.strip("/").split("/")[0])

    for folder in sorted(extra_dirs):
        subprocess.run(
            [
                "wget",
                "-e",
                "robots=off",
                "-r",
                "-l",
                "4",
                "-np",
                "-nH",
                "-P",
                str(HUB),
                f"{BASE}/{folder}/",
            ],
            check=True,
        )

    count = sum(1 for _ in HUB.rglob("*") if _.is_file())
    print(f"✓ {count} Dateien unter hub/", flush=True)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        print(f"hub-pull fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
