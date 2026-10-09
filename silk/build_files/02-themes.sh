#!/bin/bash
# Themes: Mac-inspiriert (WhiteSur) + Windows-inspiriert (Fluent / Win11OS best-effort)

set -ouex pipefail

THEME_TMP="$(mktemp -d)"
trap 'rm -rf "${THEME_TMP}"' EXIT
cd "${THEME_TMP}"

install_repo() {
  local url="$1"
  local dir="$2"
  shift 2
  git clone --depth=1 "$url" "$dir"
  pushd "$dir"
  if [[ -x ./install.sh ]]; then
    ./install.sh "$@" || ./install.sh || true
  fi
  popd
}

# --- Mac-inspiriert ---
install_repo https://github.com/vinceliuice/WhiteSur-kde.git WhiteSur-kde -d /usr/share || true
install_repo https://github.com/vinceliuice/WhiteSur-icon-theme.git WhiteSur-icon-theme -d /usr/share/icons || true

git clone --depth=1 https://github.com/vinceliuice/WhiteSur-cursors.git
pushd WhiteSur-cursors
./install.sh || true
[[ -d dist ]] && mkdir -p /usr/share/icons && cp -a dist/* /usr/share/icons/ || true
popd

install_repo https://github.com/vinceliuice/WhiteSur-gtk-theme.git WhiteSur-gtk-theme -d /usr/share/themes -l -c Light -c Dark || true

# --- Windows-inspiriert (Fluent = Win10/11-Ästhetik, Open Source) ---
install_repo https://github.com/vinceliuice/Fluent-icon-theme.git Fluent-icon-theme -d /usr/share/icons || true
install_repo https://github.com/vinceliuice/Fluent-gtk-theme.git Fluent-gtk-theme -d /usr/share/themes || true

# Win11OS-kde (best-effort; Plasma-5-lastig, Farben/Desktoptheme trotzdem nützlich)
git clone --depth=1 https://github.com/yeyushengfan258/Win11OS-kde.git || true
if [[ -d Win11OS-kde ]]; then
  pushd Win11OS-kde
  ./install.sh || true
  # Falls Skript nur nach $HOME schreibt: nach /usr spiegeln
  for src in ~/.local/share/plasma ~/.local/share/color-schemes ~/.local/share/aurorae; do
    if [[ -d "$src" ]]; then
      dest="/usr/share/${src##*/}"
      case "$src" in
        */plasma) dest=/usr/share/plasma ;;
        */color-schemes) dest=/usr/share/color-schemes ;;
        */aurorae) dest=/usr/share/aurorae ;;
      esac
      mkdir -p "$dest"
      cp -a "$src"/. "$dest"/ 2>/dev/null || true
    fi
  done
  popd
fi

# Look-and-Feel Metadaten liegen bereits in system_files
mkdir -p /usr/share/plasma/look-and-feel

echo "Mac- + Windows-inspirierte Themes installiert."
