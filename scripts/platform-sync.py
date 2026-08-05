#!/usr/bin/env python3
"""Build Allxion, stage to webspace mirror, optionally push to ALL-INKL."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent


def run(cmd: list[str], *, env: dict[str, str] | None = None) -> None:
    print(f"\n→ {' '.join(cmd)}", flush=True)
    merged = {**os.environ, **(env or {})}
    subprocess.run(cmd, cwd=ROOT, env=merged, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync NachtBlau Crew across Linux dev, Android/WebView, and Webspace"
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Nach dem Staging `pnpm webspace:sync:one nacht-blau.de` ausführen (FTP nötig)",
    )
    parser.add_argument(
        "--api-origin",
        default=os.environ.get("VITE_API_ORIGIN", ""),
        help="Manus-Backend-URL für statisches Allxion (VITE_API_ORIGIN)",
    )
    args = parser.parse_args()

    build_env: dict[str, str] = {"ALLXION_BUILD": "1"}
    if args.api_origin:
        build_env["VITE_API_ORIGIN"] = args.api_origin.rstrip("/")
    elif not os.environ.get("VITE_API_ORIGIN"):
        print(
            "Hinweis: VITE_API_ORIGIN nicht gesetzt — Allxion-Build nutzt dasselbe "
            "Origin nur auf Manus. Für Webspace/Android bitte Manus-URL setzen "
            "(siehe .env.allxion.example).",
            flush=True,
        )

    run(["pnpm", "build:allxion"], env=build_env)
    run([sys.executable, str(SCRIPTS / "stage-allxion.py")])

    print(
        "\nLokal (Linux): `pnpm dev` — gleicher Code wie Cloud/Manus.\n"
        "Android: WebView/PWA auf https://nacht-blau.de/allxion/ (manifest.json scope /allxion/).\n"
        "Webspace: Dateien liegen unter webspace/nacht-blau.de/allxion/",
        flush=True,
    )

    if args.push:
        run(["pnpm", "webspace:sync:one", "nacht-blau.de"])


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.exit(exc.returncode)
