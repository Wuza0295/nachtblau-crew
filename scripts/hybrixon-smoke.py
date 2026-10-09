#!/usr/bin/env python3
"""Hybrixon smoke checks without a PHP binary.

Validates critical engine invariants, SW/asset version sync, brace balance,
and optional live /api/health after deploy.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HX = ROOT / "webspace" / "hybrixon.com"


def read(rel: str) -> str:
    return (HX / rel).read_text(encoding="utf-8")


def brace_balance(src: str) -> bool:
    # Strip strings first so URLs like https:// are not treated as // comments.
    cleaned = re.sub(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"", "''", src)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.S)
    cleaned = re.sub(r"(?m)^\s*//.*?$", "", cleaned)
    cleaned = re.sub(r"(?m)(?<=[\s;{}])//.*?$", "", cleaned)
    depth = 0
    for ch in cleaned:
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth < 0:
                return False
    return depth == 0


def const_value(src: str, name: str) -> str | None:
    m = re.search(rf"const\s+{re.escape(name)}\s*=\s*'([^']*)'", src)
    return m.group(1) if m else None


def check(cond: bool, label: str, failures: list[str]) -> None:
    if cond:
        print(f"PASS: {label}")
    else:
        print(f"FAIL: {label}")
        failures.append(label)


def run_local() -> list[str]:
    failures: list[str] = []
    cfg = read("includes/config.php")
    db = read("includes/db.php")
    posts = read("includes/posts.php")
    social = read("includes/social.php")
    friends = read("includes/friends.php")
    blocks = read("includes/blocks.php")
    header = read("includes/header.php")
    footer = read("includes/footer.php")
    api = read("api/index.php")
    ht = read(".htaccess")
    sw = read("sw.js")
    engine = read("ENGINE.md")

    engine_id = const_value(cfg, "HYBRIXON_ENGINE")
    css_v = const_value(cfg, "HYBRIXON_ASSET_CSS")
    js_v = const_value(cfg, "HYBRIXON_ASSET_JS")
    sw_v = const_value(cfg, "HYBRIXON_ASSET_SW")
    static_cache = const_value(cfg, "HYBRIXON_STATIC_CACHE")

    check(engine_id is not None and engine_id.startswith("hybrixon-php85"), "engine id present", failures)
    check("hybrixon_asset_url" in cfg, "hybrixon_asset_url helper", failures)
    check("hybrixon_send_security_headers" in cfg, "security headers helper", failures)
    check("hybrixon_assert_php_runtime" in cfg, "PHP runtime gate", failures)
    check(css_v is not None and js_v is not None and sw_v is not None, "asset version constants", failures)
    check(static_cache is not None, "STATIC_CACHE constant", failures)

    check("idx_posts_created_at" in db, "posts created_at index migration", failures)
    check("idx_reactions_post_kind" in db, "reactions index migration", failures)
    check("2026100901" in db or "HYBRIXON_SCHEMA_VERSION" in db, "schema version bumped", failures)

    check("social_following_set" in social, "following request cache", failures)
    check("friends_accepted_set" in friends, "friends request cache", failures)
    check("social_blocked_set" in blocks, "blocks request cache", failures)
    check("social_following_set($viewerId)" in posts or "social_following_set($viewerId)" in posts.replace(" ", ""), "feed warms following cache", failures)
    check("AND p.user_id IN (" in posts, "feed SQL scope filter", failures)

    check("hybrixon_asset_url" in header, "header uses asset helper", failures)
    check("hybrixon_asset_url" in footer, "footer uses asset helper", failures)
    check("hybrixon_sw_url" in footer, "footer uses sw helper", failures)
    check("route === 'health'" in api, "health route", failures)

    check("max-age=604800" in ht, "htaccess long asset cache", failures)
    check("Header always set Cache-Control" in ht, "htaccess always Cache-Control", failures)
    check("ExpiresByType text/css" in ht, "htaccess ExpiresByType css", failures)
    check("AddHandler php85-cgi" in ht, "PHP 8.5 handler", failures)

    check(bool(static_cache) and static_cache in sw, "SW STATIC_CACHE matches config", failures)
    check(css_v is not None and f"style.css?v={css_v}" in sw, "SW CSS version matches config", failures)
    check(js_v is not None and f"app.js?v={js_v}" in sw, "SW JS version matches config", failures)

    check("FTPS" in engine or "sync-one-webspace" in engine, "ENGINE.md deploy notes", failures)
    check("Kein SPA-Rewrite" in engine or "kein SPA" in engine.lower() or "SPA" in engine, "ENGINE.md stack decision", failures)

    for rel in (
        "includes/config.php",
        "includes/db.php",
        "includes/posts.php",
        "includes/social.php",
        "includes/friends.php",
        "includes/blocks.php",
        "includes/header.php",
        "includes/footer.php",
        "api/index.php",
    ):
        check(brace_balance(read(rel)), f"brace balance {rel}", failures)

    # Duplicate hardcoded ?v= outside SW (CSS/JS should go through helpers)
    for rel, text in (("includes/header.php", header), ("includes/footer.php", footer)):
        hardcoded = re.findall(r"(?:style\.css|app\.js)\?v=\d+", text)
        check(not hardcoded, f"no hardcoded asset ?v= in {rel}", failures)

    return failures


def run_live(url: str, expect_engine: str | None) -> list[str]:
    failures: list[str] = []
    try:
        req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "hybrixon-smoke/1"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            data = json.loads(body)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        check(False, f"live health fetch ({exc})", failures)
        return failures

    check(bool(data.get("ok")), "live health ok", failures)
    eng = str(data.get("engine") or "")
    check(bool(eng), f"live engine present ({eng or 'missing'})", failures)
    if expect_engine:
        check(eng == expect_engine, f"live engine == {expect_engine} (got {eng})", failures)
    php = str(data.get("php") or "")
    check(php.startswith("8.5"), f"live PHP 8.5+ ({php or 'missing'})", failures)
    check(bool(data.get("sqlite")), "live sqlite true", failures)
    print(json.dumps({"engine": eng, "php": php, "assets": data.get("assets"), "schemaVersion": data.get("schemaVersion")}, ensure_ascii=False))
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Hybrixon smoke / lint")
    parser.add_argument("--live", default="", help="Health URL, e.g. https://hybrixon.com/api/health")
    parser.add_argument("--expect-engine", default="", help="Required live engine id")
    args = parser.parse_args()

    failures = run_local()
    if args.live:
        failures.extend(run_live(args.live, args.expect_engine or None))

    print("---")
    total_pass_hint = "see PASS lines above"
    print(f"{total_pass_hint}; {len(failures)} failure(s)")
    if failures:
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
