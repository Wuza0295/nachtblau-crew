#!/usr/bin/env python3
"""Dual-Boot Spielstand-Sync Bazzite ↔ Windows über gemeinsamen Sync-Root.

Nur ein OS ist gleichzeitig aktiv. Strategie: neuerer Stand gewinnt
(mtime) in beide Richtungen zwischen lokalem Pfad und Sync-Root (NTFS o. Ä.).

  NACHTBLAU_SYNC_ROOT=/mnt/nachtblau-sync  pnpm sync:saves
  NACHTBLAU_SYNC_ROOT=D:\\NachtBlauSync    python scripts/dualboot/sync_saves.py sync
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).resolve().parent / "manifest.json"


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def expand(path: str) -> Path:
    home = str(Path.home())
    appdata = os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming"))
    local = os.environ.get(
        "LOCALAPPDATA", str(Path.home() / "AppData" / "Local")
    )
    out = (
        path.replace("$HOME", home)
        .replace("~", home)
        .replace("$APPDATA", appdata)
        .replace("$LOCALAPPDATA", local)
    )
    return Path(out).expanduser()


def detect_platform() -> str:
    return "windows" if os.name == "nt" else "linux"


def resolve_sync_root(manifest: dict) -> Path:
    env_key = manifest.get("syncRootEnv", "NACHTBLAU_SYNC_ROOT")
    if os.environ.get(env_key):
        return Path(os.environ[env_key]).expanduser()
    plat = detect_platform()
    return Path(manifest["defaults"][plat])


def _mtime(path: Path) -> float:
    try:
        return path.stat().st_mtime
    except OSError:
        return 0.0


def _copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def _sync_file(local: Path, shared: Path, mode: str) -> str:
    local_exists = local.is_file()
    shared_exists = shared.is_file()
    if mode == "push":
        if not local_exists:
            return "skip-missing-local"
        _copy_file(local, shared)
        return "push"
    if mode == "pull":
        if not shared_exists:
            return "skip-missing-shared"
        _copy_file(shared, local)
        return "pull"
    # sync: newer wins
    if local_exists and not shared_exists:
        _copy_file(local, shared)
        return "push-init"
    if shared_exists and not local_exists:
        _copy_file(shared, local)
        return "pull-init"
    if not local_exists and not shared_exists:
        return "skip-both-missing"
    lm, sm = _mtime(local), _mtime(shared)
    if abs(lm - sm) < 1e-6:
        return "equal"
    if lm > sm:
        _copy_file(local, shared)
        return "push-newer"
    _copy_file(shared, local)
    return "pull-newer"


def _sync_tree(local: Path, shared: Path, mode: str) -> str:
    local_exists = local.is_dir()
    shared_exists = shared.is_dir()
    if mode == "push":
        if not local_exists:
            return "skip-missing-local"
        if shared.exists():
            shutil.rmtree(shared)
        shutil.copytree(local, shared, dirs_exist_ok=False)
        return "push"
    if mode == "pull":
        if not shared_exists:
            return "skip-missing-shared"
        if local.exists():
            shutil.rmtree(local)
        local.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(shared, local, dirs_exist_ok=False)
        return "pull"
    if local_exists and not shared_exists:
        shutil.copytree(local, shared)
        return "push-init"
    if shared_exists and not local_exists:
        local.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(shared, local)
        return "pull-init"
    if not local_exists and not shared_exists:
        return "skip-both-missing"
    # Beide existieren: Datei für Datei neuerer Stand
    copied_to_shared = 0
    copied_to_local = 0
    shared.mkdir(parents=True, exist_ok=True)
    local.mkdir(parents=True, exist_ok=True)
    locals = {p.relative_to(local): p for p in local.rglob("*") if p.is_file()}
    shareds = {p.relative_to(shared): p for p in shared.rglob("*") if p.is_file()}
    for rel in sorted(set(locals) | set(shareds)):
        lp, sp = local / rel, shared / rel
        if rel in locals and rel not in shareds:
            _copy_file(lp, sp)
            copied_to_shared += 1
        elif rel in shareds and rel not in locals:
            _copy_file(sp, lp)
            copied_to_local += 1
        else:
            if _mtime(lp) > _mtime(sp) + 1e-6:
                _copy_file(lp, sp)
                copied_to_shared += 1
            elif _mtime(sp) > _mtime(lp) + 1e-6:
                _copy_file(sp, lp)
                copied_to_local += 1
    return f"merged +{copied_to_shared}→shared +{copied_to_local}→local"


def iterate_pairs(cat: dict, plat: str):
    paths = cat.get(plat) or []
    shared_rel = cat["shared"]
    kind = cat.get("type", "dir")
    if kind == "file" and len(paths) > 1:
        # Mehrere Dateien → shared/<basename>
        for p in paths:
            yield expand(p), shared_rel, "file"
    else:
        for p in paths:
            yield expand(p), shared_rel, kind


def run(mode: str, *, categories: set[str] | None = None, dry_run: bool = False) -> int:
    manifest = load_manifest()
    plat = detect_platform()
    sync_root = resolve_sync_root(manifest)
    print(f"Plattform: {plat}")
    print(f"Sync-Root: {sync_root}  (Env {manifest['syncRootEnv']})")
    if mode != "status" and not dry_run:
        sync_root.mkdir(parents=True, exist_ok=True)

    actions = 0
    for cat in manifest["categories"]:
        cid = cat["id"]
        if categories and cid not in categories:
            continue
        optional = bool(cat.get("optional"))
        print(f"\n· {cid} — {cat['label']}")
        pairs = list(iterate_pairs(cat, plat))
        if not pairs:
            print("  (kein Pfad für diese Plattform)")
            continue
        multi_files = cat.get("type") == "file" and len(cat.get(plat) or []) > 1
        for local, shared_rel, kind in pairs:
            if multi_files:
                shared = sync_root / shared_rel / local.name
            else:
                shared = sync_root / shared_rel
            exists_note = []
            if local.exists():
                exists_note.append("lokal")
            if shared.exists():
                exists_note.append("shared")
            if mode == "status":
                print(f"  {local} ↔ {shared}  [{'/'.join(exists_note) or 'fehlt'}]")
                continue
            if dry_run:
                print(f"  DRY {mode}: {local} ↔ {shared}")
                continue
            if kind == "file":
                result = _sync_file(local, shared, mode)
            else:
                result = _sync_tree(local, shared, mode)
            print(f"  {result}: {local.name}")
            if result.startswith("skip") and optional:
                continue
            if not result.startswith("skip") and result != "equal":
                actions += 1

    if mode == "status":
        print("\nAußer Scope:")
        for line in manifest.get("outOfScope", []):
            print(f"  – {line}")
    else:
        print(f"\n✓ Fertig ({actions} Übertragungen).")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Dual-Boot Spielstände synchronisieren")
    parser.add_argument(
        "command",
        choices=["sync", "push", "pull", "status"],
        help="sync=neuerer gewinnt; push=lokal→shared; pull=shared→lokal; status",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Nur Kategorie-ID (mehrfach möglich)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    cats = set(args.only) if args.only else None
    raise SystemExit(run(args.command, categories=cats, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
