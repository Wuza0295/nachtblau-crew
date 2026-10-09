#!/usr/bin/env python3
"""Tests für Dual-Boot Spielstand-Sync (ohne echte Minecraft-Pfade)."""

from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "sync_saves", ROOT / "scripts" / "dualboot" / "sync_saves.py"
)
mod = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(mod)


class ManifestTests(unittest.TestCase):
    def test_manifest_loads_and_has_bidirectional_categories(self) -> None:
        data = mod.load_manifest()
        self.assertGreaterEqual(len(data["categories"]), 3)
        for cat in data["categories"]:
            self.assertTrue(cat.get("bidirectional"))
            self.assertIn("linux", cat)
            self.assertIn("windows", cat)
            self.assertIn("shared", cat)
        self.assertTrue(data.get("outOfScope"))


class SyncFileTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="dualboot-"))
        self.local = self.tmp / "local" / "saves"
        self.shared = self.tmp / "shared" / "saves"
        self.local.mkdir(parents=True)
        (self.local / "world.txt").write_text("v1", encoding="utf-8")

    def tearDown(self) -> None:
        import shutil

        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_push_init_then_pull_newer(self) -> None:
        result = mod._sync_tree(self.local, self.shared, "sync")
        self.assertEqual(result, "push-init")
        self.assertTrue((self.shared / "world.txt").is_file())
        (self.shared / "world.txt").write_text("v2", encoding="utf-8")
        # shared newer
        import time

        time.sleep(0.02)
        Path(self.shared / "world.txt").write_text("v2", encoding="utf-8")
        result = mod._sync_tree(self.local, self.shared, "sync")
        self.assertIn("local", result)
        self.assertEqual((self.local / "world.txt").read_text(encoding="utf-8"), "v2")

    def test_file_round_trip(self) -> None:
        lf = self.tmp / "a" / "servers.dat"
        sf = self.tmp / "b" / "servers.dat"
        lf.parent.mkdir(parents=True)
        lf.write_text("abc", encoding="utf-8")
        self.assertEqual(mod._sync_file(lf, sf, "sync"), "push-init")
        sf.write_text("xyz", encoding="utf-8")
        import time

        time.sleep(0.02)
        sf.write_text("xyz", encoding="utf-8")
        self.assertEqual(mod._sync_file(lf, sf, "sync"), "pull-newer")
        self.assertEqual(lf.read_text(encoding="utf-8"), "xyz")


class ExpandTests(unittest.TestCase):
    def test_expand_home(self) -> None:
        p = mod.expand("$HOME/.minecraft/saves")
        self.assertTrue(str(p).endswith(str(Path(".minecraft") / "saves")))


if __name__ == "__main__":
    unittest.main()
