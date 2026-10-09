#!/usr/bin/env python3
"""Sync NachtBlau Hub — Webspace is always the live source of truth.

Linux/Bazzite and Windows (Electron) and Android (Capacitor) load
https://launcher.nachtblau-interactive.com/ directly.
These scripts only pull/push the FTPS mirror for edits & backup;
day-to-day use does not need local www/ copies.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import urllib.error
import urllib.request
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
WINDOWS_WWW = HUB / "windows" / "www"
ANDROID_WWW = HUB / "android" / "www"
BRIDGES = HUB / "bridges"
WEBSPACE_LAUNCHER = WEBSPACE_ROOT / "launcher.nachtblau-interactive.com"
REMOTE_LAUNCHER = "/launcher.nachtblau-interactive.com"
MANIFEST = HUB / "sync-manifest.json"
HUB_URL_FILE = HUB / "hub-url.json"

# (platform, www, label) — each platform gets <platform>.html + <platform>-bridge.js
# on the webspace and a full local www/ copy for the native shell.
PLATFORMS = (
    ("linux", LINUX_WWW, "Linux (Bazzite)"),
    ("windows", WINDOWS_WWW, "Windows"),
    ("android", ANDROID_WWW, "Android"),
)

# Files owned by a platform shell (not overwritten from shared)
PLATFORM_OWNED = {
    "site-bridge.js",  # web bridge name used by index.html on web
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


def render_platform_index(html: str, platform: str, extra_css: str | None = None) -> str:
    """Derive <platform>.html from the web index (body class, bridge script, CSS)."""
    html = html.replace('class="platform-web"', f'class="platform-{platform}"')
    html = re.sub(r'src="site-bridge\.js(\?[^"]*)?"', lambda m: f'src="{platform}-bridge.js{m.group(1) or ""}"', html)
    if extra_css and f'href="{extra_css}"' not in html:
        html = html.replace("</head>", f'  <link rel="stylesheet" href="{extra_css}">\n</head>', 1)
    return html


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


SEED_HTTPS_PATHS = (
    "/",
    "index.html",
    "linux.html",
    "android.html",
    "windows.html",
    "site-bridge.js",
    "linux-bridge.js",
    "android-bridge.js",
    "windows-bridge.js",
    "styles.css",
    "css/hub.css",
    "favicon.svg",
    "favicon.ico",
    "assets/logo.svg",
    "assets/games/default-cover.svg",
    "js/hub/main.js",
)


def _https_get(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(
        url, headers={"User-Agent": "nachtblau-hub-sync", "Cache-Control": "no-cache"}
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as exc:
        return exc.code, b""
    except Exception:
        return 0, b""


def _extract_local_refs(text: str, *, file_dir: str = "") -> set[str]:
    """Collect relative asset paths from HTML/CSS/JS for the same host."""
    refs: set[str] = set()
    patterns = (
        r"""(?:href|src)=["']([^"'?#]+)""",
        r"""url\((['"]?)([^)'"#?]+)\1\)""",
        r"""["']((?:assets|css|js|fonts)/[^'"?#]+\.(?:js|css|svg|png|webp|jpg|jpeg|ico|woff2|json))["']""",
        r"""from\s+["'](\.?\.?/[^'"]+\.js)["']""",
        r"""import\(["'](\.?\.?/[^'"]+\.js)["']\)""",
    )
    for pattern in patterns:
        for match in re.findall(pattern, text):
            url = match[-1] if isinstance(match, tuple) else match
            if not url or url.startswith(("http://", "https://", "data:", "mailto:", "#", "//")):
                continue
            # Template-Literale / Fragment-Artefakte aus JS überspringen
            if "${" in url or "%" in url or "(" in url or ")" in url or " " in url:
                continue
            url = url.split("?")[0]
            if url.startswith("./"):
                url = url[2:]
            if url.startswith("../") or (file_dir and "/" not in url and url.endswith(".js")):
                base = Path(file_dir) if file_dir else Path(".")
                resolved = (base / url).as_posix()
                parts: list[str] = []
                for part in resolved.split("/"):
                    if part == "..":
                        if parts:
                            parts.pop()
                    elif part not in ("", "."):
                        parts.append(part)
                url = "/".join(parts)
            refs.add(url.lstrip("/"))
    return refs


def pull_https_launcher() -> int:
    """Spiegel den öffentlichen Live-Launcher per HTTPS (ohne FTPS-Zugangsdaten)."""
    base = _hub_base()
    print(f"↓ HTTPS-Pull {base} → {WEBSPACE_LAUNCHER}")
    if WEBSPACE_LAUNCHER.exists():
        shutil.rmtree(WEBSPACE_LAUNCHER)
    WEBSPACE_LAUNCHER.mkdir(parents=True, exist_ok=True)

    queue: list[str] = list(SEED_HTTPS_PATHS)
    seen: set[str] = set()
    saved = 0

    while queue:
        rel = queue.pop(0)
        key = rel if rel not in ("/", "") else "index.html"
        if key in seen:
            continue
        seen.add(key)

        url = base if rel in ("/", "") else base + rel.lstrip("/")
        code, data = _https_get(url)
        if code != 200 or not data:
            if rel not in ("windows.html", "windows-bridge.js"):
                print(f"  · übersprungen {rel or '/'} (HTTP {code})")
            continue

        dest_name = "index.html" if rel in ("/", "", "index.html") else rel.lstrip("/")
        dest = WEBSPACE_LAUNCHER / dest_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        saved += 1
        print(f"  ✓ {dest_name} ({len(data)} B)")

        ctype_guess = dest_name.rsplit(".", 1)[-1].lower() if "." in dest_name else "html"
        if ctype_guess in {"html", "htm", "css", "js", "svg"} or rel in ("/", ""):
            try:
                text = data.decode("utf-8", errors="ignore")
            except Exception:
                continue
            file_dir = str(Path(dest_name).parent)
            if file_dir == ".":
                file_dir = ""
            for ref in _extract_local_refs(text, file_dir=file_dir):
                if ref not in seen:
                    queue.append(ref)

    # Bridges aus dem Live-Stand in apps/nachtblau-hub/bridges spiegeln
    for name in ("linux-bridge.js", "android-bridge.js", "windows-bridge.js"):
        src = WEBSPACE_LAUNCHER / name
        if src.is_file():
            BRIDGES.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, BRIDGES / name)
            print(f"  ↔ bridges/{name} aktualisiert")

    print(f"  → {saved} Dateien")
    if saved == 0:
        raise SystemExit("HTTPS-Pull lieferte keine Dateien")
    return saved


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


def _platform_css(platform: str) -> Path:
    return HUB / platform / f"styles-{platform}.css"


def apply_platforms() -> dict[str, int]:
    if not (SHARED / "index.html").is_file():
        raise SystemExit("shared/index.html fehlt — zuerst pull/materialize")

    template = (SHARED / "index.html").read_text(encoding="utf-8")
    if 'class="platform-web"' not in template:
        raise SystemExit("shared/index.html ist keine Web-Vorlage (platform-web fehlt)")
    counts: dict[str, int] = {}

    # shared/ is the webspace copy: it gets every <platform>.html + bridge so a push
    # deploys all entry points; native www/ copies get the same files plus index.html.
    for platform, _www, _label in PLATFORMS:
        bridge_src = BRIDGES / f"{platform}-bridge.js"
        if not bridge_src.is_file():
            raise SystemExit(f"Bridge fehlt: {bridge_src}")
        css_src = _platform_css(platform)
        shutil.copy2(bridge_src, SHARED / bridge_src.name)
        if css_src.is_file():
            shutil.copy2(css_src, SHARED / css_src.name)
        page = render_platform_index(
            template, platform, extra_css=css_src.name if css_src.is_file() else None
        )
        (SHARED / f"{platform}.html").write_text(page, encoding="utf-8")
        print(f"✓ web: {platform}.html + {bridge_src.name}")

    for platform, www, _label in PLATFORMS:
        if www.exists():
            shutil.rmtree(www)
        www.mkdir(parents=True, exist_ok=True)
        _copy_tree(SHARED, www)
        # Remove web-only bridge from native packages to avoid confusion
        web_bridge = www / "site-bridge.js"
        if web_bridge.exists():
            web_bridge.unlink()
        shutil.copy2(www / f"{platform}.html", www / "index.html")
        # Mirror index.htm for local static servers / ALL-INKL habit
        shutil.copy2(www / "index.html", www / "index.htm")
        n = sum(1 for p in www.rglob("*") if p.is_file())
        counts[platform] = n
        print(f"✓ {platform}: {www.relative_to(ROOT)} ({n} Dateien, Bridge={platform}-bridge.js)")

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
    try:
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        payload = {}
    payload |= {
        "action": action,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "contentHash": content_hash,
        "fileCount": len(files),
        "platforms": counts,
        "paths": {
            "shared": str(SHARED.relative_to(ROOT)),
            **{name: str(www.relative_to(ROOT)) for name, www, _label in PLATFORMS},
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
        *((f"{label} www", www) for _name, www, label in PLATFORMS),
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


def _fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "nachtblau-hub-sync", "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, res.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, ""


def _hub_base() -> str:
    try:
        url = json.loads(HUB_URL_FILE.read_text(encoding="utf-8")).get("url")
    except (OSError, ValueError):
        url = None
    return (url or "https://launcher.nachtblau-interactive.com/").rstrip("/") + "/"


def check_live() -> bool:
    """HTTPS check (no FTPS needed): every platform entry page and bridge is live and matches the repo."""
    base = _hub_base()
    print(f"NachtBlau Hub — Live-Check {base}\n")
    ok = True
    entries = [("web", "index.html", "site-bridge.js")] + [
        (name, f"{name}.html", f"{name}-bridge.js") for name, _www, _label in PLATFORMS
    ]
    for platform, page, bridge in entries:
        code, html = _fetch(base + page)
        problems = []
        if code != 200:
            problems.append(f"{page} HTTP {code}")
        else:
            if f'class="platform-{platform}"' not in html:
                problems.append(f"{page} ohne platform-{platform}")
            if not re.search(rf'src="{re.escape(bridge)}(\?[^"]*)?"', html):
                problems.append(f"{page} lädt {bridge} nicht")
        bcode, bjs = _fetch(base + bridge)
        if bcode != 200:
            problems.append(f"{bridge} HTTP {bcode}")
        elif platform != "web":
            if f"const PLATFORM = '{platform}';" not in bjs:
                problems.append(f"{bridge} hat falsche PLATFORM")
            local = BRIDGES / bridge
            if local.is_file() and local.read_text(encoding="utf-8") != bjs:
                problems.append(f"{bridge} weicht vom Repo ab")
        if problems:
            # windows.html fehlt live noch → Client fällt auf den Web-Einstieg zurück
            windows_pending = platform == "windows" and all(
                "HTTP 404" in p for p in problems
            )
            if windows_pending:
                print(f"  ~ {platform:8} noch nicht live (Fallback /) — " + "; ".join(problems))
            else:
                ok = False
                print(f"  ✗ {platform:8} " + "; ".join(problems))
        else:
            print(f"  ✓ {platform:8} {page} + {bridge}")
    print(
        "\n✓ Live-Einstiege ok (web/linux/android)."
        if ok
        else "\n✗ Nicht synchron — pnpm hub:push (FTPS-Zugang nötig)."
    )
    return ok


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync Hub across Linux (Bazzite) / Windows / Android / Webspace"
    )
    parser.add_argument(
        "command",
        choices=["pull", "pull-https", "sync", "push", "status", "check"],
        help=(
            "pull=FTPS→shared+platforms; pull-https=Live-HTTPS→shared+platforms (ohne FTPS); "
            "sync=webspace mirror→platforms; push=shared→FTPS; "
            "check=HTTPS-Live-Prüfung aller Plattform-Einstiege"
        ),
    )
    args = parser.parse_args()

    if args.command == "status":
        status()
        return

    if args.command == "check":
        sys.exit(0 if check_live() else 1)

    if args.command == "pull":
        pull_webspace_launcher()
        materialize_shared_from_webspace()
        counts = apply_platforms()
        write_manifest(counts, "pull")
        print("\n✓ Pull+Sync fertig — Bazzite/Linux, Windows, Android und Webspace-Spiegel sind identisch.")
        return

    if args.command == "pull-https":
        pull_https_launcher()
        materialize_shared_from_webspace()
        counts = apply_platforms()
        write_manifest(counts, "pull-https")
        print(
            "\n✓ HTTPS-Pull+Sync fertig — lokaler Hub entspricht dem öffentlichen Live-Launcher "
            "(vollständiger FTPS-Spiegel: pnpm hub:pull mit .env.webspace)."
        )
        return

    if args.command == "sync":
        # Prefer existing webspace mirror; else shared; else error
        if WEBSPACE_LAUNCHER.is_dir() and (WEBSPACE_LAUNCHER / "index.html").is_file():
            materialize_shared_from_webspace()
        elif not (SHARED / "index.html").is_file():
            raise SystemExit(
                "Weder Webspace-Spiegel noch shared/ vorhanden. Nutze: pnpm hub:pull-https oder pnpm hub:pull"
            )
        counts = apply_platforms()
        write_manifest(counts, "sync")
        print("\n✓ Sync fertig — Bazzite/Linux-, Windows- und Android-App nutzen denselben Stand wie der Web-Launcher.")
        return

    if args.command == "push":
        if not (SHARED / "index.html").is_file():
            if WEBSPACE_LAUNCHER.is_dir():
                materialize_shared_from_webspace()
            else:
                raise SystemExit("Nichts zum Pushen — zuerst pnpm hub:pull-https oder pnpm hub:pull")
        counts = apply_platforms()
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
