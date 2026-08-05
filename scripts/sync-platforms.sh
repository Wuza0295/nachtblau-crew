#!/usr/bin/env bash
# Einheitlicher Sync: gleicher App-Stand für Manus (Linux/PWA/Android), Webspace GbR + Allxion.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOAD=0
SKIP_TESTS=0
API_ORIGIN="${VITE_API_ORIGIN:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --) shift; continue ;;
    --upload) UPLOAD=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
    --api-origin)
      API_ORIGIN="${2:?}"
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage: pnpm sync:platforms [-- --upload] [-- --skip-tests] [-- --api-origin URL]

  1. Tests (Vitest)
  2. Allxion-Build nach webspace/nacht-blau.de/allxion/ (Linux/Android im Browser + PWA auf nacht-blau.de)
  3. Optional: FTPS-Upload der GbR-Domain (nur mit .env.webspace oder FTP_* env)

Manus-Deploy (volle App mit Backend): nach Merge „Deploy“ in Manus — gleicher Git-Stand wie hier.

Für identische Login-/Social-Daten auf nacht-blau.de/allxion/:
  export VITE_API_ORIGIN=https://<dein-manus-deploy>
  pnpm sync:platforms -- --upload
EOF
      exit 0
      ;;
    *)
      echo "Unbekanntes Argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$SKIP_TESTS" -eq 0 ]]; then
  echo "==> Tests"
  pnpm test
fi

if [[ -n "$API_ORIGIN" ]]; then
  export VITE_API_ORIGIN="$API_ORIGIN"
  echo "==> VITE_API_ORIGIN=$API_ORIGIN"
fi

echo "==> Allxion bauen & nach webspace/ stagen"
pnpm webspace:build-allxion

if [[ "$UPLOAD" -eq 1 ]]; then
  echo "==> Webspace upload (nacht-blau.de)"
  pnpm webspace:sync:nacht-blau
else
  echo "==> Fertig (lokal). Für Live-Upload: pnpm sync:platforms -- --upload"
fi
