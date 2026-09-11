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
  info "Lade Silk-Installer vom Release ${RELEASE_TAG} (~6 GB, dauert) …"

  local base="https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}"
  local files=(
    reassemble.sh
    README-DOWNLOAD.txt
    Silk-Installer-x86_64.iso.sha256
    Silk-Installer-x86_64.iso.part00
    Silk-Installer-x86_64.iso.part01
    Silk-Installer-x86_64.iso.part02
    Silk-Installer-x86_64.iso.part03
  )

  download_one() {
    local f="$1" dest="${ISO_DIR}/${f}"
    [[ -f "$dest" ]] && return 0
    if have curl; then
      curl -fL --retry 3 --retry-delay 5 -C - -o "$dest" "${base}/${f}"
    elif have wget; then
      wget -c -O "$dest" "${base}/${f}"
    else
      die "curl oder wget fehlt (ISO-Download)."
    fi
  }

  if have gh; then
    gh release download "$RELEASE_TAG" -R "$RELEASE_REPO" \
      -p 'Silk-Installer*' -p 'reassemble.sh' -D "$ISO_DIR" 2>/dev/null || true
  fi

  # Fallback / fehlende Teile: direkt vom Release (ohne gh)
  for f in "${files[@]}"; do
    if [[ ! -f "${ISO_DIR}/${f}" ]]; then
      info "  → ${f}"
      download_one "$f"
    fi
  done

  chmod +x "${ISO_DIR}/reassemble.sh" 2>/dev/null || true

  if [[ ! -f "$ISO_PATH" ]]; then
    if [[ -f "${ISO_DIR}/reassemble.sh" ]]; then
      info "Setze ISO zusammen …"
      (cd "$ISO_DIR" && bash reassemble.sh)
    elif compgen -G "${ISO_DIR}/Silk-Installer-x86_64.iso.part*" >/dev/null; then
      info "Setze ISO zusammen …"
      cat "${ISO_DIR}/Silk-Installer-x86_64.iso.part"* > "$ISO_PATH"
    fi
  fi

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

  [[ -f "$ISO_PATH" ]] || die "ISO-Download fehlgeschlagen. Release: ${base}"
  info "Silk-ISO bereit: $ISO_PATH"
}

# Alte Silk-Test-VM übernehmen (Fedora-Label weg, Name Silk).
ensure_vm_ready() {
  if VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    apply_silk_vm_profile "$VM_NAME"
    return 0
  fi
  if VBoxManage showvminfo "Silk-Test" &>/dev/null; then
    info "Übernehme bestehende VM Silk-Test → Silk …"
    fix_vm_branding "Silk-Test"
    VM_NAME="Silk"
    return 0
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
    --clipboard-mode hosttoguest \
    --draganddrop disabled \
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

  ensure_vm_ready

  if ! VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    info "VM '${VM_NAME}' anlegen …"
    VBoxManage createvm --name "$VM_NAME" --ostype "$VBOX_OSTYPE" --register --basefolder "$ISO_DIR"
    VBoxManage createmedium disk --filename "${ISO_DIR}/${VM_NAME}.vdi" --size "$DISK_MB" --format VDI
    VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci
    VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd \
      --medium "${ISO_DIR}/${VM_NAME}.vdi"
    VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
  else
    info "VM '${VM_NAME}' – Profil + ISO aktualisieren …"
  fi

  apply_silk_vm_profile "$VM_NAME"

  VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
    --type dvddrive --medium "$ISO_PATH" 2>/dev/null \
    || VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 \
         --type dvddrive --medium "$ISO_PATH" --forceunmount || true
}

go_virtualbox() {
  need_vbox
  check_driver
  download_silk_iso
  create_vm
  info "Starte VirtualBox – Silk-Installer bootet. In der VM: Silk installieren → silk-setup"
  VBoxManage startvm "$VM_NAME" --type gui
}

main() {
  case "${1:-go}" in
    go)
      go_virtualbox
      ;;
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
      ensure_vm_ready
      VBoxManage showvminfo "$VM_NAME" &>/dev/null || die "VM fehlt: $VM_NAME (starte: $0 go)"
      VBoxManage startvm "$VM_NAME" --type gui
      ;;
    all)
      go_virtualbox
      ;;
    -h|--help)
      cat <<EOF
Silk in VirtualBox – ein Befehl, kein Aurora.

  $0              # oder: go  → ISO laden, VM Silk, VirtualBox starten
  $0 start        # VM erneut starten

Optional: fix [Name]  ·  iso  ·  vm  ·  driver

Release: ${RELEASE_TAG}
EOF
      ;;
    *) die "Unbekannt: $1 (nutze: $0 go)" ;;
  esac
}

main "$@"
