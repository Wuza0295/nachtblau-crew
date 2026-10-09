#!/usr/bin/env python3
"""NachtBlau Hub: Bazzite (Linux) ↔ Windows auf denselben Stand bringen.

Beide Seiten sollen denselben Katalog/Inhalt haben — nur Plattform-Marke und
Bridge-Dateiname unterscheiden sich. Live-Quelle ist, was auf dem Launcher
erreichbar ist (aktuell linux.html). Daraus entstehen windows.html / .htm /
windows-bridge.js. Umgekehrt kann aus einer Windows-Seite wieder Linux
erzeugt werden (Round-Trip).

Upload (FTPS) braucht FTP_USER/FTP_PASS bzw. .env.webspace.
Ohne Credentials: Artefakte lokal erzeugen + Live-Check (windows bleibt 404,
bis jemand mit Zugang pusht).
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
BRIDGES = HUB / "bridges"
ENTRYPOINTS = HUB / "webspace-entrypoints"
REPORT = HUB / "platform-sync.json"

LINUX_PAGE = "https://launcher.nachtblau-interactive.com/linux.html"
LINUX_BRIDGE = "https://launcher.nachtblau-interactive.com/linux-bridge.js"
WINDOWS_PAGE = "https://launcher.nachtblau-interactive.com/windows.html"
WINDOWS_BRIDGE = "https://launcher.nachtblau-interactive.com/windows-bridge.js"
REMOTE_DIR = "/launcher.nachtblau-interactive.com"
BAZZITE_URL = LINUX_PAGE
WINDOWS_URL = WINDOWS_PAGE

# (old, new) — Reihenfolge wichtig; nur erste Treffer ersetzen wo sinnvoll.
_LINUX_TO_WINDOWS_BRIDGE = (
    (
        "Linux-Bridge für launcher.nachtblau-interactive.com",
        "Windows-Bridge für launcher.nachtblau-interactive.com",
    ),
    ("Platform: linux", "Platform: windows"),
    ("function initLinuxBridge()", "function initWindowsBridge()"),
    ("const PLATFORM = 'linux';", "const PLATFORM = 'windows';"),
)

_WINDOWS_TO_LINUX_BRIDGE = tuple((b, a) for a, b in _LINUX_TO_WINDOWS_BRIDGE)


def to_windows_html(linux_html: str) -> str:
    html = linux_html.replace('class="platform-linux"', 'class="platform-windows"', 1)
    html = html.replace("linux-bridge.js", "windows-bridge.js", 1)
    if 'class="platform-windows"' not in html or "windows-bridge.js" not in html:
        raise ValueError("Linux-Seite hat nicht die erwarteten Plattform-Marken")
    if 'class="platform-linux"' in html or "linux-bridge.js" in html:
        raise ValueError("Windows-Seite enthält noch Linux-Marken")
    return html


def to_linux_html(windows_html: str) -> str:
    html = windows_html.replace('class="platform-windows"', 'class="platform-linux"', 1)
    html = html.replace("windows-bridge.js", "linux-bridge.js", 1)
    if 'class="platform-linux"' not in html or "linux-bridge.js" not in html:
        raise ValueError("Windows-Seite hat nicht die erwarteten Plattform-Marken")
    if 'class="platform-windows"' in html or "windows-bridge.js" in html:
        raise ValueError("Linux-Seite enthält noch Windows-Marken")
    return html


def to_windows_bridge(linux_bridge: str) -> str:
    bridge = linux_bridge
    for old, new in _LINUX_TO_WINDOWS_BRIDGE:
        if old not in bridge:
            raise ValueError(f"Linux-Bridge ohne erwarteten Abschnitt: {old}")
        bridge = bridge.replace(old, new, 1)
    if "const PLATFORM = 'linux'" in bridge or "initLinuxBridge" in bridge:
        raise ValueError("Windows-Bridge enthält noch Linux-Plattform")
    return bridge


def to_linux_bridge(windows_bridge: str) -> str:
    bridge = windows_bridge
    for old, new in _WINDOWS_TO_LINUX_BRIDGE:
        if old not in bridge:
            raise ValueError(f"Windows-Bridge ohne erwarteten Abschnitt: {old}")
        bridge = bridge.replace(old, new, 1)
    if "const PLATFORM = 'windows'" in bridge or "initWindowsBridge" in bridge:
        raise ValueError("Linux-Bridge enthält noch Windows-Plattform")
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


def _http_status(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "NachtBlau-Hub-Sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode(
                resp.headers.get_content_charset() or "utf-8", errors="replace"
            )
            return resp.status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, body
    except urllib.error.URLError as exc:
        return 0, str(exc.reason)


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _normalize_platform(html: str) -> str:
    """Inhalt ohne Plattform-Token — für Paritätsvergleich Bazzite ↔ Windows."""
    return (
        html.replace("platform-linux", "platform-X")
        .replace("platform-windows", "platform-X")
        .replace("linux-bridge.js", "X-bridge.js")
        .replace("windows-bridge.js", "X-bridge.js")
        .replace("Linux", "X")
        .replace("Windows", "X")
        .replace("linux", "X")
        .replace("windows", "X")
    )


def write_platform_files(linux_html: str, linux_bridge: str) -> dict:
    windows_html = to_windows_html(linux_html)
    windows_bridge = to_windows_bridge(linux_bridge)
    # Round-Trip-Sicherheit: Windows → Linux muss wieder denselben Inhalt ergeben
    round_html = to_linux_html(windows_html)
    round_bridge = to_linux_bridge(windows_bridge)
    if _normalize_platform(round_html) != _normalize_platform(linux_html):
        raise ValueError("Round-Trip HTML Bazzite↔Windows weicht ab")
    if round_bridge != linux_bridge:
        raise ValueError("Round-Trip Bridge Bazzite↔Windows weicht ab")

    OUT_BAZZITE.mkdir(parents=True, exist_ok=True)
    OUT_WINDOWS.mkdir(parents=True, exist_ok=True)
    BRIDGES.mkdir(parents=True, exist_ok=True)
    ENTRYPOINTS.mkdir(parents=True, exist_ok=True)

    (OUT_BAZZITE / "linux.html").write_text(linux_html, encoding="utf-8")
    (OUT_BAZZITE / "linux-bridge.js").write_text(linux_bridge, encoding="utf-8")
    (OUT_WINDOWS / "windows.html").write_text(windows_html, encoding="utf-8")
    (OUT_WINDOWS / "windows.htm").write_text(windows_html, encoding="utf-8")
    (OUT_WINDOWS / "windows-bridge.js").write_text(windows_bridge, encoding="utf-8")

    (BRIDGES / "linux-bridge.js").write_text(linux_bridge, encoding="utf-8")
    (BRIDGES / "windows-bridge.js").write_text(windows_bridge, encoding="utf-8")

    for name, content in (
        ("linux.html", linux_html),
        ("linux.htm", linux_html),
        ("linux-bridge.js", linux_bridge),
        ("windows.html", windows_html),
        ("windows.htm", windows_html),
        ("windows-bridge.js", windows_bridge),
    ):
        (ENTRYPOINTS / name).write_text(content, encoding="utf-8")

    report = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {"page": LINUX_PAGE, "bridge": LINUX_BRIDGE},
        "bidirectional": True,
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
        "parity": {
            "htmlNormalizedEqual": _normalize_platform(linux_html)
            == _normalize_platform(windows_html),
            "roundTripOk": True,
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


def verify_live(*, require_windows: bool = True) -> int:
    """Prüft Live-URLs. Bazzite muss OK sein; Windows optional bis Deploy."""
    failures = 0
    checks = [
        (BAZZITE_URL, 'class="platform-linux"', "linux-bridge.js", True),
        (WINDOWS_URL, 'class="platform-windows"', "windows-bridge.js", require_windows),
    ]
    bodies: dict[str, str] = {}
    for url, marker, bridge, required in checks:
        status, body = _http_status(url)
        ok = status == 200 and marker in body and bridge in body
        label = "OK" if ok else ("FEHLER" if required else "OFFEN")
        print(f"[{label}] {status} {url}")
        if ok:
            bodies[url] = body
        elif required:
            failures += 1

    if BAZZITE_URL in bodies and WINDOWS_URL in bodies:
        if _normalize_platform(bodies[BAZZITE_URL]) == _normalize_platform(
            bodies[WINDOWS_URL]
        ):
            print("[OK] Inhalt Bazzite ↔ Windows identisch (nur Plattform-Marke)")
        else:
            print("[FEHLER] Inhalt Bazzite ↔ Windows weicht ab")
            failures += 1
    elif BAZZITE_URL in bodies and WINDOWS_URL not in bodies:
        print(
            "[OFFEN] windows.html fehlt live — lokal erzeugen mit "
            "`pnpm sync:bazzite-windows -- --no-upload`, Deploy braucht FTP."
        )
    return failures


def choose_source() -> tuple[str, str, str]:
    """Nimmt die erreichbare Live-Seite als Quelle (Linux bevorzugt)."""
    linux_status, _ = _http_status(LINUX_PAGE)
    if linux_status == 200:
        print("↓ Quelle: Live Bazzite/Linux")
        return _fetch(LINUX_PAGE), _fetch(LINUX_BRIDGE), "linux"
    win_status, _ = _http_status(WINDOWS_PAGE)
    if win_status == 200:
        print("↓ Quelle: Live Windows (Linux offline) — transformiere nach Bazzite")
        wh = _fetch(WINDOWS_PAGE)
        wb = _fetch(WINDOWS_BRIDGE)
        return to_linux_html(wh), to_linux_bridge(wb), "windows"
    raise SystemExit(
        "Weder linux.html noch windows.html erreichbar — kein Sync möglich."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bazzite ↔ Windows Hub bidirektional synchronisieren"
    )
    parser.add_argument(
        "--no-upload",
        action="store_true",
        help="Nur Dateien erzeugen, nicht hochladen",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Nur Live-URLs prüfen (Windows optional)",
    )
    parser.add_argument(
        "--require-windows",
        action="store_true",
        help="Beim Check windows.html als Pflicht werten (nach Deploy)",
    )
    args = parser.parse_args()

    if args.check:
        raise SystemExit(verify_live(require_windows=args.require_windows))

    linux_html, linux_bridge, source = choose_source()
    report = write_platform_files(linux_html, linux_bridge)
    print(f"✓ Artefakte geschrieben (Quelle={source})")
    print(f"  Windows HTML   {report['windows']['htmlSha256'][:16]}")
    print(f"  Windows Bridge {report['windows']['bridgeSha256'][:16]}")
    print(f"  Parität HTML   {report['parity']['htmlNormalizedEqual']}")

    upload_paths = [
        OUT_WINDOWS / "windows.html",
        OUT_WINDOWS / "windows.htm",
        OUT_WINDOWS / "windows-bridge.js",
    ]
    if args.no_upload:
        print("Upload übersprungen (--no-upload).")
        print("Live-Status:")
        verify_live(require_windows=False)
        return

    # Credentials früh prüfen, damit der Fehler vor dem Upload-Hinweis kommt
    sys.path.insert(0, str(ROOT / "scripts"))
    from webspace_config import require_credentials

    require_credentials()
    print("↑ Windows-Seiten auf den Launcher-Webspace …")
    upload_windows(upload_paths)
    print("Live-Prüfung:")
    raise SystemExit(verify_live(require_windows=True))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Plattform-Sync fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
