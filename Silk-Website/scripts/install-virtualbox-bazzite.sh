#!/usr/bin/env bash
# VirtualBox + Extension Pack auf Bazzite (Fedora Atomic) installieren
# Persönliche Nutzung: Extension Pack unter Oracle PUEL.
set -euo pipefail

VER="${VIRTUALBOX_VERSION:-$(curl -fsSL https://download.virtualbox.org/virtualbox/LATEST-STABLE.TXT | tr -d '[:space:]')}"
WORKDIR="${TMPDIR:-/tmp}/silk-vbox-install"
EXT_LICENSE_HASH="eb31505e56e9b4d0fbca139104da41ac6f6b98f8e78968bdf01b1f3da3c4f9ae"
REPO_URL="https://download.virtualbox.org/virtualbox/rpm/fedora/virtualbox.repo"
EXT_URL="https://download.virtualbox.org/virtualbox/${VER}/Oracle_VirtualBox_Extension_Pack-${VER}.vbox-extpack"

die() { echo "Fehler: $*" >&2; exit 1; }
info() { echo "==> $*"; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || die "'$1' fehlt"; }

is_atomic() {
  [[ -f /run/ostree-booted ]] || command -v rpm-ostree >/dev/null 2>&1
}

accept_extpack_license() {
  cat <<'EOF'

Oracle VirtualBox Extension Pack – Personal Use and Educational License (PUEL).
Nur für persönliche, Bildungs- oder Evaluierungszwecke kostenlos.
Details: https://www.virtualbox.org/wiki/VirtualBox_PUEL

EOF
  if [[ "${VBOX_ACCEPT_PUEL:-}" == "1" ]]; then
    info "PUEL-Zustimmung via VBOX_ACCEPT_PUEL=1"
    return 0
  fi
  read -r -p "PUEL akzeptieren und Extension Pack installieren? [j/N] " ans
  [[ "${ans}" =~ ^[jJyY]$ ]] || die "Abgebrochen (PUEL nicht akzeptiert)."
}

install_extpack() {
  need_cmd VBoxManage
  mkdir -p "$WORKDIR"
  local pack="$WORKDIR/Oracle_VirtualBox_Extension_Pack-${VER}.vbox-extpack"
  info "Extension Pack ${VER} laden …"
  curl -fL --progress-bar -o "$pack" "$EXT_URL"
  accept_extpack_license
  info "Extension Pack installieren …"
  sudo VBoxManage extpack install --replace --accept-license="$EXT_LICENSE_HASH" "$pack"
  VBoxManage list extpacks
}

layer_virtualbox() {
  is_atomic || die "Kein Atomic/Bazzite erkannt. Nutze: ./install-virtualbox-bazzite.sh --extpack-only"
  need_cmd rpm-ostree
  need_cmd curl

  info "Oracle VirtualBox-Repo einrichten …"
  sudo curl -fsSL "$REPO_URL" -o /etc/yum.repos.d/virtualbox.repo

  # Fedora-Host-Major; Oracle-RPM aktuell oft fedora40
  local pkg="VirtualBox-7.2"
  if rpm -q "$pkg" &>/dev/null || rpm-ostree status 2>/dev/null | grep -q VirtualBox; then
    info "VirtualBox scheint bereits gelayert/installiert zu sein."
  else
    info "VirtualBox per rpm-ostree layeren (${pkg}) …"
    info "Das braucht einen Neustart danach."
    sudo rpm-ostree install "$pkg"
    cat <<EOF

VirtualBox wurde gelayert. Bitte jetzt neu starten:

  systemctl reboot

Danach erneut ausführen (nur Extension Pack):

  VBOX_ACCEPT_PUEL=1 $0 --extpack-only

EOF
    exit 0
  fi

  if command -v VBoxManage >/dev/null 2>&1; then
    install_extpack
  else
    die "VBoxManage nicht gefunden – bitte erst neu starten, dann --extpack-only."
  fi
}

ensure_vboxusers() {
  if getent group vboxusers >/dev/null 2>&1; then
    if ! id -nG "$USER" | grep -qw vboxusers; then
      info "Benutzer $USER zur Gruppe vboxusers hinzufügen …"
      sudo usermod -aG vboxusers "$USER"
      echo "Hinweis: Abmelden/Anmelden (oder neu starten), damit die Gruppe greift."
    fi
  fi
}

print_silk_hint() {
  cat <<'EOF'

Silk in VirtualBox testen (Kurz):
  1. Aurora-ISO von https://getaurora.dev/ laden (oder bestehendes Bootc-System)
  2. Neue VM: 4+ GB RAM, 40+ GB Disk, EFI aktivieren
  3. Aurora installieren, dann:
       sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
       sudo systemctl reboot
  4. NVIDIA-Host: eher silk-nvidia-open Image – in VMs oft AMD/Intel-Image reicht

Tipp: Auf Bazzite ist QEMU/KVM oft stabiler als VirtualBox:
  ujust setup-virtualization   # falls vorhanden
  # oder: Flatpak GNOME Boxes / virt-manager

EOF
}

usage() {
  cat <<EOF
Usage: $0 [--install|--extpack-only|--help]

  --install       VirtualBox auf Bazzite layern + (nach Reboot) Extension Pack
  --extpack-only  Nur Extension Pack (VirtualBox muss schon laufen)
  --help          Hilfe

Umgebungsvariablen:
  VIRTUALBOX_VERSION   z.B. 7.2.16 (Standard: LATEST-STABLE)
  VBOX_ACCEPT_PUEL=1   PUEL ohne Rückfrage akzeptieren
EOF
}

main() {
  local mode="${1:---install}"
  case "$mode" in
    --help|-h) usage; exit 0 ;;
    --extpack-only)
      install_extpack
      ensure_vboxusers
      print_silk_hint
      ;;
    --install|"")
      layer_virtualbox
      ensure_vboxusers
      print_silk_hint
      ;;
    *) usage; die "Unbekannte Option: $mode" ;;
  esac
  info "Fertig."
}

main "$@"
