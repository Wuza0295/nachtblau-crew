#!/usr/bin/env python3
"""Check whether ALL-INKL still looks suitable for Hybrixon.

Exit codes:
  0 = ok
  1 = watch (still fine, but growing)
  2 = migrate / health failure
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request


DEFAULT_URL = "https://hybrixon.com/api/health"


def fetch(url: str, timeout: float) -> tuple[int, dict, float]:
    t0 = time.perf_counter()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "hybrixon-hosting-monitor/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8", errors="replace")
        elapsed_ms = (time.perf_counter() - t0) * 1000
        data = json.loads(body) if body else {}
        return int(resp.status), data if isinstance(data, dict) else {}, elapsed_ms


def main() -> int:
    parser = argparse.ArgumentParser(description="Monitor Hybrixon ALL-INKL hosting fitness")
    parser.add_argument("--url", default=DEFAULT_URL, help="Health endpoint URL")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--fail-on-watch", action="store_true", help="Exit 1 also when verdict=watch")
    args = parser.parse_args()

    try:
        status, data, http_ms = fetch(args.url, args.timeout)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"FAIL: health request error: {exc}", file=sys.stderr)
        return 2

    if status != 200 or not data.get("ok"):
        print(f"FAIL: health not ok (HTTP {status}): {data!r}", file=sys.stderr)
        return 2

    hosting = data.get("hosting") if isinstance(data.get("hosting"), dict) else {}
    verdict = str(hosting.get("verdict") or "ok")
    score = int(hosting.get("score") or 0)
    recommendation = str(hosting.get("recommendation") or "")
    signals = hosting.get("signals") if isinstance(hosting.get("signals"), list) else []

    print(f"engine={data.get('engine')} php={data.get('php')} http_ms={http_ms:.0f}")
    print(f"verdict={verdict} score={score}")
    if recommendation:
        print(recommendation)
    for sig in signals:
        if isinstance(sig, dict):
            print(f"  [{sig.get('level')}] {sig.get('code')}: {sig.get('message')}")

    if verdict == "migrate":
        return 2
    if verdict == "watch" and args.fail_on_watch:
        return 1
    if verdict == "watch":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
