#!/usr/bin/env python3
"""Pull all webspace domains, inject partner banner, build Allxion, sync everything."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent


def run(cmd: list[str], *, cwd: Path = ROOT) -> None:
    print(f"\n$ {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> None:
    run([sys.executable, str(SCRIPTS / "pull-webspace.py")])
    run([sys.executable, str(SCRIPTS / "inject-partner-banner.py")])
    run(["pnpm", "webspace:build-allxion"], cwd=ROOT)
    run([sys.executable, str(SCRIPTS / "sync-webspace.py")])


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        print(f"Deployment abgebrochen (Exit {exc.returncode}).", file=sys.stderr)
        sys.exit(exc.returncode or 1)
