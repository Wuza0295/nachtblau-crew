#!/usr/bin/env bash
# GitHub Release-Assets: Dateien >2 GiB splitten (API-Limit 2147483648).
set -euo pipefail

DIR="${1:-.}"
# Sicher unter dem Limit (2 GiB), etwas Puffer
PART_SIZE="${SILK_PART_SIZE:-1900M}"
LIMIT="${SILK_SIZE_LIMIT:-2147483648}"

cd "$DIR"
shopt -s nullglob

prepare_one() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local size
  size="$(stat -c%s "$f")"
  if (( size < LIMIT )); then
    echo "OK (unter Limit): $f ($size bytes)"
    return 0
  fi
  echo "Splitte $f ($size bytes) in ${PART_SIZE}-Teile …"
  # part00, part01, …
  split -b "$PART_SIZE" -d -a 2 "$f" "${f}.part"
  rm -f "$f"
  ls -lh "${f}.part"*
}

for f in Silk-Installer-x86_64.iso Silk-VM-x86_64.qcow2; do
  prepare_one "$f"
done

cat > reassemble.sh <<'EOF'
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

join_one Silk-Installer-x86_64.iso
join_one Silk-VM-x86_64.qcow2 || true
EOF
chmod +x reassemble.sh

cat > README-DOWNLOAD.txt <<'EOF'
Silk Install Media
==================

GitHub Releases erlauben max. ~2 GiB pro Datei. Deshalb ist das ISO/QCOW ggf. gesplittet:

  Silk-Installer-x86_64.iso.part00
  Silk-Installer-x86_64.iso.part01
  …

Zusammenfügen (Linux/macOS):

  bash reassemble.sh

oder manuell:

  cat Silk-Installer-x86_64.iso.part* > Silk-Installer-x86_64.iso
  sha256sum -c Silk-Installer-x86_64.iso.sha256

VirtualBox: EFI-VM anlegen, ISO als optisches Medium, Silk installieren.
Kein Aurora-Download nötig.
EOF

echo "=== Release-Assets bereit ==="
ls -lh
