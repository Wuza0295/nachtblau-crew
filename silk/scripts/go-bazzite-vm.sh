#!/usr/bin/env bash
# Silk unter Bazzite / Fedora Atomic in einer VM testen – ein Befehl.
#
#   curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash
#   bash silk/scripts/go-bazzite-vm.sh
#   bash silk/scripts/go-bazzite-vm.sh iso    # Installer statt fertiger Disk
#
set -euo pipefail

VM_NAME="${SILK_VM_NAME:-Silk}"
MEDIA_DIR="${SILK_MEDIA_DIR:-$HOME/Silk-VMs}"
RELEASE_REPO="${SILK_RELEASE_REPO:-Wuza0295/nachtblau-crew}"
RELEASE_TAG="${SILK_RELEASE_TAG:-silk-media-latest}"
MEM_MB="${SILK_VM_MEM:-4096}"
CPUS="${SILK_VM_CPUS:-4}"
MODE="${1:-ready}"   # ready | iso | download
BASE_URL="https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}"

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

need_virt() {
  if have qemu-system-x86_64 && [[ -r /dev/kvm ]]; then
    return 0
  fi
  cat <<'EOF'

QEMU/KVM fehlt oder /dev/kvm ist nicht nutzbar.

Auf Bazzite einmalig:

  ujust setup-virtualization
  # danach ab-/anmelden (Gruppe libvirt)

Prüfen:

  ls -l /dev/kvm
  groups   # sollte libvirt oder ähnliche Gruppe enthalten

Dann dieses Skript erneut starten.
EOF
  die "Virtualisierung nicht bereit"
}

download_file() {
  local url="$1" dest="$2"
  [[ -f "$dest" ]] && return 0
  info "↓ $(basename "$dest")"
  curl -fL --retry 5 --retry-delay 3 -C - -o "$dest" "$url"
}

join_parts() {
  local base="$1"
  local out="$MEDIA_DIR/$base"
  [[ -f "$out" ]] && { echo "$out"; return 0; }
  shopt -s nullglob
  local parts=( "$MEDIA_DIR/$base.part"* )
  shopt -u nullglob
  ((${#parts[@]} > 0)) || die "Keine Teile für $base in $MEDIA_DIR"
  info "Setze $base aus ${#parts[@]} Teilen zusammen …"
  cat "${parts[@]}" > "$out"
  if [[ -f "$MEDIA_DIR/$base.sha256" ]]; then
    (cd "$MEDIA_DIR" && sha256sum -c "$base.sha256")
  fi
  echo "$out"
}

download_qcow() {
  mkdir -p "$MEDIA_DIR"
  for f in \
    Silk-VM-x86_64.qcow2.sha256 \
    Silk-VM-x86_64.qcow2.part00 \
    Silk-VM-x86_64.qcow2.part01 \
    Silk-VM-x86_64.qcow2.part02
  do
    download_file "$BASE_URL/$f" "$MEDIA_DIR/$f"
  done
  join_parts Silk-VM-x86_64.qcow2
}

download_iso() {
  mkdir -p "$MEDIA_DIR"
  for f in \
    Silk-Installer-x86_64.iso.sha256 \
    Silk-Installer-x86_64.iso.part00 \
    Silk-Installer-x86_64.iso.part01 \
    Silk-Installer-x86_64.iso.part02 \
    Silk-Installer-x86_64.iso.part03
  do
    download_file "$BASE_URL/$f" "$MEDIA_DIR/$f"
  done
  join_parts Silk-Installer-x86_64.iso
}

# Copy-on-write Overlay → Original-Disk bleibt sauber
prepare_overlay() {
  local base="$1"
  local overlay="$MEDIA_DIR/${VM_NAME}-overlay.qcow2"
  if [[ ! -f "$overlay" ]]; then
    info "Overlay anlegen (Änderungen landen nicht in der Download-Disk) …"
    qemu-img create -f qcow2 -b "$base" -F qcow2 "$overlay"
  fi
  echo "$overlay"
}

run_qemu_gtk() {
  local disk="$1"
  local extra=("${@:2}")
  info "Starte Silk in QEMU/KVM (Fenster) …"
  info "RAM=${MEM_MB}MB CPUs=${CPUS}  Disk=$disk"
  exec qemu-system-x86_64 \
    -enable-kvm -cpu host \
    -m "$MEM_MB" -smp "$CPUS" \
    -drive "file=${disk},if=virtio,format=qcow2,cache=writeback" \
    "${extra[@]}" \
    -netdev user,id=net0 -device virtio-net-pci,netdev=net0 \
    -vga virtio \
    -display gtk,gl=on \
    -usb -device usb-tablet \
    -device virtio-balloon \
    -name "$VM_NAME"
}

run_qemu_gtk_iso() {
  local iso="$1"
  local disk="$MEDIA_DIR/${VM_NAME}-install.qcow2"
  [[ -f "$disk" ]] || qemu-img create -f qcow2 "$disk" 50G
  info "Installer-ISO → QEMU (EFI empfohlen für Fedora/Atomic)"
  exec qemu-system-x86_64 \
    -enable-kvm -cpu host \
    -m "$MEM_MB" -smp "$CPUS" \
    -drive "file=${disk},if=virtio,format=qcow2,cache=writeback" \
    -cdrom "$iso" \
    -boot order=d \
    -netdev user,id=net0 -device virtio-net-pci,netdev=net0 \
    -vga virtio \
    -display gtk,gl=on \
    -usb -device usb-tablet \
    -name "$VM_NAME"
}

try_boxes() {
  local disk="$1"
  if have gnome-boxes; then
    info "GNOME Boxes gefunden – öffne Disk (Import ggf. manuell bestätigen) …"
    gnome-boxes "$disk" >/dev/null 2>&1 &
    sleep 1
    if pgrep -x gnome-boxes >/dev/null; then
      info "Boxes gestartet. Falls die VM fehlt: Boxes → + → Disk-Image → $disk"
      exit 0
    fi
  fi
  return 1
}

main() {
  case "${1:-ready}" in
    -h|--help)
      cat <<'EOF'
go-bazzite-vm.sh – Silk unter Bazzite testen

  bash go-bazzite-vm.sh           # fertige QCOW2-Disk (schnell)
  bash go-bazzite-vm.sh iso       # Installer-ISO
  bash go-bazzite-vm.sh download  # nur laden

Voraussetzung: ujust setup-virtualization
EOF
      exit 0
      ;;
  esac

  echo
  echo "  Silk VM auf Bazzite"
  echo "  Mode: $MODE  |  Ziel: $MEDIA_DIR"
  echo

  case "$MODE" in
    download)
      download_qcow >/dev/null
      download_iso >/dev/null || true
      ls -lh "$MEDIA_DIR"
      exit 0
      ;;
  esac

  need_virt

  if [[ "$MODE" == iso || "$MODE" == installer ]]; then
    iso="$(download_iso)"
    run_qemu_gtk_iso "$iso"
  fi

  # ready / default
  qcow="$(download_qcow)"
  # Boxes optional, sonst QEMU-Fenster
  if [[ "${SILK_PREFER_BOXES:-0}" == "1" ]] && try_boxes "$qcow"; then
    exit 0
  fi
  overlay="$(prepare_overlay "$qcow")"
  run_qemu_gtk "$overlay"
}

main "$@"
