#!/usr/bin/env python3
"""Generate professional Silk summary PDF from HTML (WeasyPrint)."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "docs" / "silk-produktuebersicht.html"
OUT = Path("/opt/cursor/artifacts/silk-zusammenfassung.pdf")
FALLBACK = ROOT / "silk-zusammenfassung.pdf"


def find_weasyprint() -> str:
    for candidate in (
        "weasyprint",
        str(Path.home() / ".local/bin/weasyprint"),
    ):
        path = shutil.which(candidate) or (candidate if Path(candidate).is_file() else None)
        if path:
            return path
    raise RuntimeError("WeasyPrint nicht installiert (pip install weasyprint)")


def generate() -> Path:
    if not HTML.is_file():
        raise FileNotFoundError(f"HTML-Vorlage fehlt: {HTML}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    weasy = find_weasyprint()

    subprocess.run([weasy, str(HTML.resolve()), str(OUT)], check=True)

    if not OUT.is_file() or OUT.stat().st_size < 10_000:
        raise RuntimeError("PDF-Generierung fehlgeschlagen oder Datei zu klein")

    shutil.copy2(OUT, FALLBACK)
    kb = OUT.stat().st_size // 1024
    print(f"PDF erstellt: {OUT} ({kb} KB)")
    print(f"Kopie:          {FALLBACK}")
    return OUT


if __name__ == "__main__":
    try:
        generate()
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        sys.exit(1)

