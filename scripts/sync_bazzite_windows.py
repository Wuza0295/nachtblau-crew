#!/usr/bin/env python3
"""NachtBlau Hub: Bazzite (Linux) und Windows auf denselben Stand bringen.

Quelle ist die öffentliche Bazzite-/Linux-Seite auf dem Launcher-Webspace.
Daraus entstehen windows.html, windows.htm und windows-bridge.js — gleicher
Inhalt, nur die Plattform-Marke weicht ab. Mit FTP_USER/FTP_PASS (oder
.env.webspace) werden genau diese drei Dateien hochgeladen, ohne den
restlichen Launcher zu überschreiben.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "apps" / "nachtblau-hub"
OUT_WINDOWS = HUB / "platforms" / "windows"
OUT_BAZZITE = HUB / "platforms" / "bazzite"
BRIDGE_COPY = HUB / "bridges" / "windows-bridge.js"
REPORT = HUB / "platform-sync.json"

LINUX_PAGE = "https://launcher.nachtblau-interactive.com/linux"
LINUX_BRIDGE = "https://launcher.nachtblau-interactive.com/linux-bridge.js"
REMOTE_DIR = "/launcher.nachtblau-interactive.com"
WINDOWS_URL = "https://launcher.nachtblau-interactive.com/windows"
BAZZITE_URL = "https://launcher.nachtblau-interactive.com/linux"


def to_windows_html(linux_html: str) -> str:
    html = linux_html.replace('class="platform-linux"', 'class="platform-windows"', 1)
    html = html.replace("linux-bridge.js", "windows-bridge.js", 1)
    if 'class="platform-windows"' not in html or "windows-bridge.js" not in html:
        raise ValueError("Linux-Seite hat nicht die erwarteten Plattform-Marken")
    if 'class="platform-linux"' in html or "linux-bridge.js" in html:
        raise ValueError("Windows-Seite enthält noch Linux-Marken")
    return html


def to_windows_bridge(linux_bridge: str) -> str:
    bridge = linux_bridge
    replacements = (
        ("Linux-Bridge für launcher.nachtblau-interactive.com", "Windows-Bridge für launcher.nachtblau-interactive.com"),
        ("Platform: linux", "Platform: windows"),
        ("function initLinuxBridge()", "function initWindowsBridge()"),
        ("const PLATFORM = 'linux';", "const PLATFORM = 'windows';"),
    )
    for old, new in replacements:
        if old not in bridge:
            raise ValueError(f"Linux-Bridge ohne erwarteten Abschnitt: {old}")
        bridge = bridge.replace(old, new, 1)
    if "const PLATFORM = 'linux'" in bridge or "initLinuxBridge" in bridge:
        raise ValueError("Windows-Bridge enthält noch Linux-Plattform")
    return bridge


def _fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "NachtBlau-Hub-Sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset)
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"Download fehlgeschlagen ({exc.code}): {url}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Download fehlgeschlagen: {url} ({exc.reason})") from exc


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_platform_files(linux_html: str, linux_bridge: str) -> dict[str, str]:
    windows_html = to_windows_html(linux_html)
    windows_bridge = to_windows_bridge(linux_bridge)
    OUT_BAZZITE.mkdir(parents=True, exist_ok=True)
    OUT_WINDOWS.mkdir(parents=True, exist_ok=True)
    (OUT_BAZZITE / "linux.html").write_text(linux_html, encoding="utf-8")
    (OUT_BAZZITE / "linux-bridge.js").write_text(linux_bridge, encoding="utf-8")
    (OUT_WINDOWS / "windows.html").write_text(windows_html, encoding="utf-8")
    (OUT_WINDOWS / "windows.htm").write_text(windows_html, encoding="utf-8")
    (OUT_WINDOWS / "windows-bridge.js").write_text(windows_bridge, encoding="utf-8")
    BRIDGE_COPY.parent.mkdir(parents=True, exist_ok=True)
    BRIDGE_COPY.write_text(windows_bridge, encoding="utf-8")
    report = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {"page": LINUX_PAGE, "bridge": LINUX_BRIDGE},
        "bazzite": {
            "url": BAZZITE_URL,
            "htmlSha256": _sha256(linux_html),
            "bridgeSha256": _sha256(linux_bridge),
        },
        "windows": {
            "url": WINDOWS_URL,
            "htmlSha256": _sha256(windows_html),
            "bridgeSha256": _sha256(windows_bridge),
        },
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def upload_windows(files: list[Path]) -> None:
    sys.path.insert(0, str(ROOT / "scripts"))
    from webspace_config import connect_ftp, cwd_makedirs, require_credentials

    require_credentials()
    ftp = connect_ftp()
    try:
        cwd_makedirs(ftp, REMOTE_DIR)
        for path in files:
            with path.open("rb") as fh:
                ftp.storbinary(f"STOR {path.name}", fh)
            print(f"↑ {REMOTE_DIR}/{path.name}")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()


def http_status(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "NachtBlau-Hub-Sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="replace")
            return resp.status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, body


def verify_live() -> int:
    """Prüft, dass Bazzite und Windows jeweils ihre Plattform-Seite ausliefern."""
    failures = 0
    checks = (
        (BAZZITE_URL, 'class="platform-linux"', "linux-bridge.js"),
        (WINDOWS_URL, 'class="platform-windows"', "windows-bridge.js"),
    )
    for url, marker, bridge in checks:
        status, body = http_status(url)
        ok = status == 200 and marker in body and bridge in body
        label = "OK" if ok else "FEHLER"
        print(f"[{label}] {status} {url}")
        if not ok:
            failures += 1
    return failures


def main() -> None:
    parser = argparse.ArgumentParser(description="Bazzite- und Windows-Hub synchronisieren")
    parser.add_argument("--no-upload", action="store_true", help="Nur Dateien erzeugen, nicht hochladen")
    parser.add_argument("--check", action="store_true", help="Nur Live-URLs prüfen")
    args = parser.parse_args()

    if args.check:
        raise SystemExit(verify_live())

    print("↓ Bazzite/Linux-Seite laden …")
    linux_html = _fetch(LINUX_PAGE)
    linux_bridge = _fetch(LINUX_BRIDGE)
    report = write_platform_files(linux_html, linux_bridge)
    print(f"✓ Windows-Seiten geschrieben nach {OUT_WINDOWS.relative_to(ROOT)}")
    print(f"  HTML  {report['windows']['htmlSha256'][:16]}")
    print(f"  Bridge {report['windows']['bridgeSha256'][:16]}")

    upload_paths = [
        OUT_WINDOWS / "windows.html",
        OUT_WINDOWS / "windows.htm",
        OUT_WINDOWS / "windows-bridge.js",
    ]
    if args.no_upload:
        print("Upload übersprungen (--no-upload).")
        print("Live-Prüfung (Windows bleibt 404, bis die Dateien hochgeladen sind):")
        verify_live()
        return

    print("↑ Windows-Seiten auf den Launcher-Webspace …")
    upload_windows(upload_paths)
    print("Live-Prüfung:")
    raise SystemExit(verify_live())


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Plattform-Sync fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
