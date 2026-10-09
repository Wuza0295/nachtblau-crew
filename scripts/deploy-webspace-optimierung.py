#!/usr/bin/env python3
"""Deploy NachtBlau GbR + Hybrixon Optimierungen via FTPS (GitHub Secrets)."""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import (  # noqa: E402
    FTP_HOST,
    FTP_USER,
    WEBSPACE_ROOT,
    connect_ftp,
    cwd_makedirs,
    mirror_index_htm,
    require_credentials,
    upload_tree,
)


def verify_nachtblau_live() -> None:
    url = "https://nacht-blau.de/"
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "NachtBlauDeploy/1"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    if "NachtBlau" not in html:
        raise SystemExit("Live-Check fehlgeschlagen: 'NachtBlau' nicht in https://nacht-blau.de/")
    if "ALL-INKL" in html and "Parkseite" in html:
        raise SystemExit("Live-Check: Parkseite noch aktiv")
    # Parking page is XHTML transitional with empty title and huge base64 img
    if 'DTD XHTML 1.0 Transitional' in html and "<title></title>" in html:
        raise SystemExit("Live-Check: ALL-INKL-Parkseite noch ausgeliefert")
    print("✓ Live nacht-blau.de enthält Markeninhalt")


def deploy_domain(ftp, domain: str) -> int:
    local = WEBSPACE_ROOT / domain
    if not local.is_dir():
        print(f"· skip missing {domain}")
        return 0
    remote = f"/{domain}"
    print(f"\n→ {domain} → {remote}")
    cwd_makedirs(ftp, remote)
    count = upload_tree(ftp, local)
    if domain == "nacht-blau.de":
        count += mirror_index_htm(ftp, local)
    print(f"✓ {domain}: {count} Dateien hochgeladen/aktualisiert")
    return count


def main() -> None:
    require_credentials()
    print(f"Verbinde mit {FTP_HOST} als {FTP_USER} …")
    ftp = connect_ftp()
    try:
        total = 0
        total += deploy_domain(ftp, "nacht-blau.de")
        total += deploy_domain(ftp, "hybrixon.com")
        print(f"\n✓ Deploy fertig ({total} Dateien gesamt)")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()

    verify_nachtblau_live()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"Deploy fehlgeschlagen: {exc}", file=sys.stderr)
        sys.exit(1)
