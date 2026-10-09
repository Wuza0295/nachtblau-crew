#!/usr/bin/env python3
"""Sync NachtBlau Hub — Webspace is always the live source of truth.

Bazzite/Linux (Electron), Windows (Electron) and Android (Capacitor) load
https://launcher.nachtblau-interactive.com/ directly.
These scripts only pull/push the FTPS mirror for edits & backup;
day-to-day use does not need local www/ copies.

Platform entrypoints on the launcher domain:
  /linux.html    Bazzite / Aurora / Desktop-Linux
  /windows.html  Windows-Notebook
  /android.html  Android
  /              Browser (index.html)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "apps" / "nachtblau-hub"
SHARED = HUB / "shared"
LINUX_WWW = HUB / "linux" / "www"
WINDOWS_WWW = HUB / "windows" / "www"
ANDROID_WWW = HUB / "android" / "www"
BRIDGES = HUB / "bridges"
WEBSPACE_ROOT = ROOT / "webspace"
WEBSPACE_LAUNCHER = WEBSPACE_ROOT / "launcher.nachtblau-interactive.com"
ENTRYPOINTS = HUB / "webspace-entrypoints"
REMOTE_LAUNCHER = "/launcher.nachtblau-interactive.com"
MANIFEST = HUB / "sync-manifest.json"

PLATFORM_OWNED = {
    "site-bridge.js",
    "linux-bridge.js",
    "windows-bridge.js",
    "android-bridge.js",
}

SKIP_COPY_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".DS_Store",
    "launcher.nachtblau-interactive.com.zip",
}

BRIDGE_SRC_RE = re.compile(
    r'src="(?:site|linux|android|windows)-bridge\.js[^"]*"'
)
PLATFORM_CLASS_RE = re.compile(
    r'class="platform-(?:web|linux|android|windows)"'
)

PLATFORMS = (
    (
        "linux",
        LINUX_WWW,
        BRIDGES / "linux-bridge.js",
        "linux-bridge.js",
        "Linux Desktop",
        HUB / "linux" / "styles-linux.css",
        "styles-linux.css",
    ),
    (
        "windows",
        WINDOWS_WWW,
        BRIDGES / "windows-bridge.js",
        "windows-bridge.js",
        "Windows Desktop",
        HUB / "windows" / "styles-windows.css",
        "styles-windows.css",
    ),
    (
        "android",
        ANDROID_WWW,
        BRIDGES / "android-bridge.js",
        "android-bridge.js",
        "Android App",
        HUB / "android" / "styles-android.css",
        "styles-android.css",
    ),
)


def _ftp():
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from webspace_config import (  # noqa: E402
        connect_ftp,
        cwd_makedirs,
        download_tree,
        mirror_index_htm,
        require_credentials,
        upload_tree,
    )

    return {
        "connect_ftp": connect_ftp,
        "cwd_makedirs": cwd_makedirs,
        "download_tree": download_tree,
        "mirror_index_htm": mirror_index_htm,
        "require_credentials": require_credentials,
        "upload_tree": upload_tree,
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


def rewrite_platform_html(
    html: str,
    *,
    platform: str,
    bridge: str,
    extra_css: str | None = None,
) -> str:
    """Patch a hub index.html to a platform entry (linux / windows / android)."""
    html = PLATFORM_CLASS_RE.sub(f'class="platform-{platform}"', html, count=1)
    html = html.replace(">Web Hub<", f">{platform.title()} Hub<")
    html = BRIDGE_SRC_RE.sub(f'src="{bridge}"', html, count=1)
    if extra_css and f'href="{extra_css}"' not in html:
        html = html.replace(
            'href="styles-web.css">',
            f'href="styles-web.css">\n  <link rel="stylesheet" href="{extra_css}">',
        )
    return html


def _write_platform_index(
    template: Path,
    out: Path,
    platform: str,
    bridge: str,
    label: str,
    extra_css: str | None = None,
) -> None:
    html = rewrite_platform_html(
        template.read_text(encoding="utf-8"),
        platform=platform,
        bridge=bridge,
        extra_css=extra_css,
    )
    # Keep the visible footer label in sync if the template still says "Web"
    if ">Web<" in html and label:
        html = html.replace(
            '<span id="platform-label">Web</span>',
            f'<span id="platform-label">{label}</span>',
            1,
        )
    out.write_text(html, encoding="utf-8")


def pull_webspace_launcher() -> int:
    ftp = _ftp()
    ftp["require_credentials"]()
    print(f"↓ Pull {REMOTE_LAUNCHER} → {WEBSPACE_LAUNCHER}")
    client = ftp["connect_ftp"]()
    try:
        ftp["cwd_makedirs"](client, REMOTE_LAUNCHER)
        n = ftp["download_tree"](client, WEBSPACE_LAUNCHER)
    finally:
        try:
            client.quit()
        except Exception:
            client.close()
    print(f"  → {n} Dateien")
    return n


def materialize_shared_from_webspace() -> int:
    if not WEBSPACE_LAUNCHER.is_dir():
        raise SystemExit(
            f"Fehlt: {WEBSPACE_LAUNCHER}\nZuerst: pnpm webspace:pull launcher.nachtblau-interactive.com"
        )
    SHARED.mkdir(parents=True, exist_ok=True)
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

    for platform, www, bridge_src, bridge_name, label, css_src, css_name in PLATFORMS:
        if www.exists():
            shutil.rmtree(www)
        www.mkdir(parents=True, exist_ok=True)
        n = _copy_tree(SHARED, www)
        if not bridge_src.is_file():
            raise SystemExit(f"Bridge fehlt: {bridge_src}")
        shutil.copy2(bridge_src, www / bridge_name)
        if css_src.is_file():
            shutil.copy2(css_src, www / css_name)
        web_bridge = www / "site-bridge.js"
        if web_bridge.exists():
            web_bridge.unlink()
        # Keep cache-buster if the template used one
        bridge_ref = bridge_name
        sample = template.read_text(encoding="utf-8")
        match = BRIDGE_SRC_RE.search(sample)
        if match and "?v=" in match.group(0):
            ver = match.group(0).split("?v=", 1)[-1].rstrip('"')
            bridge_ref = f"{bridge_name}?v={ver}"
        _write_platform_index(
            template,
            www / "index.html",
            platform,
            bridge_ref,
            label,
            extra_css=css_name if css_src.is_file() else None,
        )
        shutil.copy2(www / "index.html", www / "index.htm")
        n += 2
        counts[platform] = n
        print(f"✓ {platform}: {www} ({n} Dateien, Bridge={bridge_name})")

    if (SHARED / "site-bridge.js").is_file():
        print("✓ web: shared/ = Webspace-Launcher-Spiegel (site-bridge.js)")
    counts["web"] = sum(1 for _ in SHARED.rglob("*") if _.is_file())
    return counts


def publish_webspace_entrypoints() -> dict[str, str]:
    """Copy platform indexes to ALL-INKL MultiViews names (linux.html, windows.html, …)."""
    written: dict[str, str] = {}
    ENTRYPOINTS.mkdir(parents=True, exist_ok=True)
    dest_roots = [ENTRYPOINTS]
    if WEBSPACE_LAUNCHER.is_dir() or (SHARED / "index.html").is_file():
        WEBSPACE_LAUNCHER.mkdir(parents=True, exist_ok=True)
        dest_roots.append(WEBSPACE_LAUNCHER)

    for platform, www, bridge_src, bridge_name, _label, _css_src, _css_name in PLATFORMS:
        src = www / "index.html"
        if not src.is_file():
            continue
        for dest_root in dest_roots:
            html_path = dest_root / f"{platform}.html"
            htm_path = dest_root / f"{platform}.htm"
            shutil.copy2(src, html_path)
            shutil.copy2(src, htm_path)
            if bridge_src.is_file():
                shutil.copy2(bridge_src, dest_root / bridge_name)
            written[str(html_path.relative_to(ROOT))] = platform
            print(f"✓ Einstieg {platform}: {html_path.relative_to(ROOT)}")
    return written


def push_shared_to_webspace() -> int:
    ftp = _ftp()
    ftp["require_credentials"]()
    if not SHARED.is_dir():
        raise SystemExit("shared/ fehlt")
    WEBSPACE_LAUNCHER.mkdir(parents=True, exist_ok=True)
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

    publish_webspace_entrypoints()

    print(f"↑ Push shared + Einstiege → {REMOTE_LAUNCHER}")
    client = ftp["connect_ftp"]()
    try:
        ftp["cwd_makedirs"](client, REMOTE_LAUNCHER)
        n = ftp["upload_tree"](client, WEBSPACE_LAUNCHER)
        n += ftp["mirror_index_htm"](client, WEBSPACE_LAUNCHER)
    finally:
        try:
            client.quit()
        except Exception:
            client.close()
    print(f"  → {n} Dateien hochgeladen (lokal gespiegelt: {n_local})")
    return n


def write_manifest(counts: dict[str, int], action: str) -> None:
    files = sorted(
        str(p.relative_to(SHARED))
        for p in SHARED.rglob("*")
        if p.is_file() and p.name not in SKIP_COPY_NAMES
    ) if SHARED.is_dir() else []
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
            "windows": str(WINDOWS_WWW.relative_to(ROOT)),
            "android": str(ANDROID_WWW.relative_to(ROOT)),
            "entrypoints": str(ENTRYPOINTS.relative_to(ROOT)),
            "webspace": str(WEBSPACE_LAUNCHER.relative_to(ROOT)),
        },
        "linuxUrl": "https://launcher.nachtblau-interactive.com/linux.html",
        "windowsUrl": "https://launcher.nachtblau-interactive.com/windows.html",
        "androidUrl": "https://launcher.nachtblau-interactive.com/android.html",
    }
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"✓ Manifest: {MANIFEST.relative_to(ROOT)} (hash={content_hash})")


def status() -> None:
    print("NachtBlau Hub — Sync-Status (Bazzite + Windows + Android + Web)\n")
    for label, path in (
        ("Webspace launcher", WEBSPACE_LAUNCHER),
        ("shared", SHARED),
        ("Linux/Bazzite www", LINUX_WWW),
        ("Windows www", WINDOWS_WWW),
        ("Android www", ANDROID_WWW),
        ("Einstiege", ENTRYPOINTS),
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
        plats = data.get("platforms") or {}
        print(f"Plattformen: {', '.join(sorted(plats)) or '—'}")
    else:
        print("\nNoch kein sync-manifest.json")


def check_live(*, require_windows: bool = False) -> int:
    """Live-Check ohne FTP — delegiert an sync_bazzite_windows.verify_live."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from sync_bazzite_windows import verify_live  # noqa: E402

    return verify_live(require_windows=require_windows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync Hub across Bazzite/Linux, Windows, Android und Webspace"
    )
    parser.add_argument(
        "command",
        choices=["pull", "sync", "push", "status", "check"],
        help=(
            "pull=FTPS→shared+platforms; sync=webspace mirror→platforms; "
            "push=shared→FTPS; check=Live-URLs Bazzite↔Windows"
        ),
    )
    parser.add_argument(
        "--require-windows",
        action="store_true",
        help="Bei check: windows.html als Pflicht (nach Deploy)",
    )
    args = parser.parse_args()

    if args.command == "status":
        status()
        return

    if args.command == "check":
        raise SystemExit(check_live(require_windows=args.require_windows))

    if args.command == "pull":
        pull_webspace_launcher()
        materialize_shared_from_webspace()
        counts = apply_platforms()
        publish_webspace_entrypoints()
        write_manifest(counts, "pull")
        print("\n✓ Pull+Sync fertig — Bazzite, Windows, Android und Webspace sind identisch.")
        return

    if args.command == "sync":
        if WEBSPACE_LAUNCHER.is_dir() and (WEBSPACE_LAUNCHER / "index.html").is_file():
            materialize_shared_from_webspace()
        elif not (SHARED / "index.html").is_file():
            raise SystemExit("Weder Webspace-Spiegel noch shared/ vorhanden. Nutze: pnpm hub:pull")
        counts = apply_platforms()
        publish_webspace_entrypoints()
        write_manifest(counts, "sync")
        print(
            "\n✓ Sync fertig — Bazzite- und Windows-Hub nutzen denselben Stand wie der Web-Launcher."
        )
        return

    if args.command == "push":
        if not (SHARED / "index.html").is_file():
            if WEBSPACE_LAUNCHER.is_dir():
                materialize_shared_from_webspace()
            else:
                raise SystemExit("Nichts zum Pushen — zuerst pnpm hub:pull")
        counts = apply_platforms()
        publish_webspace_entrypoints()
        push_shared_to_webspace()
        write_manifest(counts, "push")
        print("\n✓ Push fertig — Webspace-Launcher entspricht shared / Bazzite / Windows / Android.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Hub-Sync fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
