#!/usr/bin/env python3
"""Deploy vorbereiten: Artefakte erzeugen, FTP-Status melden — kein Fake-Upload."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

REPORT = ROOT / "apps" / "nachtblau-hub" / "deploy-readiness.json"


def _has_ftp() -> tuple[bool, str]:
    # .env.webspace laden (ohne Werte zu loggen)
    env_file = ROOT / ".env.webspace"
    if env_file.is_file():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip("'").strip('"')
            if key and key not in os.environ:
                os.environ[key] = value
    user = bool(os.environ.get("FTP_USER", "").strip())
    password = bool(os.environ.get("FTP_PASS", "").strip())
    if user and password:
        return True, "FTP_USER und FTP_PASS sind gesetzt"
    missing = []
    if not user:
        missing.append("FTP_USER")
    if not password:
        missing.append("FTP_PASS")
    return False, "fehlt: " + ", ".join(missing)


def main() -> int:
    from sync_bazzite_windows import verify_live, write_platform_files, choose_source

    print("=== Deploy-Vorbereitung (NachtBlau Hub Windows) ===\n")
    ready_ftp, ftp_msg = _has_ftp()
    print(f"FTP-Credentials: {'OK' if ready_ftp else 'WARTET'} — {ftp_msg}")

    print("\n↓ Live-Quelle laden und Artefakte schreiben …")
    linux_html, linux_bridge, source = choose_source()
    report = write_platform_files(linux_html, linux_bridge)
    print(f"✓ Artefakte (Quelle={source})")
    print(f"  windows.html sha {report['windows']['htmlSha256'][:16]}")

    print("\nLive-Check:")
    live_fail = verify_live(require_windows=False)

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "ftpReady": ready_ftp,
        "ftpStatus": ftp_msg,
        "waitingOn": None if ready_ftp else "FTP_USER/FTP_PASS (ALL-INKL)",
        "liveWindowsMissing": live_fail == 0,  # verify returns 0 if linux ok even when windows offen
        "artifacts": {
            "windowsHtml": "apps/nachtblau-hub/webspace-entrypoints/windows.html",
            "windowsBridge": "apps/nachtblau-hub/webspace-entrypoints/windows-bridge.js",
            "platforms": "apps/nachtblau-hub/platforms/windows/",
        },
        "nextCommands": [
            "cp .env.webspace.example .env.webspace  # FTP_USER/FTP_PASS eintragen",
            "pnpm deploy:windows-hub                 # Upload windows.html/.htm/bridge",
            "pnpm hub:check -- --require-windows     # Live-Parität prüfen",
        ],
        "host": os.environ.get("FTP_HOST", "w02176b7.kasserver.com"),
        "remoteDir": "/launcher.nachtblau-interactive.com",
    }
    # Korrekter Hinweis: windows fehlt live
    from sync_bazzite_windows import WINDOWS_URL, _http_status

    status, _ = _http_status(WINDOWS_URL)
    payload["liveWindowsHttp"] = status
    payload["liveWindowsMissing"] = status != 200

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"\n✓ Report: {REPORT.relative_to(ROOT)}")

    if not ready_ftp:
        print(
            "\n⚠ Deploy wartet auf FTP_USER/FTP_PASS — keine Fake-Credentials.\n"
            "  Secrets in Cursor Cloud Environment oder lokal .env.webspace setzen,\n"
            "  dann: pnpm deploy:windows-hub"
        )
        return 2
    print("\nFTP bereit — Upload mit: pnpm deploy:windows-hub")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as exc:
        print(f"deploy_prepare fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
