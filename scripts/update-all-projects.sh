#!/usr/bin/env bash
# Sync all open PR branches with the latest update branch and refresh dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPDATE_BRANCH="${1:-cursor/update-all-projects-ed91}"

cd "$ROOT"
git fetch origin

BRANCHES=(
  cursor/webspace-sync-1690
  cursor/webspace-resync-3b23
  cursor/linux-android-webspace-sync-56ee
  cursor/all-inkl-partner-banner-e2ae
  cursor/hybrixon-webspace-suche-84c9
  cursor/cursor-addons-projekte-7be2
  cursor/webspace-backup-system-84c9
  cursor/iron-front-update-3-3e77
  cursor/launcher-neuaufbau-39ab
  cursor/launcher-android-app-2a02
  cursor/autic-tresures-marketplace-e97d
  cursor/setup-dev-environment-2b45
)

update_deps() {
  local dir="$1"
  if [[ -f "$dir/package.json" ]]; then
    echo "  → pnpm update in $dir"
    (cd "$dir" && pnpm install --frozen-lockfile 2>/dev/null || pnpm install)
    (cd "$dir" && pnpm update 2>/dev/null || true)
  fi
}

for branch in "${BRANCHES[@]}"; do
  echo ""
  echo "=== $branch ==="
  git checkout -B "$branch" "origin/$branch" 2>/dev/null || {
    echo "  ! Branch nicht gefunden, überspringe"
    continue
  }

  if git merge "origin/$UPDATE_BRANCH" -m "chore: Mit $UPDATE_BRANCH synchronisieren (Projekt-Update $(date +%Y-%m-%d))" --no-edit; then
    echo "  Merge OK"
  else
    echo "  ! Merge-Konflikt – manuell lösen nötig"
    git merge --abort 2>/dev/null || true
    continue
  fi

  update_deps "$ROOT"
  [[ -d "$ROOT/apps/nachtblau-hub/android" ]] && update_deps "$ROOT/apps/nachtblau-hub/android"
  [[ -d "$ROOT/apps/nachtblau-hub/linux" ]] && update_deps "$ROOT/apps/nachtblau-hub/linux"

  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "chore: Dependencies nach Projekt-Update $(date +%Y-%m-%d) aktualisieren"
  fi

  git push -u origin "$branch"
done

git checkout "$UPDATE_BRANCH"
echo ""
echo "Fertig. Alle Branches mit $UPDATE_BRANCH synchronisiert."
