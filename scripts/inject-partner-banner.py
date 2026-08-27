#!/usr/bin/env python3
"""Inject ALL-INKL partner banner into every local webspace/<domain>/ tree."""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from webspace_config import WEBSPACE_ROOT

PARTNER_MARKER = "PAC24FB89FC115D"
SHARED_BANNER = WEBSPACE_ROOT / "_shared" / "all-inkl-banner.html"
PHP_BANNER = WEBSPACE_ROOT / "hybrixon.com" / "includes" / "partner-banner.php"

SKIP_DIR_NAMES = {
    "node_modules",
    "vendor",
    "__pycache__",
    ".git",
    "uploads",
    "data",
    "spa-assets",
    "assets",
}

HTML_EXTENSIONS = {".html", ".htm"}


def banner_html() -> str:
    if not SHARED_BANNER.is_file():
        raise FileNotFoundError(f"Missing banner template: {SHARED_BANNER}")
    return SHARED_BANNER.read_text(encoding="utf-8").strip() + "\n"


def has_banner(text: str) -> bool:
    return PARTNER_MARKER in text


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIR_NAMES for part in path.parts)


def ensure_php_banner(target_includes: Path) -> None:
    dest = target_includes / "partner-banner.php"
    if dest.is_file():
        return
    if not PHP_BANNER.is_file():
        dest.write_text(
            """<?php
declare(strict_types=1);
?>
<!-- Start Partnerprogramm ALL‑INKL.COM -->
<div class="partner-banner">
  <a href="https://all-inkl.com/PAC24FB89FC115D" target="_blank" rel="noopener noreferrer">
    <img border="0" src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg" alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider" width="468" height="60" />
  </a>
</div>
<!-- Ende Partnerprogramm -->
""",
            encoding="utf-8",
        )
        return
    shutil.copy2(PHP_BANNER, dest)


def inject_footer_php(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "partner-banner.php" in text or has_banner(text):
        return False
    if "</footer>" not in text:
        return False
    updated = text.replace(
        "  </footer>",
        "    <?php require __DIR__ . '/partner-banner.php'; ?>\n  </footer>",
        1,
    )
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def inject_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if has_banner(text):
        return False

    snippet = banner_html()
    if "</footer>" in text:
        updated = text.replace("</footer>", f"{snippet}  </footer>", 1)
    elif "</body>" in text:
        updated = text.replace("</body>", f"{snippet}</body>", 1)
    else:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def process_domain(domain_dir: Path) -> list[str]:
    changed: list[str] = []
    includes = domain_dir / "includes"
    footer = includes / "footer.php"
    if footer.is_file():
        ensure_php_banner(includes)
        if inject_footer_php(footer):
            changed.append(str(footer.relative_to(WEBSPACE_ROOT)))

    for path in domain_dir.rglob("*"):
        if not path.is_file() or should_skip(path):
            continue
        if path.suffix.lower() not in HTML_EXTENSIONS:
            continue
        if path.name.startswith("."):
            continue
        if inject_html(path):
            changed.append(str(path.relative_to(WEBSPACE_ROOT)))

    return changed


def main() -> None:
    if not WEBSPACE_ROOT.is_dir():
        print(f"Kein Webspace-Verzeichnis: {WEBSPACE_ROOT}", file=sys.stderr)
        sys.exit(1)

    domains = sorted(
        p for p in WEBSPACE_ROOT.iterdir() if p.is_dir() and not p.name.startswith("_")
    )
    if not domains:
        print("Keine Domains unter webspace/ gefunden.", file=sys.stderr)
        sys.exit(1)

    total = 0
    for domain in domains:
        print(f"\n=== {domain.name} ===")
        changed = process_domain(domain)
        if not changed:
            print("  · bereits eingebunden")
            continue
        for item in changed:
            print(f"  + {item}")
            total += 1

    print(f"\n✓ {total} Datei(en) aktualisiert in {len(domains)} Domain(s).")


if __name__ == "__main__":
    main()
