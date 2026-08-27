#!/usr/bin/env bash
# Silk in VirtualBox – eigenständiges Silk-ISO (kein Aurora).
set -euo pipefail

VM_NAME="${SILK_VM_NAME:-Silk-Test}"
ISO_DIR="${HOME}/Silk-VMs"
ISO_PATH="${ISO_DIR}/Silk-Installer-x86_64.iso"
RELEASE_REPO="${SILK_RELEASE_REPO:-Wuza0295/nachtblau-crew}"
RELEASE_TAG="${SILK_RELEASE_TAG:-silk-media-latest}"
MEM_MB="${SILK_VM_MEM:-4096}"
CPUS="${SILK_VM_CPUS:-2}"
DISK_MB="${SILK_VM_DISK:-51200}"

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

need_vbox() {
  have VBoxManage || die "VirtualBox / VBoxManage fehlt."
}

check_driver() {
  info "VirtualBox-Kernelmodul prüfen …"
  if lsmod 2>/dev/null | grep -q '^vboxdrv'; then
    info "vboxdrv geladen."
    return 0
  fi
  if [[ -x /sbin/vboxconfig ]]; then
    sudo /sbin/vboxconfig || true
  fi
  if lsmod 2>/dev/null | grep -q '^vboxdrv'; then
    return 0
  fi
  cat <<'EOF'

vboxdrv fehlt (rc=-1908). Auf Bazzite:

  sudo rpm-ostree install kernel-devel gcc make elfutils-libelf-devel
  sudo systemctl reboot
  sudo /sbin/vboxconfig

Oder KVM: ujust setup-virtualization / GNOME Boxes
EOF
  die "Kein vboxdrv – VM kann nicht starten."
}

download_silk_iso() {
  mkdir -p "$ISO_DIR"
  if [[ -f "$ISO_PATH" ]]; then
    info "Silk-ISO vorhanden: $ISO_PATH"
    return 0
  fi
  info "Lade Silk-Installer-ISO vom GitHub-Release ${RELEASE_TAG} …"
  if have gh; then
    # Ganzes ISO oder Split-Teile (GitHub-Limit 2 GiB)
    gh release download "$RELEASE_TAG" -R "$RELEASE_REPO" \
      -p 'Silk-Installer*' -p 'reassemble.sh' -D "$ISO_DIR" || true
    if [[ ! -f "$ISO_PATH" ]] && compgen -G "${ISO_DIR}/Silk-Installer-x86_64.iso.part*" >/dev/null; then
      info "Setze ISO aus Split-Teilen zusammen …"
      cat "${ISO_DIR}/Silk-Installer-x86_64.iso.part"* > "$ISO_PATH"
      if [[ -f "${ISO_DIR}/Silk-Installer-x86_64.iso.sha256" ]]; then
        (cd "$ISO_DIR" && sha256sum -c Silk-Installer-x86_64.iso.sha256)
      fi
    fi
    local found
    found="$(find "$ISO_DIR" -maxdepth 1 -name 'Silk-Installer*.iso' ! -name '*.part*' | head -1 || true)"
    if [[ -n "$found" && "$found" != "$ISO_PATH" ]]; then
      mv -f "$found" "$ISO_PATH"
    fi
  fi
  if [[ ! -f "$ISO_PATH" ]]; then
    cat <<EOF
Kein Silk-ISO gefunden.

1) Release öffnen:
   https://github.com/${RELEASE_REPO}/releases/tag/${RELEASE_TAG}
2) Alle Silk-Installer*.part* (+ sha256) laden, dann:
   cat Silk-Installer-x86_64.iso.part* > ${ISO_PATH}
3) erneut: $0 vm
EOF
    die "Silk-ISO fehlt (kein Aurora – nur Silk-Installer)."
  fi
}

create_vm() {
  need_vbox
  check_driver
  mkdir -p "$ISO_DIR"
  [[ -f "$ISO_PATH" ]] || die "ISO fehlt: $ISO_PATH"

  # VirtualBox kennt kein „Silk“ in der OS-Liste – nie Fedora anzeigen.
  # Linux26_64 = generisches Linux (64-Bit); das Gast-OS ist Silk.
  local vbox_ostype="${SILK_VBOX_OSTYPE:-Linux26_64}"

  if ! VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    info "VM '${VM_NAME}' anlegen (OS-Typ: Linux, Produkt: Silk) …"
    VBoxManage createvm --name "$VM_NAME" --ostype "$vbox_ostype" --register --basefolder "$ISO_DIR"
    VBoxManage createmedium disk --filename "${ISO_DIR}/${VM_NAME}.vdi" --size "$DISK_MB" --format VDI
    VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd \
      --medium "${ISO_DIR}/${VM_NAME}.vdi"
    VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
  else
    info "VM '${VM_NAME}' existiert – OS-Typ auf Linux (nicht Fedora) setzen …"
  fi

  VBoxManage modifyvm "$VM_NAME" \
    --ostype "$vbox_ostype" \
    --memory "$MEM_MB" \
    --cpus "$CPUS" \
    --firmware efi \
    --vram 128 \
    --nic1 nat \
    --audio-driver none \
    --clipboard-mode bidirectional \
    --ioapic on

  VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
    --type dvddrive --medium "$ISO_PATH" 2>/dev/null \
    || VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
         --type dvddrive --medium "$ISO_PATH" --forceunmount || true

  info "Fertig. Das ist das **Silk**-Installer-ISO (kein Aurora)."
  VBoxManage list vms
  echo
  echo "Start: VBoxManage startvm ${VM_NAME} --type gui"
  echo "In der VM: Silk installieren → nach Login: silk-setup"
}

main() {
  case "${1:-all}" in
    driver) need_vbox; check_driver ;;
    iso) download_silk_iso ;;
    iso-local)
      [[ -n "${2:-}" && -f "$2" ]] || die "Usage: $0 iso-local /pfad/zu/Silk-Installer.iso"
      mkdir -p "$ISO_DIR"
      cp -f "$2" "$ISO_PATH"
      info "ISO gesetzt: $ISO_PATH"
      ;;
    vm) download_silk_iso; create_vm ;;
    start)
      need_vbox; check_driver
      VBoxManage startvm "$VM_NAME" --type gui
      ;;
    all)
      need_vbox
      check_driver
      download_silk_iso
      create_vm
      read -r -p "VM jetzt starten? [j/N] " ans
      [[ "${ans}" =~ ^[jJyY]$ ]] && VBoxManage startvm "$VM_NAME" --type gui || true
      ;;
    -h|--help)
      echo "Usage: $0 [all|driver|iso|iso-local PATH|vm|start]"
      echo "Silk-Installer-ISO (Release ${RELEASE_TAG}) – kein Aurora."
      ;;
    *) die "Unbekannt: $1" ;;
  esac
}

main "$@"
