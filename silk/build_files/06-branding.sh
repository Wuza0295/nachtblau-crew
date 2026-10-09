#!/bin/bash
# Silk Branding: os-release, Plymouth, Plasma-Splash, Logos – Aurora/UBlue Reste ersetzen
set -ouex pipefail

BRAND_SRC=/usr/share/silk/branding
IMAGE_NAME="${IMAGE_NAME:-silk}"
IMAGE_PRETTY_NAME="Silk"
HOME_URL="https://github.com/wuza0295/nachtblau-crew"
DOCUMENTATION_URL="https://github.com/wuza0295/nachtblau-crew/blob/main/silk/README.md"
SUPPORT_URL="https://github.com/wuza0295/nachtblau-crew/issues"
BUG_SUPPORT_URL="https://github.com/wuza0295/nachtblau-crew/issues"
VENDOR="wuza0295"

echo "== Silk Branding =="

# --- os-release / image-info ---
if [[ -f /usr/lib/os-release ]]; then
  # Upstream (Aurora) → Silk, Fedora-kompatibel lassen (ID_LIKE)
  sed -i \
    -e 's/^NAME=.*/NAME="Silk"/' \
    -e 's/^PRETTY_NAME=.*/PRETTY_NAME="Silk"/' \
    -e 's/^ID=.*/ID=silk/' \
    -e 's/^ID_LIKE=.*/ID_LIKE="fedora"/' \
    -e 's/^HOME_URL=.*/HOME_URL="'"${HOME_URL}"'"/' \
    -e 's/^DOCUMENTATION_URL=.*/DOCUMENTATION_URL="'"${DOCUMENTATION_URL}"'"/' \
    -e 's/^SUPPORT_URL=.*/SUPPORT_URL="'"${SUPPORT_URL}"'"/' \
    -e 's/^BUG_REPORT_URL=.*/BUG_REPORT_URL="'"${BUG_SUPPORT_URL}"'"/' \
    -e 's/^DEFAULT_HOSTNAME=.*/DEFAULT_HOSTNAME="silk"/' \
    -e 's/^CPE_NAME=.*/CPE_NAME="cpe:\/o:wuza0295:silk"/' \
    -e 's/^VARIANT=.*/VARIANT="Silk"/' \
    -e 's/^VARIANT_ID=.*/VARIANT_ID=silk/' \
    -e 's/^VERSION_CODENAME=.*/VERSION_CODENAME="Nachtblau"/' \
    /usr/lib/os-release || true

  # IMAGE_ID / IMAGE_VERSION (systemd ≥ 249)
  if grep -q '^IMAGE_ID=' /usr/lib/os-release; then
    sed -i "s|^IMAGE_ID=.*|IMAGE_ID=\"${IMAGE_NAME}\"|" /usr/lib/os-release
  else
    echo "IMAGE_ID=\"${IMAGE_NAME}\"" >> /usr/lib/os-release
  fi

  # Restliche Aurora-/UBlue-Strings entfernen
  sed -i \
    -e 's/[Aa]urora/Silk/g' \
    -e 's/getaurora\.dev/github.com\/wuza0295\/nachtblau-crew/g' \
    -e 's/ublue-os/wuza0295/g' \
    /usr/lib/os-release || true

  # EFIDIR muss fedora bleiben (GRUB)
  if [[ -f /usr/sbin/grub2-switch-to-blscfg ]]; then
    sed -i 's|^EFIDIR=.*|EFIDIR="fedora"|' /usr/sbin/grub2-switch-to-blscfg || true
  fi
fi

# /etc/os-release → /usr/lib/os-release (bootc/ostree)
ln -sf ../usr/lib/os-release /etc/os-release 2>/dev/null || true

mkdir -p /usr/share/ublue-os
cat > /usr/share/ublue-os/image-info.json <<EOF
{
  "image-name": "${IMAGE_NAME}",
  "image-flavor": "main",
  "image-vendor": "${VENDOR}",
  "image-ref": "ostree-image-signed:docker://ghcr.io/${VENDOR}/${IMAGE_NAME}",
  "image-tag": "latest",
  "base-image-name": "aurora",
  "fedora-version": "$(rpm -E %fedora 2>/dev/null || echo unknown)"
}
EOF

# --- Plymouth: Silk-Wasserzeichen erzwingen, Initramfs aktualisieren ---
if [[ -f /usr/share/plymouth/themes/spinner/watermark.png ]]; then
  # system_files liefert bereits Silk-watermark; Aurora-Kinoite-Kopie mitziehen
  if [[ -f /usr/share/plymouth/themes/spinner/kinoite-watermark.png ]]; then
    cp -f /usr/share/plymouth/themes/spinner/watermark.png \
      /usr/share/plymouth/themes/spinner/kinoite-watermark.png
  fi
fi

# Falls Branding-Quellen vorhanden und magick/rsvg: optional nachziehen
if [[ -d "$BRAND_SRC" ]] && command -v rsvg-convert >/dev/null 2>&1; then
  if [[ -f "$BRAND_SRC/silk-banner.svg" ]]; then
    tmp="$(mktemp -d)"
    rsvg-convert -w 122 -h 30 "$BRAND_SRC/silk-banner.svg" -o "$tmp/b.png" 2>/dev/null || true
    if [[ -f "$tmp/b.png" ]] && command -v convert >/dev/null 2>&1; then
      convert "$tmp/b.png" -background none -gravity center -extent 128x32 \
        /usr/share/plymouth/themes/spinner/watermark.png || true
      cp -f /usr/share/plymouth/themes/spinner/watermark.png \
        /usr/share/plymouth/themes/spinner/kinoite-watermark.png 2>/dev/null || true
    fi
    rm -rf "$tmp"
  fi
fi

# Plymouth-Theme aktiv halten (spinner = Fedora/UBlue Standard mit BGRT + watermark)
if command -v plymouth-set-default-theme >/dev/null 2>&1; then
  plymouth-set-default-theme spinner 2>/dev/null || true
fi

# Initramfs neu bauen, damit watermark im Early-Boot landet
if command -v dracut >/dev/null 2>&1; then
  for kver in /lib/modules/*; do
    [[ -d "$kver" ]] || continue
    kv="$(basename "$kver")"
    [[ -e "/lib/modules/${kv}/vmlinuz" || -e "/lib/modules/${kv}/System.map" ]] || continue
    echo "dracut for ${kv}…"
    /usr/bin/dracut --no-hostonly --kver "$kv" --reproducible -v --add ostree \
      -f "/lib/modules/${kv}/initramfs.img" 2>/dev/null || \
      /usr/bin/dracut --no-hostonly --kver "$kv" -f "/lib/modules/${kv}/initramfs.img" || true
  done
fi

# --- Plasma: Silk Look-and-Feel + Splash; Aurora-Defaults überschreiben ---
mkdir -p /usr/share/kde-settings/kde-profile/default/xdg
cat > /usr/share/kde-settings/kde-profile/default/xdg/ksplashrc <<'EOF'
[KSplash]
Theme=org.silk.desktop
EOF

# Aurora-Splash-Logos durch Silk ersetzen (falls Look-and-Feel noch referenziert wird)
for aurora_lf in \
  /usr/share/plasma/look-and-feel/dev.getaurora.aurora.desktop \
  /usr/share/plasma/look-and-feel/dev.getaurora.auroralight.desktop
do
  if [[ -d "$aurora_lf/contents/splash/images" ]]; then
    if [[ -f /usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/images/silk_logo.svgz ]]; then
      cp -f /usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/images/silk_logo.svgz \
        "$aurora_lf/contents/splash/images/aurora_logo.svgz" || true
    fi
  fi
  # Splash.qml auf Silk-Asset umbiegen, falls vorhanden
  if [[ -f "$aurora_lf/contents/splash/Splash.qml" ]]; then
    sed -i 's|images/aurora_logo\.svgz|images/aurora_logo.svgz|g' "$aurora_lf/contents/splash/Splash.qml" || true
  fi
done

# Standard-Look-and-Feel systemweit (Plasma)
mkdir -p /etc/xdg
if [[ -f /etc/xdg/kdeglobals ]]; then
  if grep -q '^LookAndFeelPackage=' /etc/xdg/kdeglobals 2>/dev/null; then
    sed -i 's|^LookAndFeelPackage=.*|LookAndFeelPackage=org.silk.desktop|' /etc/xdg/kdeglobals
  else
    printf '\n[KDE]\nLookAndFeelPackage=org.silk.desktop\n' >> /etc/xdg/kdeglobals
  fi
else
  cat > /etc/xdg/kdeglobals <<'EOF'
[General]
Name=Silk

[KDE]
LookAndFeelPackage=org.silk.desktop
EOF
fi

# SDDM: Hintergrund auf Silk-Lock, falls Theme-Konfiguration greifbar
if [[ -d /etc/sddm.conf.d ]]; then
  cat > /etc/sddm.conf.d/10-silk.conf <<'EOF'
[Theme]
Current=breeze

[General]
# Produktname nur informativ; SDDM zeigt Theme-Wallpaper
EOF
fi
# Breeze SDDM Hintergrund → Silk Lock (best-effort)
for theme_dir in /usr/share/sddm/themes/breeze /usr/share/sddm/themes/01-breeze-fedora; do
  if [[ -d "$theme_dir" && -f /usr/share/silk/wallpapers/silk-lock.png ]]; then
    cp -f /usr/share/silk/wallpapers/silk-lock.png "$theme_dir/background.png" 2>/dev/null || true
    if [[ -f "$theme_dir/theme.conf" ]]; then
      sed -i 's|^background=.*|background=background.png|' "$theme_dir/theme.conf" 2>/dev/null || true
    fi
    if [[ -f "$theme_dir/theme.conf.user" ]]; then
      sed -i 's|^background=.*|background=background.png|' "$theme_dir/theme.conf.user" 2>/dev/null || true
    fi
  fi
done

# GRUB: Distributor-Name (sichtbar in manchen Boot-Menüs)
if [[ -f /etc/default/grub ]]; then
  if grep -q '^GRUB_DISTRIBUTOR=' /etc/default/grub; then
    sed -i 's|^GRUB_DISTRIBUTOR=.*|GRUB_DISTRIBUTOR="Silk"|' /etc/default/grub
  else
    echo 'GRUB_DISTRIBUTOR="Silk"' >> /etc/default/grub
  fi
fi

# Fastfetch / MOTD: Aurora-ASCII weg, Silk-Hinweis
if [[ -f /usr/share/ublue-os/aurora-ascii-logo.txt ]]; then
  cat > /usr/share/ublue-os/aurora-ascii-logo.txt <<'EOF'
   _____ _ _ _
  / ____(_) | |
 | (___  _| | | __
  \___ \| | | |/ /
  ____) | | |   <
 |_____/|_|_|_|\_\
EOF
fi
mkdir -p /usr/share/silk
cat > /usr/share/silk/silk-ascii-logo.txt <<'EOF'
   _____ _ _ _
  / ____(_) | |
 | (___  _| | | __
  \___ \| | | |/ /
  ____) | | |   <
 |_____/|_|_|_|\_\
EOF

# Desktop-Datei-Icons auf Silk-Mark zeigen (Welcome etc.)
if [[ -f /usr/share/icons/hicolor/scalable/apps/start-here.svg ]]; then
  for desk in /usr/share/applications/silk-*.desktop; do
    [[ -f "$desk" ]] || continue
    if grep -q '^Icon=help-about' "$desk"; then
      sed -i 's|^Icon=help-about|Icon=start-here|' "$desk" || true
    fi
  done
fi

# --- Anaconda / Installer: SS AURORA + Dino-Mascots → Silk Owl ---
# system_files liefert bereits pixmaps; hier Upstream-Reste und Live-Hintergründe überschreiben.
ANA_BG="${BRAND_SRC}/anaconda-bg.png"
ANA_DONE="${BRAND_SRC}/anaconda-done.png"
ANA_MARK="${BRAND_SRC}/silk-mark.png"
ANA_BANNER="${BRAND_SRC}/silk-banner.png"
if [[ -f "$ANA_BG" ]]; then
  mkdir -p /usr/share/anaconda/pixmaps
  cp -f "$ANA_BG" /usr/share/anaconda/pixmaps/background.png 2>/dev/null || true
  cp -f "$ANA_BG" /usr/share/anaconda/pixmaps/sidebar-bg.png 2>/dev/null || true
  # Häufige Live-/Default-Hintergründe (Aurora-Schiff o.ä.)
  for dest in \
    /usr/share/backgrounds/default.png \
    /usr/share/backgrounds/images/default.png \
    /usr/share/backgrounds/aurora \
    /usr/share/wallpapers/Aurora \
    /usr/share/wallpapers/aurora
  do
    if [[ -d "$dest" ]]; then
      find "$dest" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) \
        -exec cp -f "$ANA_BG" {} \; 2>/dev/null || true
    elif [[ -f "$dest" ]]; then
      cp -f "$ANA_BG" "$dest" 2>/dev/null || true
    fi
  done
  # Jeden Wallpaper-Pfad mit „aurora“ im Namen ersetzen (best-effort)
  while IFS= read -r -d '' f; do
    cp -f "$ANA_BG" "$f" 2>/dev/null || true
  done < <(find /usr/share/backgrounds /usr/share/wallpapers -type f \
    \( -iname '*aurora*' -o -iname '*Aurora*' \) \
    \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0 2>/dev/null || true)
fi
if [[ -f "$ANA_DONE" ]]; then
  mkdir -p /usr/share/anaconda/pixmaps
  for name in done.png progress_done.png complete.png success.png \
              konqi.png katie.png mascot.png payload-complete.png; do
    cp -f "$ANA_DONE" "/usr/share/anaconda/pixmaps/${name}" 2>/dev/null || true
  done
  # Falls Upstream eigene Done-Grafiken unter anderen Namen legt
  while IFS= read -r -d '' f; do
    case "$(basename "$f" | tr '[:upper:]' '[:lower:]')" in
      *done*|*complete*|*konqi*|*katie*|*mascot*|*dino*)
        cp -f "$ANA_DONE" "$f" 2>/dev/null || true
        ;;
    esac
  done < <(find /usr/share/anaconda -type f \( -iname '*.png' -o -iname '*.svg' \) -print0 2>/dev/null || true)
fi
if [[ -f "$ANA_MARK" ]]; then
  cp -f "$ANA_MARK" /usr/share/anaconda/pixmaps/product-logo.png 2>/dev/null || true
fi
if [[ -f "$ANA_BANNER" ]]; then
  cp -f "$ANA_BANNER" /usr/share/anaconda/pixmaps/fedora-logo.png 2>/dev/null || true
  cp -f "$ANA_BANNER" /usr/share/anaconda/pixmaps/sidebar-logo.png 2>/dev/null || true
fi

echo "Silk Branding fertig."
cat /usr/lib/os-release 2>/dev/null | head -20 || true
