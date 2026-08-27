#!/usr/bin/env bash
# Silk-Test-Setup: VirtualBox + Extension Pack + Aurora-ISO + VM-Vorlage
# Ein Befehl auf Bazzite – macht alles (inkl. Fortsetzung nach Reboot).
#
# Usage:
#   curl -fsSL …/setup-silk-test-all.sh | bash
#   # oder:
#   ./setup-silk-test-all.sh
set -euo pipefail

STATE_DIR="${HOME}/.cache/silk-vbox-setup"
STATE_FILE="${STATE_DIR}/state"
LOG_FILE="${STATE_DIR}/setup.log"
FINISH_SCRIPT="${HOME}/.local/bin/silk-vbox-finish.sh"
USER_UNIT_DIR="${HOME}/.config/systemd/user"
UNIT_NAME="silk-vbox-finish.service"

VER="${VIRTUALBOX_VERSION:-$(curl -fsSL https://download.virtualbox.org/virtualbox/LATEST-STABLE.TXT | tr -d '[:space:]')}"
EXT_LICENSE_HASH="eb31505e56e9b4d0fbca139104da41ac6f6b98f8e78968bdf01b1f3da3c4f9ae"
REPO_URL="https://download.virtualbox.org/virtualbox/rpm/fedora/virtualbox.repo"
EXT_URL="https://download.virtualbox.org/virtualbox/${VER}/Oracle_VirtualBox_Extension_Pack-${VER}.vbox-extpack"
ISO_URL="${AURORA_ISO_URL:-https://dl.getaurora.dev/aurora-stable-webui-x86_64.iso}"
ISO_DIR="${HOME}/Silk-VMs"
ISO_PATH="${ISO_DIR}/aurora-stable-webui-x86_64.iso"
VM_NAME="${SILK_VM_NAME:-Silk-Test}"

mkdir -p "$STATE_DIR" "$ISO_DIR" "$(dirname "$FINISH_SCRIPT")" "$USER_UNIT_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

write_state() { echo "$1" >"$STATE_FILE"; }
read_state() { [[ -f "$STATE_FILE" ]] && cat "$STATE_FILE" || echo "new"; }

install_repo_and_layer() {
  have rpm-ostree || die "Kein rpm-ostree – bitte auf Bazzite/Atomic ausführen."
  info "Oracle VirtualBox-Repo einrichten …"
  sudo curl -fsSL "$REPO_URL" -o /etc/yum.repos.d/virtualbox.repo

  if rpm -q VirtualBox-7.2 &>/dev/null || rpm-ostree status 2>/dev/null | grep -q VirtualBox; then
    info "VirtualBox bereits gelayert."
    return 0
  fi

  info "VirtualBox-7.2 per rpm-ostree installieren (dauert) …"
  sudo rpm-ostree install VirtualBox-7.2
  write_state "need-reboot"
}

schedule_after_reboot() {
  info "Fortsetzung nach Reboot einrichten …"
  # Finish-Skript schreiben (Kopie dieses Skripts mit --finish)
  local self
  self="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || true)"
  if [[ -n "$self" && -f "$self" ]]; then
    cp -f "$self" "$FINISH_SCRIPT"
  else
    # via curl gestartet – Skript nachladen
    curl -fsSL \
      "https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/scripts/setup-silk-test-all.sh" \
      -o "$FINISH_SCRIPT"
  fi
  chmod +x "$FINISH_SCRIPT"

  cat >"${USER_UNIT_DIR}/${UNIT_NAME}" <<EOF
[Unit]
Description=Silk VirtualBox Setup nach Reboot fertigstellen
After=default.target
ConditionPathExists=${STATE_DIR}/state

[Service]
Type=oneshot
ExecStart=${FINISH_SCRIPT} --finish
Environment=VBOX_ACCEPT_PUEL=1
Environment=HOME=${HOME}
WorkingDirectory=${HOME}

[Install]
WantedBy=default.target
EOF

  systemctl --user daemon-reload || true
  systemctl --user enable "${UNIT_NAME}" || true

  # Fallback: @reboot in user crontab
  if have crontab; then
    local line="@reboot sleep 45 && ${FINISH_SCRIPT} --finish >>${LOG_FILE} 2>&1"
    (crontab -l 2>/dev/null | grep -v 'silk-vbox-finish' || true; echo "$line") | crontab - || true
  fi
}

install_extpack() {
  have VBoxManage || die "VBoxManage fehlt – VirtualBox nach Reboot noch nicht aktiv?"
  local pack="${STATE_DIR}/Oracle_VirtualBox_Extension_Pack-${VER}.vbox-extpack"
  info "Extension Pack ${VER} laden …"
  curl -fL --progress-bar -o "$pack" "$EXT_URL"
  info "Extension Pack installieren (PUEL) …"
  sudo VBoxManage extpack install --replace --accept-license="$EXT_LICENSE_HASH" "$pack"
  VBoxManage list extpacks
}

ensure_groups() {
  if getent group vboxusers >/dev/null 2>&1; then
    if ! id -nG "$(whoami)" | grep -qw vboxusers; then
      info "Benutzer zur Gruppe vboxusers hinzufügen …"
      sudo usermod -aG vboxusers "$(whoami)"
    fi
  fi
}

download_iso() {
  if [[ -f "$ISO_PATH" ]]; then
    info "Aurora-ISO bereits vorhanden: $ISO_PATH"
    return 0
  fi
  info "Aurora-ISO laden (~6.5 GB) nach ${ISO_PATH} …"
  curl -fL --progress-bar -o "${ISO_PATH}.partial" "$ISO_URL"
  mv "${ISO_PATH}.partial" "$ISO_PATH"
  info "ISO fertig."
}

create_vm() {
  have VBoxManage || die "VBoxManage fehlt"
  if VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    info "VM '${VM_NAME}' existiert schon."
    return 0
  fi
  info "VirtualBox-VM '${VM_NAME}' anlegen …"
  VBoxManage createvm --name "$VM_NAME" --ostype "Fedora_64" --register
  VBoxManage modifyvm "$VM_NAME" \
    --memory 4096 \
    --cpus 2 \
    --firmware efi \
    --vram 128 \
    --nic1 nat \
    --audio-driver none \
    --clipboard-mode bidirectional \
    --draganddrop bidirectional
  VBoxManage createmedium disk --filename "${ISO_DIR}/${VM_NAME}.vdi" --size 51200 --format VDI
  VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci
  VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd \
    --medium "${ISO_DIR}/${VM_NAME}.vdi"
  VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
  VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 --type dvddrive \
    --medium "$ISO_PATH"
  info "VM bereit. Start: VirtualBox → ${VM_NAME} → Starten"
}

print_silk_next() {
  cat <<EOF

============================================================
Fertig. Nächste Schritte in der VM:
  1. Aurora aus dem ISO installieren
  2. Nach dem Login:
       sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
       sudo systemctl reboot
  3. Dann: silk-setup

VM starten:
  VirtualBox &
  # oder:
  VBoxManage startvm "${VM_NAME}" --type gui

Log: ${LOG_FILE}
ISO: ${ISO_PATH}
============================================================
EOF
}

cleanup_autostart() {
  systemctl --user disable "${UNIT_NAME}" 2>/dev/null || true
  rm -f "${USER_UNIT_DIR}/${UNIT_NAME}"
  if have crontab; then
    crontab -l 2>/dev/null | grep -v 'silk-vbox-finish' | crontab - || true
  fi
  write_state "done"
}

do_finish() {
  info "Phase 2: Extension Pack + ISO + VM …"
  # Warten bis VBoxManage da ist (nach ostree-Reboot)
  for i in $(seq 1 30); do
    have VBoxManage && break
    sleep 2
  done
  have VBoxManage || die "VBoxManage nach Reboot nicht gefunden. Log: $LOG_FILE"

  ensure_groups
  install_extpack
  download_iso
  create_vm
  cleanup_autostart
  print_silk_next

  # Desktop-Benachrichtigung falls möglich
  if have notify-send; then
    notify-send "Silk Test-Setup" "VirtualBox + Extension Pack + VM '${VM_NAME}' sind bereit." || true
  fi
}

do_install() {
  info "Silk Test-Setup starten (VirtualBox ${VER}) …"
  export VBOX_ACCEPT_PUEL=1

  if have VBoxManage; then
    info "VirtualBox bereits nutzbar – überspringe Layering."
    ensure_groups
    install_extpack
    download_iso
    create_vm
    write_state "done"
    print_silk_next
    return 0
  fi

  install_repo_and_layer
  schedule_after_reboot
  write_state "need-reboot"

  cat <<EOF

============================================================
VirtualBox wird gelayert. Rechner startet in 15 Sekunden neu.
Danach läuft die Einrichtung automatisch weiter
(Extension Pack, Aurora-ISO, VM '${VM_NAME}').

Abbrechen: Strg+C jetzt.
Log danach: ${LOG_FILE}
============================================================
EOF
  sleep 15
  sudo systemctl reboot
}

main() {
  case "${1:-}" in
    --finish) do_finish ;;
    --help|-h)
      echo "Usage: $0 [--finish]"
      echo "  Ohne Args: alles installieren (Reboot inkl.)"
      echo "  --finish:  nur Phase 2 (nach Reboot)"
      ;;
    *) do_install ;;
  esac
}

main "$@"
