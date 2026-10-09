#!/usr/bin/env bash
# Silk unter Bazzite / Fedora Atomic in einer VM testen – ein Befehl.
#
#   curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash
#   bash silk/scripts/go-bazzite-vm.sh
#   bash silk/scripts/go-bazzite-vm.sh iso
#   bash silk/scripts/go-bazzite-vm.sh download
#   bash silk/scripts/go-bazzite-vm.sh doctor   # Diagnose
#
set -euo pipefail

VM_NAME="${SILK_VM_NAME:-Silk}"
MEDIA_DIR="${SILK_MEDIA_DIR:-$HOME/Silk-VMs}"
RELEASE_REPO="${SILK_RELEASE_REPO:-Wuza0295/nachtblau-crew}"
RELEASE_TAG="${SILK_RELEASE_TAG:-silk-media-latest}"
MEM_MB="${SILK_VM_MEM:-4096}"
CPUS="${SILK_VM_CPUS:-4}"
MODE="${1:-ready}"   # ready | iso | download | doctor | virt-manager
BASE_URL="https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}"

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

find_qemu() {
  local c
  for c in qemu-system-x86_64 \
    /usr/bin/qemu-system-x86_64 \
    /usr/libexec/qemu-kvm \
    /bin/qemu-system-x86_64
  do
    if [[ -x "$c" ]] || have "$c"; then
      command -v "$c" 2>/dev/null || echo "$c"
      return 0
    fi
  done
  return 1
}

find_qemu_img() {
  if have qemu-img; then command -v qemu-img; return 0; fi
  [[ -x /usr/bin/qemu-img ]] && { echo /usr/bin/qemu-img; return 0; }
  return 1
}

cmd_doctor() {
  echo "=== Silk VM Diagnose (Bazzite) ==="
  echo "User:        $(id -un)  uid=$(id -u)"
  echo "Groups:      $(id -nG)"
  echo
  if [[ -e /dev/kvm ]]; then
    ls -l /dev/kvm
    if [[ -r /dev/kvm && -w /dev/kvm ]]; then
      echo "KVM:         nutzbar ✓"
    else
      echo "KVM:         existiert, aber keine Rechte ✗"
      echo "             → neu anmelden oder: sudo usermod -aG kvm,libvirt \$USER && newgrp libvirt"
    fi
  else
    echo "KVM:         /dev/kvm fehlt ✗  (Reboot nach ujust setup-virtualization?)"
  fi
  echo
  if QEMU_BIN="$(find_qemu)"; then
    echo "QEMU:        $QEMU_BIN ✓"
    "$QEMU_BIN" --version 2>/dev/null | head -1 || true
  else
    echo "QEMU:        qemu-system-x86_64 fehlt ✗"
  fi
  if IMG="$(find_qemu_img)"; then
    echo "qemu-img:    $IMG ✓"
  else
    echo "qemu-img:    fehlt ✗"
  fi
  echo
  have virt-manager && echo "virt-manager: $(command -v virt-manager)" || echo "virt-manager: nicht im PATH (Flatpak ok)"
  flatpak info org.virt_manager.virt-manager &>/dev/null && echo "Flatpak:     org.virt_manager.virt-manager ✓" || echo "Flatpak:     virt-manager nicht installiert"
  have gnome-boxes && echo "Boxes:       $(command -v gnome-boxes)" || true
  flatpak info org.gnome.Boxes &>/dev/null && echo "Flatpak:     org.gnome.Boxes ✓" || true
  echo
  echo "Medien:      $MEDIA_DIR"
  ls -lh "$MEDIA_DIR" 2>/dev/null | head -20 || echo "(noch leer)"
  echo
  if ! find_qemu >/dev/null; then
    cat <<'EOF'
── Fix: QEMU auf den Host legen (Bazzite) ──

  ujust setup-virtualization   # macht oft nur virt-manager + Kernel-Args
  sudo rpm-ostree install qemu-system-x86 qemu-img qemu-kvm edk2-ovmf
  sudo systemctl reboot

Danach neu anmelden und:

  curl -fsSL …/go-bazzite-vm.sh | bash

Ohne rpm-ostree: Disk laden und in virt-manager importieren:

  curl -fsSL …/go-bazzite-vm.sh | bash -s -- download
  curl -fsSL …/go-bazzite-vm.sh | bash -s -- virt-manager
EOF
  fi
}

print_fix_hint() {
  cat <<'EOF'

Was ujust setup-virtualization oft NICHT macht:
  → qemu-system-x86_64 auf dem Host installieren

Mach das:

  1) QEMU layer'n und neu starten:
       sudo rpm-ostree install qemu-system-x86 qemu-img qemu-kvm edk2-ovmf
       sudo systemctl reboot

  2) Nach dem Login prüfen:
       bash -c "$(curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh)" -- doctor

  3) Silk starten:
       curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash

Alternative ohne Host-QEMU (virt-manager Flatpak):
  curl …/go-bazzite-vm.sh | bash -s -- download
  curl …/go-bazzite-vm.sh | bash -s -- virt-manager
EOF
}

need_virt() {
  local ok=1
  local qemu_bin=""
  if qemu_bin="$(find_qemu)"; then
    :
  else
    ok=0
  fi
  if [[ ! -e /dev/kvm ]]; then
    ok=0
  elif [[ ! -r /dev/kvm ]]; then
    ok=0
  fi
  if [[ "$ok" -eq 1 ]]; then
    export SILK_QEMU_BIN="$qemu_bin"
    return 0
  fi
  echo
  echo "Diagnose:"
  [[ -n "$qemu_bin" ]] && echo "  QEMU: $qemu_bin" || echo "  QEMU: FEHLT"
  if [[ -e /dev/kvm ]]; then
    ls -l /dev/kvm | sed 's/^/  /'
    [[ -r /dev/kvm ]] || echo "  → keine Leserechte auf /dev/kvm (neu anmelden / Gruppe kvm)"
  else
    echo "  /dev/kvm: FEHLT (Reboot nach setup-virtualization?)"
  fi
  print_fix_hint
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

prepare_overlay() {
  local base="$1"
  local overlay="$MEDIA_DIR/${VM_NAME}-overlay.qcow2"
  local img
  img="$(find_qemu_img)" || die "qemu-img fehlt – sudo rpm-ostree install qemu-img && reboot"
  if [[ ! -f "$overlay" ]]; then
    info "Overlay anlegen (Original-Disk bleibt sauber) …"
    "$img" create -f qcow2 -b "$base" -F qcow2 "$overlay"
  fi
  echo "$overlay"
}

run_qemu_gtk() {
  local disk="$1"
  local qemu="${SILK_QEMU_BIN:-$(find_qemu)}"
  info "Starte Silk: $qemu (GTK-Fenster)"
  info "RAM=${MEM_MB}MB CPUs=${CPUS}  Disk=$disk"
  exec "$qemu" \
    -enable-kvm -cpu host \
    -m "$MEM_MB" -smp "$CPUS" \
    -drive "file=${disk},if=virtio,format=qcow2,cache=writeback" \
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
  local qemu img
  qemu="${SILK_QEMU_BIN:-$(find_qemu)}"
  img="$(find_qemu_img)" || die "qemu-img fehlt"
  [[ -f "$disk" ]] || "$img" create -f qcow2 "$disk" 50G
  info "Installer-ISO → QEMU"
  exec "$qemu" \
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

# Nur Disk laden + Anleitung / virt-manager öffnen
cmd_virt_manager() {
  local qcow
  qcow="$(download_qcow)"
  info "Disk bereit: $qcow"
  echo
  cat <<EOF
In virt-manager (nach ujust setup-virtualization):

  1. App „Virtual Machine Manager“ öffnen
  2. Datei → Neue VM → „Vorhandenes Disk-Image importieren“
  3. Image:  $qcow
  4. OS:     Generic Linux / Fedora
  5. RAM:    mind. 4096 MB, CPUs: 2–4
  6. Firmware: UEFI falls angeboten
  7. Fertigstellen → starten

EOF
  if flatpak info org.virt_manager.virt-manager &>/dev/null; then
    info "Starte Flatpak virt-manager …"
    flatpak run org.virt_manager.virt-manager >/dev/null 2>&1 &
  elif have virt-manager; then
    virt-manager >/dev/null 2>&1 &
  elif flatpak info org.gnome.Boxes &>/dev/null; then
    info "Starte GNOME Boxes …"
    flatpak run org.gnome.Boxes >/dev/null 2>&1 &
    echo "In Boxes: + → Disk-Image auswählen → $qcow"
  else
    echo "virt-manager/Boxes nicht gefunden – manuell öffnen und Image importieren."
  fi
}

try_boxes() {
  local disk="$1"
  if have gnome-boxes; then
    info "GNOME Boxes – öffne Disk …"
    gnome-boxes "$disk" >/dev/null 2>&1 &
    return 0
  fi
  if flatpak info org.gnome.Boxes &>/dev/null; then
    flatpak run org.gnome.Boxes >/dev/null 2>&1 &
    echo "Boxes: + → Disk-Image → $disk"
    return 0
  fi
  return 1
}

main() {
  case "${1:-ready}" in
    -h|--help)
      cat <<'EOF'
go-bazzite-vm.sh – Silk unter Bazzite testen

  bash go-bazzite-vm.sh              # fertige QCOW2 + QEMU-Fenster
  bash go-bazzite-vm.sh iso          # Installer-ISO
  bash go-bazzite-vm.sh download     # nur laden
  bash go-bazzite-vm.sh doctor       # Diagnose
  bash go-bazzite-vm.sh virt-manager # Disk laden + virt-manager öffnen

Falls „QEMU fehlt“:
  sudo rpm-ostree install qemu-system-x86 qemu-img qemu-kvm edk2-ovmf
  sudo systemctl reboot
EOF
      exit 0
      ;;
    doctor) cmd_doctor; exit 0 ;;
  esac

  MODE="${1:-ready}"

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
    virt-manager|boxes|import)
      cmd_virt_manager
      exit 0
      ;;
  esac

  need_virt

  if [[ "$MODE" == iso || "$MODE" == installer ]]; then
    iso="$(download_iso)"
    run_qemu_gtk_iso "$iso"
  fi

  qcow="$(download_qcow)"
  if [[ "${SILK_PREFER_BOXES:-0}" == "1" ]] && try_boxes "$qcow"; then
    exit 0
  fi
  overlay="$(prepare_overlay "$qcow")"
  run_qemu_gtk "$overlay"
}

main "$@"
