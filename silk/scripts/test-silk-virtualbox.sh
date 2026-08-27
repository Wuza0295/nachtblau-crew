#!/usr/bin/env bash
# Silk in VirtualBox – eigenständiges Silk-ISO (kein Aurora, kein Fedora-Label).
set -euo pipefail

VM_NAME="${SILK_VM_NAME:-Silk}"
ISO_DIR="${HOME}/Silk-VMs"
ISO_PATH="${ISO_DIR}/Silk-Installer-x86_64.iso"
RELEASE_REPO="${SILK_RELEASE_REPO:-Wuza0295/nachtblau-crew}"
RELEASE_TAG="${SILK_RELEASE_TAG:-silk-media-latest}"
MEM_MB="${SILK_VM_MEM:-4096}"
CPUS="${SILK_VM_CPUS:-2}"
DISK_MB="${SILK_VM_DISK:-51200}"
# VirtualBox hat kein „Silk“ in der Liste → generisches Linux (nie Fedora_*).
VBOX_OSTYPE="${SILK_VBOX_OSTYPE:-Linux26_64}"
VM_DESC="${SILK_VM_DESC:-Silk – eigenständiges Desktop-Betriebssystem}"

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
    gh release download "$RELEASE_TAG" -R "$RELEASE_REPO" \
      -p 'Silk-Installer*' -p 'reassemble.sh' -D "$ISO_DIR" || true
    if [[ ! -f "$ISO_PATH" ]] && [[ -x "${ISO_DIR}/reassemble.sh" || -f "${ISO_DIR}/reassemble.sh" ]]; then
      info "reassemble.sh …"
      (cd "$ISO_DIR" && bash reassemble.sh) || true
    fi
    if [[ ! -f "$ISO_PATH" ]] && compgen -G "${ISO_DIR}/Silk-Installer-x86_64.iso.part*" >/dev/null; then
      info "Setze ISO aus Split-Teilen zusammen …"
      cat "${ISO_DIR}/Silk-Installer-x86_64.iso.part"* > "$ISO_PATH"
    fi
    # SHA immer auf Basename normalisieren (alte Releases hatten dist/…)
    if [[ -f "${ISO_DIR}/Silk-Installer-x86_64.iso.sha256" ]]; then
      local hash
      hash="$(awk '{print $1}' "${ISO_DIR}/Silk-Installer-x86_64.iso.sha256")"
      printf '%s  %s\n' "$hash" "Silk-Installer-x86_64.iso" > "${ISO_DIR}/Silk-Installer-x86_64.iso.sha256"
    fi
    if [[ -f "$ISO_PATH" && -f "${ISO_DIR}/Silk-Installer-x86_64.iso.sha256" ]]; then
      (cd "$ISO_DIR" && sha256sum -c Silk-Installer-x86_64.iso.sha256)
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

# Beste Defaults für Silk (Linux-Gast), ohne Fedora-Label in der GUI.
apply_silk_vm_profile() {
  local name="$1"
  VBoxManage modifyvm "$name" \
    --ostype "$VBOX_OSTYPE" \
    --description "$VM_DESC" \
    --memory "$MEM_MB" \
    --cpus "$CPUS" \
    --firmware efi \
    --chipset ich9 \
    --mouse usbtablet \
    --graphicscontroller vmsvga \
    --vram 128 \
    --nic1 nat \
    --audio-driver none \
    --clipboard-mode bidirectional \
    --draganddrop bidirectional \
    --ioapic on \
    --acpi on \
    --pae on \
    --rtcuseutc on \
    --hwvirtex on \
    --nestedpaging on \
    --largepages on \
    --vtxvpid on \
    --accelerate3d off \
    2>/dev/null || VBoxManage modifyvm "$name" \
      --ostype "$VBOX_OSTYPE" \
      --description "$VM_DESC" \
      --memory "$MEM_MB" \
      --cpus "$CPUS" \
      --firmware efi \
      --vram 128 \
      --nic1 nat \
      --clipboard-mode bidirectional \
      --ioapic on
}

# Bestehende VM korrigieren (Fedora-Label weg, Name → Silk).
fix_vm_branding() {
  need_vbox
  local name="${1:-}"
  if [[ -z "$name" ]]; then
    if VBoxManage showvminfo "Silk" &>/dev/null; then
      name="Silk"
    elif VBoxManage showvminfo "Silk-Test" &>/dev/null; then
      name="Silk-Test"
    else
      die "Keine VM „Silk“ oder „Silk-Test“ gefunden."
    fi
  fi
  VBoxManage showvminfo "$name" &>/dev/null || die "VM nicht gefunden: $name"

  # Alte Silk-Test → Silk umbenennen (wenn Ziel noch frei)
  if [[ "$name" == "Silk-Test" ]] && ! VBoxManage showvminfo "Silk" &>/dev/null; then
    info "Benenne Silk-Test → Silk um …"
    VBoxManage modifyvm "Silk-Test" --name "Silk"
    name="Silk"
  fi

  info "Setze Silk-Profil für VM '${name}' (Linux, nicht Fedora) …"
  apply_silk_vm_profile "$name"
  echo
  VBoxManage showvminfo "$name" | grep -E '^(Name:|Guest OS:|Description:|Firmware:|Graphics Controller:)' || true
  info "Fertig. Betriebssystem-Profil = Linux … (64-bit), Produkt = Silk."
}

create_vm() {
  need_vbox
  check_driver
  mkdir -p "$ISO_DIR"
  [[ -f "$ISO_PATH" ]] || die "ISO fehlt: $ISO_PATH"

  if ! VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    info "VM '${VM_NAME}' anlegen (Produkt: Silk, Profil: Linux 64-bit) …"
    VBoxManage createvm --name "$VM_NAME" --ostype "$VBOX_OSTYPE" --register --basefolder "$ISO_DIR"
    VBoxManage createmedium disk --filename "${ISO_DIR}/${VM_NAME}.vdi" --size "$DISK_MB" --format VDI
    VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd \
      --medium "${ISO_DIR}/${VM_NAME}.vdi"
    VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
  else
    info "VM '${VM_NAME}' existiert – Silk-Profil aktualisieren …"
  fi

  apply_silk_vm_profile "$VM_NAME"

  VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
    --type dvddrive --medium "$ISO_PATH" 2>/dev/null \
    || VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
         --type dvddrive --medium "$ISO_PATH" --forceunmount || true

  info "Fertig. Gast-OS ist **Silk** (VirtualBox-Profil: Linux, nicht Fedora)."
  VBoxManage showvminfo "$VM_NAME" | grep -E '^(Name:|Guest OS:|Description:)' || true
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
    fix|fix-vm)
      fix_vm_branding "${2:-}"
      ;;
    start)
      need_vbox; check_driver
      local start_name="$VM_NAME"
      if ! VBoxManage showvminfo "$start_name" &>/dev/null; then
        if VBoxManage showvminfo "Silk-Test" &>/dev/null; then
          # Auto-Migration beim Start
          fix_vm_branding "Silk-Test"
          start_name="Silk"
        fi
      fi
      VBoxManage showvminfo "$start_name" &>/dev/null || die "VM fehlt: $start_name (lege mit: $0 vm an)"
      VBoxManage startvm "$start_name" --type gui
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
      cat <<EOF
Usage: $0 [all|driver|iso|iso-local PATH|vm|fix|start]

  fix [VM-Name]  Fedora-Label entfernen, Silk-Beschreibung setzen
                 (findet auch „Silk-Test“)

Silk-Installer-ISO (Release ${RELEASE_TAG}) – kein Aurora, kein Fedora als Produktname.
EOF
      ;;
    *) die "Unbekannt: $1" ;;
  esac
}

main "$@"
