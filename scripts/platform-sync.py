#!/usr/bin/env python3
"""
Plattform-Sync: ein Allxion-Build für Linux · Android · Webspace.

  pnpm platform:sync           # build + stage → webspace/nacht-blau.de/allxion/
  pnpm platform:sync --push    # zusätzlich FTPS-Upload (.env.webspace)

Linux (Dev):    pnpm dev  — gleiches Repo
Android:        PWA/WebView → https://nacht-blau.de/allxion/
Webspace:       statisches Frontend unter /allxion/
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_ALLXION = ROOT / ".env.allxion"
ENV_WEBSPACE = ROOT / ".env.webspace"
MANIFEST = ROOT / "client" / "public" / "manifest.json"
RELEASE_TS = ROOT / "shared" / "release.ts"
PROJECTS_JSON = ROOT / "webspace" / "nacht-blau.de" / "data" / "projects.json"
ALLXION_DIR = ROOT / "webspace" / "nacht-blau.de" / "allxion"
STAGED_MANIFEST = ALLXION_DIR / "manifest.json"


def load_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip().strip("'").strip('"')
    return out


def read_release() -> tuple[str, str]:
    text = RELEASE_TS.read_text(encoding="utf-8")
    ver = re.search(r'version:\s*"([^"]+)"', text)
    synced = re.search(r'syncedAt:\s*"([^"]+)"', text)
    if not ver:
        print("Fehler: version in shared/release.ts nicht gefunden", file=sys.stderr)
        sys.exit(1)
    return ver.group(1), (synced.group(1) if synced else "")


def apply_env(env_map: dict[str, str]) -> None:
    for key, value in env_map.items():
        if key and key not in os.environ:
            os.environ[key] = value


def bump_manifest(version: str) -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    data["name"] = "NachtBlau Crew · Allxion"
    data["short_name"] = "Allxion"
    data["description"] = (
        f"Allxion v{version} – Hybrid-Social-Hub plus NachtBlau Crew Gaming Community."
    )
    # Relative to /allxion/ scope so Android PWA installs correctly
    data["start_url"] = "./"
    data["scope"] = "./"
    data["display"] = "standalone"
    data["id"] = "https://nacht-blau.de/allxion/"
    data["lang"] = "de"
    data["version"] = version
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"✓ manifest.json → v{version} (scope ./)")


def patch_projects(version: str, synced_at: str) -> None:
    if not PROJECTS_JSON.is_file():
        return
    data = json.loads(PROJECTS_JSON.read_text(encoding="utf-8"))
    data["updated"] = synced_at or data.get("updated", "")
    for link in data.get("links", []):
        if link.get("id") == "allxion":
            link["url"] = "https://nacht-blau.de/allxion/"
            link["subtitle"] = f"Hybrid-Social-Hub · v{version}"
            link["note"] = "Linux · Android · Webspace — pnpm platform:sync"
    PROJECTS_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"✓ projects.json → Allxion v{version}")


def run(cmd: list[str], extra_env: dict[str, str] | None = None) -> None:
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    print(f"$ {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, cwd=ROOT, env=env, check=True)


def push_webspace() -> None:
    if not ENV_WEBSPACE.is_file() and not (os.environ.get("FTP_USER") and os.environ.get("FTP_PASS")):
        print(
            "Fehler: --push benötigt .env.webspace oder FTP_USER/FTP_PASS.\n"
            "  cp .env.webspace.example .env.webspace",
            file=sys.stderr,
        )
        sys.exit(1)
    # Prefer session credentials if .env.webspace empty
    ws = load_env_file(ENV_WEBSPACE)
    apply_env(ws)
    if not os.environ.get("FTP_USER") or not os.environ.get("FTP_PASS"):
        session = Path.home() / ".config" / "nachtblau" / "allinkl.env"
        apply_env(load_env_file(session))
    os.environ.setdefault("FTP_REMOTE_DIR", "/nacht-blau.de")
    run(["python3", "scripts/sync-one-webspace.py", "nacht-blau.de"])


def write_release_stamp(version: str) -> None:
    """Leave a small stamp in the staged Allxion dir for runtime verification."""
    stamp = {
        "name": "Allxion",
        "version": version,
        "platforms": ["linux", "android", "webspace"],
        "url": "https://nacht-blau.de/allxion/",
    }
    ALLXION_DIR.mkdir(parents=True, exist_ok=True)
    (ALLXION_DIR / "release.json").write_text(
        json.dumps(stamp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    if STAGED_MANIFEST.is_file():
        # Ensure staged manifest also carries version (copied from public during build)
        try:
            data = json.loads(STAGED_MANIFEST.read_text(encoding="utf-8"))
            data["version"] = version
            data["start_url"] = "./"
            data["scope"] = "./"
            STAGED_MANIFEST.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )
        except Exception as exc:
            print(f"  ! manifest patch after stage: {exc}")


def main() -> None:
    push = "--push" in sys.argv
    apply_env(load_env_file(ENV_ALLXION))
    version, synced_at = read_release()

    print("═══ Allxion Plattform-Sync (Linux · Android · Webspace) ═══")
    print(f"Version: {version}  syncedAt: {synced_at or '—'}")

    bump_manifest(version)
    patch_projects(version, synced_at)

    base = os.environ.get("VITE_APP_BASE", "/allxion/")
    if not base.endswith("/"):
        base += "/"
    build_env = {"VITE_APP_BASE": base}
    if os.environ.get("VITE_API_ORIGIN"):
        build_env["VITE_API_ORIGIN"] = os.environ["VITE_API_ORIGIN"]
        print(f"API: {build_env['VITE_API_ORIGIN']}")
    else:
        print("API: (kein VITE_API_ORIGIN — relatives /api/trpc)")

    run(["pnpm", "build:allxion"], build_env)
    run(["pnpm", "webspace:stage-allxion"])
    write_release_stamp(version)

    print()
    print("Staging fertig:")
    print(f"  {ALLXION_DIR.relative_to(ROOT)}/")
    print("  Linux:    pnpm dev  (gleiches Repo)")
    print("  Android:  https://nacht-blau.de/allxion/  (PWA / WebView)")
    print("  Webspace: https://nacht-blau.de/allxion/")

    if push:
        print()
        print("── FTPS Upload ──")
        push_webspace()
        print("✓ Webspace aktualisiert: https://nacht-blau.de/allxion/")
    else:
        print()
        print("Tipp: pnpm platform:sync --push  → FTPS-Upload nach ALL-INKL")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        print(f"Sync fehlgeschlagen (exit {exc.returncode})", file=sys.stderr)
        sys.exit(exc.returncode)
    except Exception as exc:
        print(f"Sync fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
