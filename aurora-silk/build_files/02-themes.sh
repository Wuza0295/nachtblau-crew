#!/bin/bash
# Mac-inspirierte Open-Source-Themes (WhiteSur) – KEINE Apple-Marken/Assets

set -ouex pipefail

THEME_TMP="$(mktemp -d)"
trap 'rm -rf "${THEME_TMP}"' EXIT

cd "${THEME_TMP}"

# WhiteSur KDE (Plasma Look, Icons optional separat)
git clone --depth=1 https://github.com/vinceliuice/WhiteSur-kde.git
pushd WhiteSur-kde
./install.sh -d /usr/share || ./install.sh || true
popd

# WhiteSur Icons
git clone --depth=1 https://github.com/vinceliuice/WhiteSur-icon-theme.git
pushd WhiteSur-icon-theme
./install.sh -d /usr/share/icons || ./install.sh || true
popd

# WhiteSur Cursors
git clone --depth=1 https://github.com/vinceliuice/WhiteSur-cursors.git
pushd WhiteSur-cursors
./install.sh || true
# Fallback: Dateien nach /usr/share/icons kopieren
if [[ -d dist ]]; then
  mkdir -p /usr/share/icons
  cp -a dist/* /usr/share/icons/ 2>/dev/null || true
fi
popd

# GTK-Theme für gemischte Apps (Flatpak/GTK)
git clone --depth=1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git
pushd WhiteSur-gtk-theme
./install.sh -d /usr/share/themes -l -c Light -c Dark || ./install.sh || true
popd

# Silk Look-and-Feel Metadaten (nutzt installierte Themes)
mkdir -p /usr/share/plasma/look-and-feel/org.silk.desktop/contents
cat >/usr/share/plasma/look-and-feel/org.silk.desktop/metadata.json <<'EOF'
{
  "KPlugin": {
    "Authors": [ { "Name": "Aurora Silk" } ],
    "Category": "",
    "Description": "Mac-inspiriertes Aurora Silk Look-and-Feel (Open Source Themes)",
    "Id": "org.silk.desktop",
    "License": "GPLv3",
    "Name": "Aurora Silk",
    "ServiceTypes": [ "Plasma/LookAndFeel" ],
    "Version": "1.0"
  }
}
EOF

# Defaults für neue User
mkdir -p /etc/skel/.config /usr/share/silk
cp -a /usr/share/silk/defaults/. /etc/skel/.config/ 2>/dev/null || true

echo "Themes installed."
