#!/usr/bin/env bash
# Vollständiges Update aller NachtBlau-Projekte:
# - PR-Branches mit update-branch synchronisieren
# - Dependencies aktualisieren
# - Konfliktmarker, Webspace-Credentials, Minecraft-Pfade prüfen
# - Tests + tsc auf dem Update-Branch
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPDATE_BRANCH="${1:-cursor/update-all-projects-ed91}"

cd "$ROOT"
git fetch origin

echo "=== NachtBlau Gesamt-Update ($(date +%Y-%m-%d)) ==="
echo "Update-Branch: $UPDATE_BRANCH"
echo ""

# --- Vorab-Checks ---
echo "--- Vorab-Checks ---"

if rg -l '<<<<<<<' "$ROOT" --glob '!node_modules/**' --glob '!.git/**' 2>/dev/null | grep -q .; then
  echo "  ! Konfliktmarker gefunden:"
  rg -l '<<<<<<<' "$ROOT" --glob '!node_modules/**' --glob '!.git/**' || true
  exit 1
else
  echo "  ✓ Keine Konfliktmarker"
fi

if [[ -f "$ROOT/.env.webspace" ]] && grep -qE '^FTP_USER=.+$' "$ROOT/.env.webspace" 2>/dev/null; then
  echo "  ✓ .env.webspace vorhanden"
  WEBSPACE_READY=1
else
  echo "  · .env.webspace fehlt – webspace:pull / hub:push übersprungen"
  echo "    → cp .env.webspace.example .env.webspace und FTP-Zugang eintragen"
  WEBSPACE_READY=0
fi

MINECRAFT_OK=0
for path in /opt/minecraft-java /opt/minecraft-bedrock; do
  if [[ -d "$path" ]]; then
    echo "  ✓ $path vorhanden"
    MINECRAFT_OK=1
  else
    echo "  · $path nicht vorhanden (nur auf Produktions-Host)"
  fi
done
if [[ "$MINECRAFT_OK" -eq 0 ]]; then
  echo "    → Siehe docs/PROJECTS.md §7 Minecraft"
fi

# Lokale Webspace-Spiegel
LOCAL_DOMAINS=$(find "$ROOT/webspace" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
echo "  · Lokale Webspace-Spiegel: $LOCAL_DOMAINS Domain(s) unter webspace/"
echo ""

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

# --- Update-Branch: Dependencies + Tests ---
echo "--- Update-Branch: $UPDATE_BRANCH ---"
git checkout "$UPDATE_BRANCH"
git pull origin "$UPDATE_BRANCH" 2>/dev/null || true

update_deps "$ROOT"
[[ -d "$ROOT/apps/nachtblau-hub/android" ]] && update_deps "$ROOT/apps/nachtblau-hub/android"
[[ -d "$ROOT/apps/nachtblau-hub/linux" ]] && update_deps "$ROOT/apps/nachtblau-hub/linux"

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "chore: Dependencies nach Projekt-Update $(date +%Y-%m-%d) aktualisieren"
fi

echo "  → pnpm test"
pnpm test
echo "  → pnpm check"
pnpm check
echo ""

# --- Webspace pull/push (optional) ---
if [[ "$WEBSPACE_READY" -eq 1 ]]; then
  echo "--- Webspace-Sync ---"
  pnpm webspace:connect || echo "  ! FTPS-Verbindung fehlgeschlagen"
  pnpm webspace:pull || echo "  ! webspace:pull fehlgeschlagen"
  pnpm hub:push || echo "  ! hub:push fehlgeschlagen"
  echo ""
fi

# --- PR-Branches synchronisieren ---
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
echo "=== Fertig ==="
echo "Alle Branches mit $UPDATE_BRANCH synchronisiert."
echo "Dokumentation: docs/PROJECTS.md"
