#!/usr/bin/env bash
# Einheitlicher Git-/Projekt-Sync für Bazzite (Linux) und WSL.
# Windows (native PowerShell): scripts/windows/Sync-NachtBlauRepo.ps1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH=""
REMOTE="${SYNC_REMOTE:-origin}"
RUN_TESTS=0
START_WEBSITE=0
SILK_CONFIG=1
SYNC_SAVES=0

usage() {
  cat <<'EOF'
Usage: ./scripts/sync-bazzite-windows.sh [Optionen]

  Holt den gleichen Stand von GitHub auf Bazzite, Fedora Atomic oder WSL (Windows).

Optionen:
  --branch NAME     Git-Branch (Standard: aktueller Branch, sonst SYNC_BRANCH oder main)
  --skip-silk-config  Kein silk-sync-config ausführen
  --saves           Dual-Boot Spielstände syncen (NACHTBLAU_SYNC_ROOT)
  --test            Nach Sync: pnpm test
  --website         Silk-Website lokal starten (start.sh)
  -h, --help        Diese Hilfe

Windows (ohne WSL):
  powershell -ExecutionPolicy Bypass -File scripts\windows\Sync-NachtBlauRepo.ps1

Doku: docs/SYNC-BAZZITE-WINDOWS.md
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="${2:?}"
      shift 2
      ;;
    --skip-silk-config) SILK_CONFIG=0; shift ;;
    --saves) SYNC_SAVES=1; shift ;;
    --test) RUN_TESTS=1; shift ;;
    --website) START_WEBSITE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unbekanntes Argument: $1" >&2; usage; exit 1 ;;
  esac
done

info() { printf '\n==> %s\n' "$*"; }

info "Repository: $ROOT"
info "Remote $REMOTE, Branch $BRANCH"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Fehler: Kein Git-Repository. Klone zuerst:" >&2
  echo "  git clone https://github.com/Wuza0295/nachtblau-crew.git ~/nachtblau-crew" >&2
  exit 1
fi

current="$(git branch --show-current 2>/dev/null || true)"
if [[ -z "$BRANCH" ]]; then
  BRANCH="${SYNC_BRANCH:-${current:-main}}"
fi
if [[ -z "$current" || "$current" == "$BRANCH" ]]; then
  :
elif [[ -n "$current" ]]; then
  info "Bleibe auf Branch '$current' (nicht '$BRANCH'). Zum Umschalten: --branch $BRANCH"
  BRANCH="$current"
else
  info "Checkout $BRANCH"
  git fetch "$REMOTE" "$BRANCH"
  git checkout "$BRANCH"
fi

info "git fetch & pull ($BRANCH)"
git fetch "$REMOTE" "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

if [[ -f package.json ]] && command -v pnpm >/dev/null 2>&1; then
  info "pnpm install"
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
elif [[ -f package.json ]] && command -v corepack >/dev/null 2>&1; then
  info "corepack pnpm install"
  corepack enable pnpm 2>/dev/null || true
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi

if [[ "$SILK_CONFIG" -eq 1 ]]; then
  SYNC_BIN="${ROOT}/silk/system_files/usr/bin/silk-sync-config"
  if [[ -x "$SYNC_BIN" ]]; then
    info "Silk-Konfiguration (App-Listen, Aliases)"
    bash "$SYNC_BIN"
  elif [[ -f "$SYNC_BIN" ]]; then
    info "Silk-Konfiguration"
    bash "$SYNC_BIN"
  fi
fi

if [[ "$SYNC_SAVES" -eq 1 ]]; then
  info "Dual-Boot Spielstände (NACHTBLAU_SYNC_ROOT=${NACHTBLAU_SYNC_ROOT:-/mnt/nachtblau-sync})"
  bash "$ROOT/scripts/dualboot/sync-saves.sh" sync
fi

if [[ "$RUN_TESTS" -eq 1 ]]; then
  info "Tests (Vitest)"
  pnpm test
fi

info "Sync fertig – Commit: $(git rev-parse --short HEAD) ($(git log -1 --format=%s))"

if [[ "$START_WEBSITE" -eq 1 ]]; then
  if [[ -x "${ROOT}/Silk-Website/start.sh" ]]; then
    info "Silk-Website starten …"
    exec "${ROOT}/Silk-Website/start.sh"
  fi
  echo "Silk-Website/start.sh fehlt." >&2
  exit 1
fi

cat <<EOF

Nächste Schritte auf diesem System:
  • Silk-Website:  cd Silk-Website && ./start.sh
  • Silk testen:   ./Silk-Website/scripts/test-silk-on-bazzite.sh --status
  • App dev:       pnpm dev

Auf Windows (PowerShell im Repo):
  .\\scripts\\windows\\Sync-NachtBlauRepo.ps1
  .\\silk\\windows\\Install-SilkVM.ps1   # optional: Silk-VM

EOF
