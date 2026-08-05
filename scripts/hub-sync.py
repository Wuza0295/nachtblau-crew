#!/usr/bin/env python3
"""Sync NachtBlau Hub across Webspace, Linux desktop app, and Android app.

Source of truth for shared UI: webspace/launcher.nachtblau-interactive.com
(or remote via FTPS pull). Platform shells keep only bridges + native wrappers.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (  # noqa: E402
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    download_tree,
    mirror_index_htm,
    require_credentials,
    upload_tree,
)

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "apps" / "nachtblau-hub"
SHARED = HUB / "shared"
LINUX_WWW = HUB / "linux" / "www"
ANDROID_WWW = HUB / "android" / "www"
BRIDGES = HUB / "bridges"
WEBSPACE_LAUNCHER = WEBSPACE_ROOT / "launcher.nachtblau-interactive.com"
REMOTE_LAUNCHER = "/launcher.nachtblau-interactive.com"
MANIFEST = HUB / "sync-manifest.json"

# Files owned by a platform shell (not overwritten from shared)
PLATFORM_OWNED = {
    "site-bridge.js",  # web bridge name used by index.html on web
    "linux-bridge.js",
    "android-bridge.js",
}

SKIP_COPY_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".DS_Store",
    "launcher.nachtblau-interactive.com.zip",
}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _copy_tree(src: Path, dst: Path, *, skip_names: set[str] | None = None) -> int:
    skip_names = skip_names or set()
    count = 0
    if not src.is_dir():
        raise FileNotFoundError(src)
    dst.mkdir(parents=True, exist_ok=True)
    for item in sorted(src.rglob("*")):
        rel = item.relative_to(src)
        if any(part in SKIP_COPY_NAMES or part in skip_names for part in rel.parts):
            continue
        target = dst / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
        count += 1
    return count


def _write_platform_index(template: Path, out: Path, platform: str, bridge: str, label: str) -> None:
    html = template.read_text(encoding="utf-8")
    html = html.replace('class="platform-web"', f'class="platform-{platform}"')
    html = html.replace(">Web Hub<", f">{label}<")
    html = html.replace('src="site-bridge.js"', f'src="{bridge}"')
    # Keep id for JS; only visible label text was replaced above.
    out.write_text(html, encoding="utf-8")


def pull_webspace_launcher() -> int:
    require_credentials()
    print(f"↓ Pull {REMOTE_LAUNCHER} → {WEBSPACE_LAUNCHER}")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, REMOTE_LAUNCHER)
        n = download_tree(ftp, WEBSPACE_LAUNCHER)
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()
    print(f"  → {n} Dateien")
    return n


def materialize_shared_from_webspace() -> int:
    if not WEBSPACE_LAUNCHER.is_dir():
        raise SystemExit(
            f"Fehlt: {WEBSPACE_LAUNCHER}\nZuerst: pnpm webspace:pull launcher.nachtblau-interactive.com"
        )
    SHARED.mkdir(parents=True, exist_ok=True)
    # Wipe shared (keep directory) then copy fresh mirror
    for child in SHARED.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    n = _copy_tree(WEBSPACE_LAUNCHER, SHARED)
    print(f"✓ shared aktualisiert ({n} Dateien) aus Webspace-Launcher")
    return n


def apply_platforms() -> dict[str, int]:
    if not (SHARED / "index.html").is_file():
        raise SystemExit("shared/index.html fehlt — zuerst pull/materialize")

    template = SHARED / "index.html"
    counts: dict[str, int] = {}

    # Web bridge lives in shared as site-bridge.js (from webspace)
    # Linux / Android get a full copy of shared + their bridge + patched index
    for platform, www, bridge_src, bridge_name, label in (
        (
            "linux",
            LINUX_WWW,
            BRIDGES / "linux-bridge.js",
            "linux-bridge.js",
            "Linux Desktop",
        ),
        (
            "android",
            ANDROID_WWW,
            BRIDGES / "android-bridge.js",
            "android-bridge.js",
            "Android App",
        ),
    ):
        if www.exists():
            shutil.rmtree(www)
        www.mkdir(parents=True, exist_ok=True)
        n = _copy_tree(SHARED, www)
        if not bridge_src.is_file():
            raise SystemExit(f"Bridge fehlt: {bridge_src}")
        shutil.copy2(bridge_src, www / bridge_name)
        # Remove web-only bridge from native packages to avoid confusion
        web_bridge = www / "site-bridge.js"
        if web_bridge.exists():
            web_bridge.unlink()
        _write_platform_index(template, www / "index.html", platform, bridge_name, label)
        # Mirror index.htm for local static servers / ALL-INKL habit
        shutil.copy2(www / "index.html", www / "index.htm")
        n += 1
        counts[platform] = n
        print(f"✓ {platform}: {www} ({n} Dateien, Bridge={bridge_name})")

    # Ensure webspace launcher keeps web bridge + platform-web index
    # (shared is already the web copy)
    if (SHARED / "site-bridge.js").is_file():
        print("✓ web: shared/ = Webspace-Launcher-Spiegel (site-bridge.js)")
    counts["web"] = sum(1 for _ in SHARED.rglob("*") if _.is_file())
    return counts


def push_shared_to_webspace() -> int:
    """Push shared (web) UI back to launcher domain on ALL-INKL."""
    require_credentials()
    if not SHARED.is_dir():
        raise SystemExit("shared/ fehlt")
    # Stage into webspace mirror first
    WEBSPACE_LAUNCHER.mkdir(parents=True, exist_ok=True)
    # Preserve remote-only large zip if present locally
    zip_name = "launcher.nachtblau-interactive.com.zip"
    preserved = None
    zip_path = WEBSPACE_LAUNCHER / zip_name
    if zip_path.is_file():
        preserved = zip_path.read_bytes()

    for child in list(WEBSPACE_LAUNCHER.iterdir()):
        if child.name == zip_name:
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    n_local = _copy_tree(SHARED, WEBSPACE_LAUNCHER, skip_names={zip_name})
    if preserved is not None:
        zip_path.write_bytes(preserved)

    print(f"↑ Push shared → {REMOTE_LAUNCHER}")
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, REMOTE_LAUNCHER)
        # Upload shared tree into remote launcher root
        # Start from remote root of launcher
        n = upload_tree(ftp, SHARED)
        n += mirror_index_htm(ftp, SHARED)
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()
    print(f"  → {n} Dateien hochgeladen (lokal gespiegelt: {n_local})")
    return n


def write_manifest(counts: dict[str, int], action: str) -> None:
    files = sorted(
        str(p.relative_to(SHARED))
        for p in SHARED.rglob("*")
        if p.is_file() and p.name not in SKIP_COPY_NAMES
    )
    digest_parts = []
    for rel in files:
        digest_parts.append(f"{rel}:{_sha256(SHARED / rel)}")
    content_hash = hashlib.sha256("\n".join(digest_parts).encode()).hexdigest()[:16]
    payload = {
        "action": action,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "contentHash": content_hash,
        "fileCount": len(files),
        "platforms": counts,
        "paths": {
            "shared": str(SHARED.relative_to(ROOT)),
            "linux": str(LINUX_WWW.relative_to(ROOT)),
            "android": str(ANDROID_WWW.relative_to(ROOT)),
            "webspace": str(WEBSPACE_LAUNCHER.relative_to(ROOT)),
        },
    }
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"✓ Manifest: {MANIFEST.relative_to(ROOT)} (hash={content_hash})")


def status() -> None:
    print("NachtBlau Hub — Sync-Status\n")
    for label, path in (
        ("Webspace launcher", WEBSPACE_LAUNCHER),
        ("shared", SHARED),
        ("Linux www", LINUX_WWW),
        ("Android www", ANDROID_WWW),
    ):
        if not path.exists():
            print(f"  · {label}: fehlt ({path})")
            continue
        n = sum(1 for p in path.rglob("*") if p.is_file())
        print(f"  · {label}: {n} Dateien — {path.relative_to(ROOT)}")
    if MANIFEST.is_file():
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
        print(
            f"\nLetzter Sync: {data.get('updatedAt')}  hash={data.get('contentHash')}  "
            f"action={data.get('action')}"
        )
    else:
        print("\nNoch kein sync-manifest.json")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync Hub across Linux / Android / Webspace")
    parser.add_argument(
        "command",
        choices=["pull", "sync", "push", "status"],
        help="pull=FTPS→shared+platforms; sync=webspace mirror→platforms; push=shared→FTPS",
    )
    args = parser.parse_args()

    if args.command == "status":
        status()
        return

    if args.command == "pull":
        pull_webspace_launcher()
        materialize_shared_from_webspace()
        counts = apply_platforms()
        write_manifest(counts, "pull")
        print("\n✓ Pull+Sync fertig — Linux, Android und Webspace-Spiegel sind identisch.")
        return

    if args.command == "sync":
        # Prefer existing webspace mirror; else shared; else error
        if WEBSPACE_LAUNCHER.is_dir() and (WEBSPACE_LAUNCHER / "index.html").is_file():
            materialize_shared_from_webspace()
        elif not (SHARED / "index.html").is_file():
            raise SystemExit("Weder Webspace-Spiegel noch shared/ vorhanden. Nutze: pnpm hub:pull")
        counts = apply_platforms()
        write_manifest(counts, "sync")
        print("\n✓ Sync fertig — Linux- und Android-App nutzen denselben Stand wie der Web-Launcher.")
        return

    if args.command == "push":
        if not (SHARED / "index.html").is_file():
            if WEBSPACE_LAUNCHER.is_dir():
                materialize_shared_from_webspace()
            else:
                raise SystemExit("Nichts zum Pushen — zuerst pnpm hub:pull")
        counts = apply_platforms()
        push_shared_to_webspace()
        write_manifest(counts, "push")
        print("\n✓ Push fertig — Webspace-Launcher entspricht shared / Linux / Android.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Hub-Sync fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
