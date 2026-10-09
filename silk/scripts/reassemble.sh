#!/usr/bin/env bash
# Silk-Medien aus Split-Teilen wieder zusammensetzen
set -euo pipefail
cd "$(dirname "$0")"

join_one() {
  local base="$1"
  if [[ -f "$base" ]]; then
    echo "Bereits vorhanden: $base"
    return 0
  fi
  local parts=( "${base}.part"* )
  if [[ ! -e "${parts[0]:-}" ]]; then
    echo "Keine Teile für $base gefunden." >&2
    return 1
  fi
  echo "Setze $base aus ${#parts[@]} Teilen zusammen …"
  cat "${base}.part"* > "$base"
  if [[ -f "${base}.sha256" ]]; then
    sha256sum -c "${base}.sha256"
  fi
  echo "Fertig: $base"
}

join_one Silk-Installer-x86_64.iso || true
join_one Silk-VM-x86_64.qcow2 || true
