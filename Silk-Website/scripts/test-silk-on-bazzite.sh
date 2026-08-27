#!/usr/bin/env bash
# Silk direkt auf Bazzite/Aurora/Bluefin testen – KEIN Aurora-ISO, KEINE VirtualBox nötig.
# Du bist schon auf einem Bootc-System → einfach auf Silk umschalten.
set -euo pipefail

IMAGE_AMD="${SILK_IMAGE:-ghcr.io/wuza0295/silk:latest}"
IMAGE_NVIDIA="${SILK_NVIDIA_IMAGE:-ghcr.io/wuza0295/silk-nvidia-open:latest}"

info() { printf '\n==> %s\n' "$*"; }
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

need_bootc() {
  have bootc || die "bootc fehlt – bitte auf Bazzite/Aurora/Bluefin (Bootc) ausführen."
}

check_image() {
  local img="$1"
  info "Prüfe Image: $img"
  if have skopeo; then
    skopeo inspect --override-os linux --override-arch amd64 "docker://${img}" >/dev/null \
      && return 0
    return 1
  fi
  if have podman; then
    podman pull "$img" >/dev/null && return 0
    return 1
  fi
  info "skopeo/podman nicht gefunden – Image-Check übersprungen."
  return 0
}

detect_nvidia() {
  if lspci 2>/dev/null | grep -qi 'VGA.*NVIDIA\|3D.*NVIDIA'; then
    return 0
  fi
  return 1
}

print_status() {
  info "Aktuelles System:"
  bootc status 2>/dev/null | head -40 || true
  if [[ -f /usr/share/ublue-os/image-info.json ]]; then
    echo
    cat /usr/share/ublue-os/image-info.json 2>/dev/null || true
  fi
}

do_switch() {
  local img="$1"
  need_bootc
  print_status

  if ! check_image "$img"; then
    cat <<EOF

Das Silk-Image ist nicht erreichbar (privat oder noch nicht gebaut).
CI-Status prüfen: https://github.com/Wuza0295/nachtblau-crew/actions

Sobald ghcr.io/wuza0295/silk:latest öffentlich gebaut ist, diesen Befehl erneut ausführen.

EOF
    die "Image nicht pullbar: $img"
  fi

  cat <<EOF

============================================================
Silk-Test: Rebase auf
  $img

Danach Neustart. Zurück zu Bazzite später z.B. mit:
  sudo bootc switch --enforce-container-sigpolicy ghcr.io/ublue-os/bazzite:stable
  sudo systemctl reboot
============================================================

EOF
  read -r -p "Jetzt auf Silk umschalten? [j/N] " ans
  [[ "${ans}" =~ ^[jJyY]$ ]] || die "Abgebrochen."

  info "bootc switch …"
  sudo bootc switch --enforce-container-sigpolicy "$img"
  info "Fertig. Neustart in 10 Sekunden (Strg+C zum Abbrechen) …"
  sleep 10
  sudo systemctl reboot
}

usage() {
  cat <<EOF
Usage: $0 [--amd|--nvidia|--status|--help]

  --amd      Silk (AMD/Intel) installieren/testen  [Standard]
  --nvidia   Silk NVIDIA-Open Image
  --status   Nur aktuellen bootc-Status zeigen
  --help     Hilfe

Kein Aurora-ISO. Kein VirtualBox. Du testest Silk direkt auf diesem Rechner.
EOF
}

main() {
  case "${1:---amd}" in
    --amd|"") do_switch "$IMAGE_AMD" ;;
    --nvidia) do_switch "$IMAGE_NVIDIA" ;;
    --status) need_bootc; print_status ;;
    --help|-h) usage ;;
    *) usage; die "Unbekannte Option: $1" ;;
  esac
}

main "$@"
