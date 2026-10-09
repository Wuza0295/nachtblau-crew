#!/usr/bin/env python3
"""Tests für Hub-Sync Bazzite ↔ Windows."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("hub_sync", ROOT / "scripts" / "hub-sync.py")
hub_sync = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(hub_sync)

TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head>
  <title>NachtBlau</title>
  <link rel="stylesheet" href="styles-web.css">
</head>
<body class="platform-web">
  <h1>Web Hub</h1>
  <footer><span id="platform-label">Web</span></footer>
  <script src="site-bridge.js?v=36"></script>
</body>
</html>
"""


class RewriteTests(unittest.TestCase):
    def test_web_template_becomes_windows(self) -> None:
        html = hub_sync.rewrite_platform_html(
            TEMPLATE, platform="windows", bridge="windows-bridge.js?v=36"
        )
        self.assertIn('class="platform-windows"', html)
        self.assertIn('src="windows-bridge.js?v=36"', html)
        self.assertNotIn("platform-web", html)
        self.assertNotIn("site-bridge.js", html)

    def test_linux_live_html_becomes_windows(self) -> None:
        live = TEMPLATE.replace("platform-web", "platform-linux").replace(
            "site-bridge.js?v=36", "linux-bridge.js?v=36"
        )
        html = hub_sync.rewrite_platform_html(
            live, platform="windows", bridge="windows-bridge.js?v=36"
        )
        self.assertIn('class="platform-windows"', html)
        self.assertIn("windows-bridge.js?v=36", html)
        self.assertNotIn("platform-linux", html)
        self.assertNotIn("linux-bridge.js", html)

    def test_linux_and_windows_keep_same_body_structure(self) -> None:
        linux = hub_sync.rewrite_platform_html(
            TEMPLATE, platform="linux", bridge="linux-bridge.js?v=36"
        )
        windows = hub_sync.rewrite_platform_html(
            TEMPLATE, platform="windows", bridge="windows-bridge.js?v=36"
        )
        self.assertEqual(
            linux.replace("linux", "X").replace("Linux", "X"),
            windows.replace("windows", "X").replace("Windows", "X"),
        )


class ApplyPlatformsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="hub-sync-"))
        self.hub = self.tmp / "apps" / "nachtblau-hub"
        self.bridges = self.hub / "bridges"
        self.shared = self.hub / "shared"
        self.bridges.mkdir(parents=True)
        self.shared.mkdir()
        (self.shared / "index.html").write_text(TEMPLATE, encoding="utf-8")
        (self.shared / "site-bridge.js").write_text("/* web */", encoding="utf-8")
        for name in ("linux", "windows", "android"):
            (self.bridges / f"{name}-bridge.js").write_text(
                f"/* {name} */", encoding="utf-8"
            )
            plat_dir = self.hub / name
            plat_dir.mkdir(exist_ok=True)
            css = plat_dir / f"styles-{name}.css"
            css.write_text(f".platform-{name} {{}}", encoding="utf-8")

        hub_sync.ROOT = self.tmp
        hub_sync.HUB = self.hub
        hub_sync.SHARED = self.shared
        hub_sync.LINUX_WWW = self.hub / "linux" / "www"
        hub_sync.WINDOWS_WWW = self.hub / "windows" / "www"
        hub_sync.ANDROID_WWW = self.hub / "android" / "www"
        hub_sync.BRIDGES = self.bridges
        hub_sync.WEBSPACE_ROOT = self.tmp / "webspace"
        hub_sync.WEBSPACE_LAUNCHER = hub_sync.WEBSPACE_ROOT / "launcher.nachtblau-interactive.com"
        hub_sync.ENTRYPOINTS = self.hub / "webspace-entrypoints"
        hub_sync.MANIFEST = self.hub / "sync-manifest.json"
        hub_sync.PLATFORMS = (
            (
                "linux",
                hub_sync.LINUX_WWW,
                self.bridges / "linux-bridge.js",
                "linux-bridge.js",
                "Linux Desktop",
                self.hub / "linux" / "styles-linux.css",
                "styles-linux.css",
            ),
            (
                "windows",
                hub_sync.WINDOWS_WWW,
                self.bridges / "windows-bridge.js",
                "windows-bridge.js",
                "Windows Desktop",
                self.hub / "windows" / "styles-windows.css",
                "styles-windows.css",
            ),
            (
                "android",
                hub_sync.ANDROID_WWW,
                self.bridges / "android-bridge.js",
                "android-bridge.js",
                "Android App",
                self.hub / "android" / "styles-android.css",
                "styles-android.css",
            ),
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_apply_platforms_includes_windows(self) -> None:
        counts = hub_sync.apply_platforms()
        self.assertIn("linux", counts)
        self.assertIn("windows", counts)
        self.assertIn("android", counts)
        self.assertIn("web", counts)
        win_index = (hub_sync.WINDOWS_WWW / "index.html").read_text(encoding="utf-8")
        self.assertIn("platform-windows", win_index)
        self.assertIn("windows-bridge.js", win_index)
        linux_index = (hub_sync.LINUX_WWW / "index.html").read_text(encoding="utf-8")
        self.assertIn("platform-linux", linux_index)

    def test_publish_writes_windows_html_and_htm(self) -> None:
        hub_sync.apply_platforms()
        written = hub_sync.publish_webspace_entrypoints()
        self.assertTrue(any("windows.html" in p for p in written))
        win = (hub_sync.ENTRYPOINTS / "windows.html").read_text(encoding="utf-8")
        htm = (hub_sync.ENTRYPOINTS / "windows.htm").read_text(encoding="utf-8")
        self.assertEqual(win, htm)
        self.assertIn("platform-windows", win)
        self.assertTrue((hub_sync.ENTRYPOINTS / "windows-bridge.js").is_file())
        self.assertTrue((hub_sync.ENTRYPOINTS / "linux.html").is_file())

    def test_manifest_lists_windows_path(self) -> None:
        counts = hub_sync.apply_platforms()
        hub_sync.publish_webspace_entrypoints()
        hub_sync.write_manifest(counts, "sync")
        data = json.loads(hub_sync.MANIFEST.read_text(encoding="utf-8"))
        self.assertEqual(data["action"], "sync")
        self.assertIn("windows", data["paths"])
        self.assertIn("windows", data["platforms"])
        self.assertTrue(data["windowsUrl"].endswith("/windows.html"))


if __name__ == "__main__":
    unittest.main()
