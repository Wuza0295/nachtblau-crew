#!/usr/bin/env python3
"""Prüft bidirektionalen Bazzite ↔ Windows Transform (HTML + Bridge)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sync_bazzite_windows import (
    _normalize_platform,
    to_linux_bridge,
    to_linux_html,
    to_windows_bridge,
    to_windows_html,
)

LINUX_HTML = """<!DOCTYPE html>
<html lang="de">
<body class="platform-linux">
  <script src="linux-bridge.js?v=36"></script>
</body>
</html>
"""

LINUX_BRIDGE = """/**
 * Linux-Bridge für launcher.nachtblau-interactive.com
 * Gleiche Katalog-/Content-Quelle wie Web — Platform: linux
 */
(function initLinuxBridge() {
  const PLATFORM = 'linux';
  const REMOTE_HUB = 'https://launcher.nachtblau-interactive.com/';
})();
"""


class PlatformSyncTest(unittest.TestCase):
    def test_windows_html_keeps_content_and_swaps_platform(self) -> None:
        windows = to_windows_html(LINUX_HTML)
        self.assertIn('class="platform-windows"', windows)
        self.assertIn('src="windows-bridge.js?v=36"', windows)
        self.assertNotIn("platform-linux", windows)
        self.assertNotIn("linux-bridge.js", windows)

    def test_windows_bridge_only_changes_platform_token(self) -> None:
        windows = to_windows_bridge(LINUX_BRIDGE)
        self.assertIn("const PLATFORM = 'windows';", windows)
        self.assertIn("initWindowsBridge", windows)
        self.assertIn("Windows-Bridge", windows)
        self.assertNotIn("initLinuxBridge", windows)
        self.assertNotIn("const PLATFORM = 'linux'", windows)

    def test_round_trip_html(self) -> None:
        windows = to_windows_html(LINUX_HTML)
        back = to_linux_html(windows)
        self.assertEqual(_normalize_platform(back), _normalize_platform(LINUX_HTML))
        self.assertEqual(back, LINUX_HTML)

    def test_round_trip_bridge(self) -> None:
        windows = to_windows_bridge(LINUX_BRIDGE)
        back = to_linux_bridge(windows)
        self.assertEqual(back, LINUX_BRIDGE)

    def test_rejects_unexpected_linux_page(self) -> None:
        with self.assertRaises(ValueError):
            to_windows_html("<html><body></body></html>")

    def test_normalized_parity(self) -> None:
        windows = to_windows_html(LINUX_HTML)
        self.assertEqual(
            _normalize_platform(LINUX_HTML), _normalize_platform(windows)
        )


if __name__ == "__main__":
    unittest.main()
