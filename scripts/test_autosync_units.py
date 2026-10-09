#!/usr/bin/env python3
"""Sanity-Checks für Auto-Sync Units und Runner-Skripte."""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTO = ROOT / "scripts" / "autosync"


class AutoSyncFilesTest(unittest.TestCase):
    def test_required_files_exist(self) -> None:
        for name in (
            "run-autosync.sh",
            "Run-AutoSync.ps1",
            "install-autosync-linux.sh",
            "Install-AutoSync.ps1",
            "nachtblau-autosync.service",
            "nachtblau-autosync.timer",
            "nachtblau-autosync-logout.service",
            "autosync.env.example",
        ):
            self.assertTrue((AUTO / name).is_file(), name)

    def test_timer_has_periodic_and_startup(self) -> None:
        text = (AUTO / "nachtblau-autosync.timer").read_text(encoding="utf-8")
        self.assertIn("OnStartupSec=", text)
        self.assertIn("OnUnitActiveSec=", text)
        self.assertIn("nachtblau-autosync.service", text)

    def test_linux_runner_skips_deploy_without_ftp(self) -> None:
        text = (AUTO / "run-autosync.sh").read_text(encoding="utf-8")
        self.assertIn("FTP_USER", text)
        self.assertIn("wartet auf FTP_USER/FTP_PASS", text)
        self.assertIn("AUTO_SYNC_DESKTOP", text)

    def test_env_example_defaults(self) -> None:
        text = (AUTO / "autosync.env.example").read_text(encoding="utf-8")
        self.assertIn("AUTO_SYNC_HUB_DEPLOY=0", text)
        self.assertIn("AUTO_SYNC_SAVES=1", text)


if __name__ == "__main__":
    unittest.main()
