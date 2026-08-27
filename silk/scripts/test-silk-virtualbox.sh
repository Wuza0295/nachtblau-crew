#!/usr/bin/env bash
# Silk in VirtualBox testen (auf Bazzite/Fedora/PC)
# 1) VirtualBox-Kernelmodul prüfen/reparieren
# 2) VM "Silk-Test" anlegen (EFI, 4GB+)
# 3) Aurora-ISO anhängen (Basis) → nach Install: bootc switch auf Silk
set -euo pipefail

VM_NAME="${SILK_VM_NAME:-Silk-Test}"
ISO_DIR="${HOME}/Silk-VMs"
ISO_PATH="${ISO_DIR}/aurora-stable-webui-x86_64.iso"
ISO_URL="${AURORA_ISO_URL:-https://dl.getaurora.dev/aurora-stable-webui-x86_64.iso}"
SILK_IMAGE="${SILK_IMAGE:-ghcr.io/wuza0295/silk:latest}"
MEM_MB="${SILK_VM_MEM:-4096}"
CPUS="${SILK_VM_CPUS:-2}"
DISK_MB="${SILK_VM_DISK:-51200}"

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

need_vbox() {
  have VBoxManage || die "VirtualBox fehlt. Installieren, dann erneut:
  curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/scripts/install-virtualbox-bazzite.sh | bash"
}

check_driver() {
  info "VirtualBox-Kernelmodul prüfen …"
  if VBoxManage --version >/dev/null 2>&1 \
    && ! VBoxManage list vms 2>&1 | grep -qi 'Kernel driver not installed\|VERR_VM_DRIVER'; then
    # list vms can still warn on stderr
    if VBoxManage list vms >/dev/null 2>&1; then
      info "VBoxManage OK."
      return 0
    fi
  fi

  if lsmod 2>/dev/null | grep -q '^vboxdrv'; then
    info "vboxdrv geladen."
    return 0
  fi

  info "Kernel-Treiber fehlt (typisch auf Bazzite). Versuche Reparatur …"
  if [[ -x /sbin/vboxconfig ]]; then
    sudo /sbin/vboxconfig || true
  fi
  if have rpm-ostree; then
    info "Tipp Atomic/Bazzite: Kernel-Header/akmods layern (Reboot nötig):"
    echo "  sudo rpm-ostree install kernel-devel akmods"
    echo "  sudo systemctl reboot"
    echo "  # danach erneut: sudo /sbin/vboxconfig"
  fi

  if ! lsmod 2>/dev/null | grep -q '^vboxdrv'; then
    cat <<EOF

VirtualBox kann ohne vboxdrv KEINE VMs starten.

Option A – Treiber fixen (Bazzite):
  sudo rpm-ostree install kernel-devel gcc make elfutils-libelf-devel
  sudo systemctl reboot
  sudo /sbin/vboxconfig

Option B – QEMU/KVM statt VirtualBox (oft besser auf Bazzite):
  ujust setup-virtualization
  # oder: flatpak install flathub org.gnome.Boxes

Dann dieses Skript mit: SILK_USE_BOXES=1 $0   (nur Hinweis)

EOF
    die "vboxdrv nicht geladen – zuerst Option A oder B."
  fi
}

ensure_iso() {
  mkdir -p "$ISO_DIR"
  if [[ -f "$ISO_PATH" ]]; then
    info "ISO vorhanden: $ISO_PATH"
    return 0
  fi
  if [[ -f "${ISO_PATH}.partial" ]]; then
    info "Setze abgebrochenen ISO-Download fort …"
  fi
  info "Aurora-ISO laden (nur als Install-Basis für bootc → Silk) …"
  info "Danach wechselst du IN der VM auf Silk – nicht Aurora behalten."
  curl -fL --progress-bar -C - -o "${ISO_PATH}.partial" "$ISO_URL"
  mv "${ISO_PATH}.partial" "$ISO_PATH"
}

create_or_update_vm() {
  need_vbox
  if VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    info "VM '$VM_NAME' existiert – aktualisiere Einstellungen …"
  else
    info "VM '$VM_NAME' anlegen …"
    VBoxManage createvm --name "$VM_NAME" --ostype "Fedora_64" --register --basefolder "$ISO_DIR"
    VBoxManage createmedium disk --filename "${ISO_DIR}/${VM_NAME}.vdi" --size "$DISK_MB" --format VDI
    VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd \
      --medium "${ISO_DIR}/${VM_NAME}.vdi"
    VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
  fi

  VBoxManage modifyvm "$VM_NAME" \
    --memory "$MEM_MB" \
    --cpus "$CPUS" \
    --firmware efi \
    --vram 128 \
    --nic1 nat \
    --audio-driver none \
    --clipboard-mode bidirectional \
    --draganddrop bidirectional \
    --ioapic on \
    --pae on \
    --nested-hw-virt on 2>/dev/null || true

  if [[ -f "$ISO_PATH" ]]; then
    info "ISO anhängen …"
    VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
      --type dvddrive --medium "$ISO_PATH" 2>/dev/null \
      || VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
           --type dvddrive --medium "$ISO_PATH" --forceunmount || true
  fi

  info "VMs:"
  VBoxManage list vms
}

print_next() {
  cat <<EOF

============================================================
Silk in VirtualBox – so geht's weiter

1) VM starten:
     VBoxManage startvm "${VM_NAME}" --type gui
   oder VirtualBox öffnen → ${VM_NAME} → Starten

2) Aurora aus dem ISO NORMAL installieren (EFI-VM).

3) Nach dem ersten Login IN DER VM (Terminal):

     sudo bootc switch ${SILK_IMAGE}
     sudo systemctl reboot

4) Fertig – das ist dann Silk (nicht Aurora):
     silk-setup
     silk-welcome

Warum Aurora-ISO?
  Silk ist ein bootc-Image, kein eigenes Installer-ISO.
  Aurora = Startsystem → switch zu Silk.

Image: ${SILK_IMAGE}
VM:    ${VM_NAME}
ISO:   ${ISO_PATH}
============================================================
EOF
}

start_vm() {
  need_vbox
  check_driver
  info "Starte ${VM_NAME} …"
  VBoxManage startvm "$VM_NAME" --type gui
}

main() {
  case "${1:-all}" in
    driver) need_vbox; check_driver ;;
    iso) ensure_iso ;;
    vm) need_vbox; check_driver; create_or_update_vm; print_next ;;
    start) start_vm ;;
    all)
      need_vbox
      check_driver
      ensure_iso
      create_or_update_vm
      print_next
      read -r -p "VM jetzt starten? [j/N] " ans
      [[ "${ans}" =~ ^[jJyY]$ ]] && start_vm || true
      ;;
    -h|--help)
      echo "Usage: $0 [all|driver|iso|vm|start]"
      ;;
    *) die "Unbekannt: $1 (hilfe: --help)" ;;
  esac
}

main "$@"
