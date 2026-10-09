#!/usr/bin/env bash
# Offline-Tests für Silk Helfer (ohne Container-Build)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

ok() { echo "OK  $*"; PASS=$((PASS + 1)); }
bad() { echo "FAIL $*"; FAIL=$((FAIL + 1)); }

echo "== Syntax-Check =="
while IFS= read -r -d '' f; do
  if bash -n "$f"; then
    ok "bash -n $(basename "$f")"
  else
    bad "bash -n $f"
  fi
done < <(find "$ROOT/build_files" "$ROOT/system_files/usr/bin" "$ROOT/system_files/usr/libexec" -type f \( -name '*.sh' -o -name 'silk-*' -o -name 'firstboot' -o -name 'set-icon-theme' -o -name 'plug-ready' -o -name 'user-ready' -o -name 'ux-helpers' \) -print0)

echo "== Pflicht-Dateien =="
for f in \
  Containerfile \
  silk.env \
  build_files/build.sh \
  system_files/usr/bin/silk-install \
  system_files/usr/bin/silk-run-exe \
  system_files/usr/bin/silk-run-apk \
  system_files/usr/bin/silk-apply-layout \
  system_files/usr/bin/silk-desktop \
  system_files/usr/bin/silk-setup \
  system_files/usr/bin/silk-welcome \
  system_files/usr/bin/silk-ensure-boxes \
  system_files/usr/bin/silk-sync-config \
  system_files/usr/bin/silk-update \
  system_files/usr/bin/silk-apply-wallpaper \
  system_files/usr/bin/silk-wallpaper \
  system_files/usr/bin/silk-gpu \
  system_files/usr/bin/silk-hardware \
  system_files/usr/bin/silk-connect \
  system_files/usr/bin/silk-doctor \
  system_files/usr/bin/silk-platform \
  system_files/usr/bin/silk-installer \
  system_files/usr/bin/silk-asahi \
  system_files/usr/bin/silk-tablet \
  system_files/usr/bin/silk-mobile \
  system_files/usr/bin/silk-windows \
  system_files/usr/libexec/silk/connect-server \
  system_files/usr/bin/silk-controllers \
  system_files/usr/bin/silk-ready \
  system_files/usr/bin/silk-tour \
  system_files/usr/bin/silk-tips \
  system_files/usr/bin/silk-vm \
  system_files/usr/libexec/silk/ux-helpers \
  system_files/usr/libexec/silk/firstboot \
  system_files/usr/libexec/silk/plug-ready \
  system_files/usr/libexec/silk/user-ready \
  system_files/usr/lib/systemd/system/silk-firstboot.service \
  system_files/usr/lib/systemd/system/silk-plug.service \
  system_files/etc/skel/.config/autostart/silk-tour.desktop \
  system_files/etc/skel/.config/autostart/silk-ready.desktop \
  system_files/usr/share/applications/silk-center.desktop \
  system_files/usr/share/applications/silk-desktop-style.desktop \
  system_files/usr/share/applications/silk-status.desktop \
  system_files/usr/share/applications/silk-update.desktop \
  system_files/usr/share/applications/silk-doctor.desktop \
  system_files/usr/share/silk/center.html \
  system_files/usr/share/silk/tips.txt \
  system_files/etc/udev/rules.d/99-silk-controllers.rules \
  docs/GPU-CONTROLLERS.md \
  docs/OUT-OF-BOX.md \
  docs/UX.md \
  system_files/usr/share/silk/connect/index.html \
  system_files/usr/share/silk/connect/manifest.json \
  system_files/usr/share/silk/mobile-devices.txt \
  system_files/usr/share/silk/guides/install-pc.txt \
  system_files/usr/share/silk/plasma-tablet-layout.js \
  disk_config/iso.toml \
  docs/CONNECT.md \
  docs/PLATFORMS.md \
  system_files/usr/share/silk/wallpapers/manifest.json \
  system_files/usr/share/silk/plasma-apply-wallpaper.js \
  system_files/usr/share/silk/branding/silk-banner.svg \
  system_files/usr/share/silk/branding/silk-mark.svg \
  system_files/usr/share/plymouth/themes/spinner/watermark.png \
  system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/Splash.qml \
  system_files/usr/share/kde-settings/kde-profile/default/xdg/ksplashrc \
  system_files/etc/xdg/kdeglobals \
  build_files/06-branding.sh \
  system_files/etc/skel/.config/kscreenlockerrc \
  system_files/usr/share/silk/app-aliases.json \
  system_files/usr/share/silk/recommended-essentials.txt \
  system_files/usr/share/silk/welcome.html \
  system_files/usr/share/silk/plasma-mac-layout.js \
  system_files/usr/share/silk/plasma-windows11-layout.js \
  system_files/usr/share/silk/plasma-windows10-layout.js \
  system_files/usr/share/applications/silk-open-mac.desktop \
  system_files/usr/share/applications/silk-open-appimage.desktop \
  system_files/usr/share/applications/silk-open-package.desktop \
  system_files/usr/share/applications/silk-welcome.desktop \
  system_files/etc/sysctl.d/99-silk-performance.conf \
  system_files/etc/udev/rules.d/99-silk-storage.rules \
  system_files/etc/udev/rules.d/99-silk-gpu-amd.rules \
  system_files/etc/udev/rules.d/99-silk-gpu-intel.rules \
  system_files/etc/udev/rules.d/99-silk-gpu-nvidia.rules \
  system_files/usr/share/silk/kernel-args-amd.txt \
  system_files/usr/share/silk/kernel-args-intel.txt \
  system_files/usr/share/silk/kernel-args-nvidia.txt \
  system_files/usr/share/silk/hardware-pc.txt \
  system_files/usr/share/silk/hardware-intel-mac.txt \
  system_files/usr/share/silk/hardware-apple-silicon.txt \
  system_files/usr/share/silk/hardware-mac-migration.txt \
  README.md
do
  if [[ -f "$ROOT/$f" ]]; then
    ok "exists $f"
  else
    bad "missing $f"
  fi
done

echo "== Wechsler-Starter =="
grep -q 'ntfs-3g' "$ROOT/build_files/01-packages.sh" && ok "ntfs-3g package" || bad "ntfs-3g"
grep -q 'exfatprogs' "$ROOT/build_files/01-packages.sh" && ok "exfatprogs package" || bad "exfat"
grep -q 'setup-essentials' "$ROOT/system_files/usr/bin/silk-install" && ok "setup-essentials" || bad "setup-essentials"
grep -q 'handle_appimage' "$ROOT/system_files/usr/bin/silk-install" && ok "handle_appimage" || bad "appimage"
grep -q 'handle_deb' "$ROOT/system_files/usr/bin/silk-install" && ok "handle_deb" || bad "deb"
grep -q 'handle_snap' "$ROOT/system_files/usr/bin/silk-install" && ok "handle_snap" || bad "snap"
grep -q 'handle_flatpak_file' "$ROOT/system_files/usr/bin/silk-install" && ok "handle_flatpak_file" || bad "flatpak file"
grep -q 'application/pdf' "$ROOT/system_files/usr/share/applications/mimeapps.list" && ok "pdf mime default" || bad "pdf mime"
grep -q 'vnd.appimage' "$ROOT/system_files/usr/share/applications/mimeapps.list" && ok "appimage mime" || bad "appimage mime"
grep -q 'x-deb' "$ROOT/system_files/usr/share/applications/mimeapps.list" && ok "deb mime" || bad "deb mime"
grep -q 'LibreOffice' "$ROOT/system_files/usr/share/silk/recommended-essentials.txt" && ok "essentials LibreOffice" || bad "essentials LO"
grep -q 'gearlever' "$ROOT/system_files/usr/share/silk/recommended-essentials.txt" && ok "essentials Gear Lever" || bad "gearlever"
grep -q 'AppImage' "$ROOT/system_files/usr/share/silk/welcome.html" && ok "welcome AppImage" || bad "welcome AppImage"
grep -q 'SILK_SKIP_ESSENTIALS' "$ROOT/system_files/usr/bin/silk-setup" && ok "auto essentials setup" || bad "auto essentials"
grep -q 'silk-sync-config' "$ROOT/system_files/usr/bin/silk-update" && ok "silk-update sync" || bad "silk-update"
grep -q 'Verteilung & Updates' "$ROOT/README.md" && ok "README distribution" || bad "README distribution"
grep -q 'SILK_CONFIG_URL' "$ROOT/system_files/usr/bin/silk-sync-config" && ok "git config url" || bad "config url"
[[ -f "$ROOT/system_files/usr/share/silk/wallpapers/silk-desktop.png" ]] && ok "wallpaper default" || bad "wallpaper default"
desktop_count="$(find "$ROOT/system_files/usr/share/silk/wallpapers" -name 'silk-desktop-*.png' 2>/dev/null | wc -l)"
lock_count="$(find "$ROOT/system_files/usr/share/silk/wallpapers" -name 'silk-lock-*.png' 2>/dev/null | wc -l)"
[[ "$desktop_count" -ge 20 ]] && ok "20 desktop wallpapers ($desktop_count)" || bad "desktop count $desktop_count"
[[ "$lock_count" -ge 20 ]] && ok "20 lock screens ($lock_count)" || bad "lock count $lock_count"
grep -q 'manifest.json' "$ROOT/system_files/usr/share/silk/wallpapers/manifest.json" 2>/dev/null || [[ -f "$ROOT/system_files/usr/share/silk/wallpapers/manifest.json" ]] && ok "wallpaper manifest" || bad "manifest"
grep -q 'silk-wallpaper' "$ROOT/system_files/usr/bin/silk-wallpaper" && ok "silk-wallpaper cmd" || bad "silk-wallpaper"
grep -q 'silk-apply-wallpaper' "$ROOT/system_files/usr/bin/silk-apply-layout" && ok "layout applies wallpaper" || bad "wallpaper layout"

echo "== GPU (AMD/Intel/NVIDIA) =="
grep -q '03-gaming.sh' "$ROOT/build_files/build.sh" && ok "build uses 03-gaming.sh" || bad "03-gaming.sh"
grep -q 'intel-gpu-firmware' "$ROOT/build_files/03-gaming.sh" && ok "intel packages" || bad "intel packages"
grep -q 'nvidia-gpu-firmware' "$ROOT/build_files/03-gaming.sh" && ok "nvidia firmware" || bad "nvidia firmware"
grep -q '0x10de' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot nvidia detect" || bad "firstboot nvidia"
grep -q 'silk-nvidia-open' "$ROOT/system_files/usr/share/silk/kernel-args-nvidia.txt" && ok "nvidia image docs" || bad "nvidia image docs"
grep -q 'silk-gpu status' "$ROOT/system_files/usr/bin/silk-gpu" && ok "silk-gpu cmd" || bad "silk-gpu"
grep -q 'SILK_BASE_IMAGE' "$ROOT/Containerfile" && ok "Containerfile base arg" || bad "Containerfile base arg"
grep -q 'silk-nvidia-open' "$ROOT/silk.env" && ok "nvidia image name" || bad "nvidia image name"

echo "== Mac / MacBook Hardware =="
grep -q 'apple-silicon' "$ROOT/system_files/usr/bin/silk-hardware" && ok "silk-hardware apple-silicon" || bad "silk-hardware apple-silicon"
grep -q 'intel-mac' "$ROOT/system_files/usr/bin/silk-hardware" && ok "silk-hardware intel-mac" || bad "silk-hardware intel-mac"
grep -q 'detect_hardware' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot hardware detect" || bad "firstboot hardware"
grep -q 'Fedora Asahi' "$ROOT/system_files/usr/share/silk/hardware-apple-silicon.txt" && ok "asahi doc" || bad "asahi doc"
grep -q 'silk-asahi' "$ROOT/system_files/usr/bin/silk-hardware" && ok "silk-hardware asahi" || bad "silk-hardware asahi"
grep -q 'Mac / MacBook' "$ROOT/README.md" && ok "README mac hardware" || bad "README mac hardware"
bash "$ROOT/system_files/usr/bin/silk-hardware" status >/dev/null && ok "silk-hardware status runs" || bad "silk-hardware status"

echo "== Branding / Image-Name =="
if grep -q '^IMAGE_NAME=silk$' "$ROOT/silk.env"; then
  ok "IMAGE_NAME=silk (kein Upstream-Prefix im Produktnamen)"
else
  bad "IMAGE_NAME sollte silk sein"
fi
if grep -qiE 'Aurora Silk|Silk Aurora' "$ROOT/README.md" "$ROOT/silk.env" 2>/dev/null; then
  bad "Produktname darf nicht mit Upstream-Markenname kombiniert sein"
else
  ok "Produktname nur Silk"
fi

echo "== Branding Assets (Plymouth / Logos / Splash) =="
[[ -f "$ROOT/build_files/06-branding.sh" ]] && ok "06-branding.sh" || bad "06-branding.sh"
grep -q '06-branding.sh' "$ROOT/build_files/build.sh" && ok "build.sh wires branding" || bad "build.sh branding"
bash -n "$ROOT/build_files/06-branding.sh" && ok "06-branding syntax" || bad "06-branding syntax"
grep -q 'NAME="Silk"' "$ROOT/build_files/06-branding.sh" && ok "branding sets NAME Silk" || bad "branding NAME"
grep -q 'plymouth/themes/spinner/watermark' "$ROOT/build_files/06-branding.sh" && ok "branding plymouth watermark" || bad "branding plymouth"
grep -q 'Theme=org.silk.desktop' "$ROOT/build_files/06-branding.sh" && ok "branding ksplash Silk" || bad "branding ksplash"
[[ -f "$ROOT/system_files/usr/share/plymouth/themes/spinner/watermark.png" ]] && ok "plymouth watermark.png" || bad "plymouth watermark.png"
[[ -f "$ROOT/system_files/usr/share/plymouth/themes/spinner/kinoite-watermark.png" ]] && ok "kinoite-watermark.png" || bad "kinoite-watermark"
wm_size="$(file -b "$ROOT/system_files/usr/share/plymouth/themes/spinner/watermark.png" 2>/dev/null || true)"
echo "$wm_size" | grep -q '128 x 32' && ok "watermark size 128x32" || bad "watermark size ($wm_size)"
[[ -f "$ROOT/system_files/usr/share/silk/branding/silk-banner.svg" ]] && ok "silk-banner.svg" || bad "silk-banner.svg"
[[ -f "$ROOT/system_files/usr/share/silk/branding/silk-mark.svg" ]] && ok "silk-mark.svg" || bad "silk-mark.svg"
[[ -f "$ROOT/system_files/usr/share/pixmaps/fedora-logo.png" ]] && ok "fedora-logo.png override" || bad "fedora-logo.png"
[[ -f "$ROOT/system_files/usr/share/pixmaps/system-logo.png" ]] && ok "system-logo.png" || bad "system-logo.png"
[[ -f "$ROOT/system_files/usr/share/icons/hicolor/scalable/places/distributor-logo.svg" ]] && ok "distributor-logo.svg" || bad "distributor-logo"
[[ -f "$ROOT/system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/Splash.qml" ]] && ok "Silk splash Splash.qml" || bad "Splash.qml"
[[ -f "$ROOT/system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/images/silk_logo.svgz" ]] && ok "silk_logo.svgz" || bad "silk_logo.svgz"
[[ -f "$ROOT/system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/defaults" ]] && ok "Silk LAF defaults" || bad "Silk LAF defaults"
grep -q 'LookAndFeelPackage=org.silk.desktop' "$ROOT/system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/defaults" && ok "defaults LookAndFeel Silk" || bad "defaults LookAndFeel"
grep -q 'Theme=org.silk.desktop' "$ROOT/system_files/usr/share/kde-settings/kde-profile/default/xdg/ksplashrc" && ok "ksplashrc Silk" || bad "ksplashrc"
grep -q 'Theme=org.silk.desktop' "$ROOT/system_files/etc/skel/.config/ksplashrc" && ok "skel ksplashrc" || bad "skel ksplashrc"
grep -q 'LookAndFeelPackage=org.silk.desktop' "$ROOT/system_files/etc/xdg/kdeglobals" && ok "xdg kdeglobals Silk" || bad "xdg kdeglobals"
grep -q 'LookAndFeelPackage=org.silk.desktop' "$ROOT/system_files/etc/skel/.config/kdeglobals" && ok "skel kdeglobals Silk" || bad "skel kdeglobals"
[[ -f "$ROOT/system_files/usr/share/anaconda/pixmaps/product-logo.png" ]] && ok "anaconda product-logo" || bad "anaconda product-logo"
grep -qE 'BGRT|Plymouth-Wasserzeichen' "$ROOT/docs/VM-WINDOWS.md" && ok "docs boot logos" || bad "docs boot logos"
# Assets dürfen kein Aurora-Wortmark enthalten
if grep -qiE '\bAurora\b' "$ROOT/system_files/usr/share/silk/branding/"*.svg 2>/dev/null; then
  bad "Aurora in branding SVGs"
else
  ok "no Aurora in branding SVGs"
fi
if grep -qiE 'aurora_logo|getaurora|Aurora' \
  "$ROOT/system_files/usr/share/plasma/look-and-feel/org.silk.desktop/contents/splash/Splash.qml" \
  "$ROOT/system_files/usr/share/kde-settings/kde-profile/default/xdg/ksplashrc" 2>/dev/null; then
  bad "Aurora refs in Silk splash/ksplash"
else
  ok "no Aurora in Silk splash/ksplash"
fi

echo "== Containerfile Basis =="
if grep -qE 'ARG SILK_BASE_IMAGE=ghcr.io/ublue-os/aurora:stable' "$ROOT/Containerfile"; then
  ok "Upstream-Base KDE :stable default (ARG)"
else
  bad "Containerfile base image default"
fi
# Kein Digest-Pin – würde Upstream-Tracking einfrieren
if grep -qE 'FROM ghcr.io/ublue-os/aurora@sha256:' "$ROOT/Containerfile"; then
  bad "Containerfile must not pin upstream digest"
else
  ok "no upstream digest pin"
fi
if grep -qiE '^FROM[[:space:]].*bazzite' "$ROOT/Containerfile"; then
  bad "Containerfile must not FROM bazzite (single KDE upstream base)"
else
  ok "single KDE upstream base (no bazzite FROM)"
fi

echo "== Update-Dokumentation =="
for needle in 'Updates einspielen' 'bootc upgrade' 'ujust update' 'rpm-ostree upgrade' 'Bazzite'; do
  if grep -qF "$needle" "$ROOT/README.md"; then
    ok "README mentions $needle"
  else
    bad "README missing: $needle"
  fi
done
if grep -qE 'Produktname: \*\*Silk\*\*|IMAGE_NAME=silk' "$ROOT/README.md" "$ROOT/silk.env"; then
  ok "README/Produktname Silk"
else
  bad "README/Produktname Silk"
fi

echo "== CI Pull-Strategie =="
if grep -q -- '--pull=always' "$ROOT/Justfile"; then
  ok "Justfile --pull=always"
else
  bad "Justfile missing --pull=always"
fi
WF_ROOT="$(cd "$ROOT/.." && pwd)/.github/workflows/silk-build.yml"
if [[ -f "$WF_ROOT" ]] && grep -q 'cron:' "$WF_ROOT" && grep -q 'aurora:stable' "$WF_ROOT" && grep -q 'aurora-nvidia-open:stable' "$WF_ROOT"; then
  ok "root workflow cron + amd/intel + nvidia base pull"
else
  bad "root workflow cron/base pull"
fi

echo "== app-aliases.json =="
if jq -e '.steam == "com.valvesoftware.Steam"' "$ROOT/system_files/usr/share/silk/app-aliases.json" >/dev/null; then
  ok "steam alias"
else
  bad "steam alias / jq"
fi
if jq -e '.safari == "org.mozilla.firefox"' "$ROOT/system_files/usr/share/silk/app-aliases.json" >/dev/null; then
  ok "safari→firefox alias"
else
  bad "safari alias"
fi
if jq -e '.explorer == "org.kde.dolphin"' "$ROOT/system_files/usr/share/silk/app-aliases.json" >/dev/null; then
  ok "explorer→dolphin alias"
else
  bad "explorer alias"
fi

echo "== silk-install Hilfslogik =="
guess_query_from_file() {
  local stem b path="$1"
  b="$(basename "$path")"
  if [[ "${b,,}" == *.app ]]; then
    stem="${b:0:-4}"
  else
    stem="${b%.*}"
  fi
  echo "$stem" | sed -E \
    -e 's/\.app$//I' \
    -e 's/[-_ ]?(setup|installer|install|x64|x86|win64|windows|portable|dmg|pkg|universal|arm64|intel)$//I' \
    -e 's/[0-9]+(\.[0-9]+){1,3}//g' \
    -e 's/[-_.]+/ /g' \
    -e 's/^ +| +$//g'
}

q="$(guess_query_from_file "/tmp/DiscordSetup.exe")"
[[ "$q" =~ [Dd]iscord ]] && ok "guess DiscordSetup.exe → [$q]" || bad "guess exe [$q]"

q="$(guess_query_from_file "/tmp/Firefox.app")"
[[ "$q" =~ [Ff]irefox ]] && ok "guess Firefox.app → [$q]" || bad "guess app [$q]"

q="$(guess_query_from_file "/tmp/GoogleChrome.dmg")"
[[ -n "$q" ]] && ok "guess GoogleChrome.dmg → [$q]" || bad "guess dmg empty"

alias_lookup() {
  local key="$1"
  key="$(echo "$key" | tr '[:upper:]' '[:lower:]' | sed -E 's/[[:space:]]+/ /g; s/^ +| +$//g')"
  jq -r --arg k "$key" '
    to_entries[]
    | select((.key | ascii_downcase) == $k)
    | .value
  ' "$ROOT/system_files/usr/share/silk/app-aliases.json" | head -1
}

[[ "$(alias_lookup steam)" == "com.valvesoftware.Steam" ]] && ok "alias_lookup steam" || bad "alias_lookup steam"
[[ "$(alias_lookup FIREFOX)" == "org.mozilla.firefox" ]] && ok "alias_lookup FIREFOX" || bad "alias_lookup FIREFOX"
[[ "$(alias_lookup 'Google Chrome')" == "com.google.Chrome" ]] && ok "alias_lookup Google Chrome" || bad "alias_lookup Google Chrome"

echo "== Gaming Flatpaks =="
RFP="$ROOT/system_files/usr/share/silk/recommended-flatpaks.txt"
if [[ -f "$RFP" ]]; then
  ok "exists recommended-flatpaks.txt"
else
  bad "missing recommended-flatpaks.txt"
fi
for id in com.valvesoftware.Steam com.heroicgameslauncher.hgl io.itch.itch com.discordapp.Discord com.obsproject.Studio org.prismlauncher.PrismLauncher sh.ppy.osu com.moonlight_stream.Moonlight; do
  grep -qxF "$id" "$RFP" && ok "flatpak $id" || bad "flatpak $id"
done
[[ "$(alias_lookup itch)" == "io.itch.itch" ]] && ok "alias itch" || bad "alias itch"
[[ "$(alias_lookup osu)" == "sh.ppy.osu" ]] && ok "alias osu" || bad "alias osu"
[[ "$(alias_lookup 'geforce now')" == "io.github.hmlendea.geforcenow-electron" ]] && ok "alias geforce now" || bad "alias geforce now"

echo "== MIME / Desktop-Wahl =="
grep -q 'MimeType=application/x-ms-dos-executable' "$ROOT/system_files/usr/share/applications/silk-open-exe.desktop" \
  && ok "exe mime" || bad "exe mime"
grep -q 'MimeType=application/vnd.android.package-archive' "$ROOT/system_files/usr/share/applications/silk-open-apk.desktop" \
  && ok "apk mime" || bad "apk mime"
grep -q 'application/x-apple-diskimage' "$ROOT/system_files/usr/share/applications/silk-open-mac.desktop" \
  && ok "mac mime" || bad "mac mime"
grep -q 'windows11' "$ROOT/system_files/usr/bin/silk-desktop" \
  && ok "silk-desktop windows11" || bad "silk-desktop"
grep -q 'handle_mac' "$ROOT/system_files/usr/bin/silk-install" \
  && ok "silk-install handle_mac" || bad "handle_mac"

echo "== Silk Connect & Tablet =="
grep -q 'silk-connect setup' "$ROOT/system_files/usr/bin/silk-connect" && ok "silk-connect setup" || bad "silk-connect setup"
grep -q 'SilkConnectHandler' "$ROOT/system_files/usr/libexec/silk/connect-server" && ok "connect-server" || bad "connect-server"
[[ -f "$ROOT/system_files/usr/share/silk/connect/index.html" ]] && ok "connect PWA" || bad "connect PWA"
grep -q 'tablet' "$ROOT/system_files/usr/bin/silk-desktop" && ok "silk-desktop tablet" || bad "tablet style"
grep -q 'apply_tablet' "$ROOT/system_files/usr/bin/silk-apply-layout" && ok "apply_tablet" || bad "apply_tablet"
grep -q 'silk-doctor' "$ROOT/system_files/usr/bin/silk-doctor" && ok "silk-doctor" || bad "silk-doctor"
grep -q 'SILK_AUTO_CONNECT' "$ROOT/system_files/usr/bin/silk-setup" && ok "setup connect prompt" || bad "setup connect"
grep -q 'python3' "$ROOT/build_files/01-packages.sh" && ok "python3 for connect" || bad "python3"
[[ -f "$ROOT/docs/PLATFORMS.md" ]] && ok "PLATFORMS.md" || bad "PLATFORMS.md"
[[ -f "$ROOT/docs/CONNECT.md" ]] && ok "CONNECT.md" || bad "CONNECT.md"
python3 -m py_compile "$ROOT/system_files/usr/libexec/silk/connect-server" && ok "connect-server syntax" || bad "connect-server py"

echo "== Multi-Plattform (PC, Tablet, Mac, Mobile) =="
grep -q 'silk-platform detect' "$ROOT/system_files/usr/bin/silk-platform" && ok "silk-platform" || bad "silk-platform"
grep -q 'silk-installer switch' "$ROOT/system_files/usr/bin/silk-installer" && ok "silk-installer" || bad "silk-installer"
grep -q 'silk-asahi switch' "$ROOT/system_files/usr/bin/silk-asahi" && ok "silk-asahi" || bad "silk-asahi"
grep -q 'silk-tablet setup' "$ROOT/system_files/usr/bin/silk-tablet" && ok "silk-tablet" || bad "silk-tablet"
grep -q 'silk-mobile setup' "$ROOT/system_files/usr/bin/silk-mobile" && ok "silk-mobile" || bad "silk-mobile"
grep -q 'IMAGE_NAME_ASAHI' "$ROOT/silk.env" && ok "silk-asahi env" || bad "silk-asahi env"
grep -q 'silk-asahi' "$ROOT/system_files/usr/share/silk/hardware-apple-silicon.txt" && ok "asahi hardware doc" || bad "asahi hardware doc"
grep -q 'kdeconnect' "$ROOT/build_files/04-compat.sh" && ok "kdeconnect package" || bad "kdeconnect"
grep -q 'silk-platform detect' "$ROOT/system_files/usr/bin/silk-setup" && ok "setup platform detect" || bad "setup platform"
[[ -f "$ROOT/disk_config/iso.toml" ]] && ok "iso.toml" || bad "iso.toml"
grep -q 'Modules.Localization' "$ROOT/disk_config/iso.toml" && ok "iso Localization module" || bad "iso Localization module"
grep -q 'lang de_DE.UTF-8' "$ROOT/disk_config/iso.toml" && ok "iso lang de_DE" || bad "iso lang de_DE"
grep -q 'inst.lang=de_DE.UTF-8' "$ROOT/disk_config/iso.toml" && ok "iso inst.lang kernel" || bad "iso inst.lang kernel"
grep -q 'Modules.Localization' "$ROOT/disk_config/iso-kde.toml" && ok "iso-kde Localization" || bad "iso-kde Localization"
grep -q 'lang de_DE.UTF-8' "$ROOT/disk_config/iso-kde.toml" && ok "iso-kde lang de_DE" || bad "iso-kde lang de_DE"
grep -q 'glibc-langpack-de' "$ROOT/build_files/01-packages.sh" && ok "glibc-langpack-de" || bad "glibc-langpack-de"
grep -q 'langpacks-de' "$ROOT/build_files/01-packages.sh" && ok "langpacks-de" || bad "langpacks-de"
[[ -f "$ROOT/system_files/etc/locale.conf" ]] && grep -q 'de_DE.UTF-8' "$ROOT/system_files/etc/locale.conf" && ok "locale.conf de_DE" || bad "locale.conf de_DE"
[[ -f "$ROOT/system_files/etc/vconsole.conf" ]] && grep -q 'KEYMAP=de' "$ROOT/system_files/etc/vconsole.conf" && ok "vconsole.de" || bad "vconsole.de"
grep -q 'inst.lang=de_DE' "$ROOT/docs/VM-WINDOWS.md" && ok "VM-WINDOWS lang workaround" || bad "VM-WINDOWS lang workaround"
WF_ROOT="$(cd "$ROOT/.." && pwd)/.github/workflows/silk-build.yml"
grep -q 'silk-asahi' "$WF_ROOT" && ok "CI silk-asahi matrix" || bad "CI asahi"
grep -q 'kdeconnect' "$ROOT/system_files/usr/bin/silk-connect" && ok "connect kdeconnect" || bad "connect kdeconnect"

echo "== Windows ohne Hürde =="
grep -q 'silk-windows run' "$ROOT/system_files/usr/bin/silk-run-exe" && ok "silk-run-exe → silk-windows" || bad "silk-run-exe"
grep -q 'setup-windows' "$ROOT/system_files/usr/bin/silk-install" && ok "setup-windows" || bad "setup-windows"
grep -q 'SILK_WINDOWS_PREFER\|windows_prefer\|prefer' "$ROOT/system_files/usr/bin/silk-install" && ok "windows prefer in install" || bad "windows prefer"
grep -q 'ensure_bottle\|SilkWindows' "$ROOT/system_files/usr/bin/silk-windows" && ok "silk-windows bottle" || bad "silk-windows bottle"
grep -q 'SILK_AUTO_WINDOWS\|setup-windows' "$ROOT/system_files/usr/bin/silk-setup" && ok "setup auto windows" || bad "setup windows"
grep -q 'com.usebottles.bottles' "$ROOT/system_files/usr/share/silk/recommended-essentials.txt" && ok "bottles in essentials" || bad "bottles essentials"
[[ -f "$ROOT/docs/WINDOWS.md" ]] && ok "WINDOWS.md" || bad "WINDOWS.md"
bash -n "$ROOT/system_files/usr/bin/silk-windows" && ok "silk-windows syntax" || bad "silk-windows syntax"

echo "== Desktop-Gewohnheiten (Mac/Windows) =="
grep -q 'silk-apply-habits' "$ROOT/system_files/usr/bin/silk-apply-layout" && ok "layout calls habits" || bad "layout habits"
grep -q 'Meta+Space\|Meta+E\|Hot Corner\|NaturalScroll\|ButtonsOnLeft' "$ROOT/system_files/usr/bin/silk-apply-habits" && ok "habits shortcuts" || bad "habits shortcuts"
grep -q 'org.kde.plasma.appmenu' "$ROOT/system_files/usr/share/silk/plasma-mac-layout.js" && ok "mac appmenu" || bad "mac appmenu"
grep -q 'org.kde.plasma.showdesktop' "$ROOT/system_files/usr/share/silk/plasma-windows11-layout.js" && ok "win11 showdesktop" || bad "win11 showdesktop"
[[ -f "$ROOT/docs/HABITS.md" ]] && ok "HABITS.md" || bad "HABITS.md"
bash -n "$ROOT/system_files/usr/bin/silk-apply-habits" && ok "habits syntax" || bad "habits syntax"
grep -q 'Gewohnheiten nach Desktop-Stil' "$ROOT/system_files/usr/share/silk/welcome.html" && ok "welcome habits" || bad "welcome habits"

echo "== GPU AMD/NVIDIA + Controller =="
grep -q 'silk-nvidia' "$ROOT/silk.env" && ok "silk-nvidia env" || bad "silk-nvidia env"
grep -q 'silk-nvidia' "$WF_ROOT" && ok "CI silk-nvidia" || bad "CI silk-nvidia"
grep -q 'steam-devices' "$ROOT/build_files/03-gaming.sh" && ok "steam-devices package" || bad "steam-devices"
grep -q 'mesa-vulkan-drivers.i686' "$ROOT/build_files/03-gaming.sh" && ok "32bit mesa steam" || bad "32bit mesa"
grep -q 'silk-gpu switch' "$ROOT/system_files/usr/bin/silk-gpu" && ok "silk-gpu switch" || bad "silk-gpu switch"
grep -q 'DualSense\|045e\|054c' "$ROOT/system_files/etc/udev/rules.d/99-silk-controllers.rules" && ok "controller udev" || bad "controller udev"
grep -q 'silk-controllers' "$ROOT/system_files/usr/bin/silk-setup" && ok "setup controllers" || bad "setup controllers"
[[ -f "$ROOT/docs/GPU-CONTROLLERS.md" ]] && ok "GPU-CONTROLLERS.md" || bad "GPU-CONTROLLERS.md"
bash -n "$ROOT/system_files/usr/bin/silk-controllers" && ok "controllers syntax" || bad "controllers syntax"
bash -n "$ROOT/system_files/usr/bin/silk-gpu" && ok "silk-gpu syntax" || bad "silk-gpu syntax"

echo "== Auspacken und loslegen (OOB) =="
grep -q 'SILK_AUTO_GPU_SWITCH' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot auto GPU switch" || bad "firstboot auto GPU"
grep -q 'maybe_switch_gpu_image\|recommended_image' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot image switch" || bad "firstboot image switch"
grep -q 'gpu-switch-pending' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot pending reboot" || bad "firstboot pending"
grep -q 'setup_controllers_system' "$ROOT/system_files/usr/libexec/silk/firstboot" && ok "firstboot controllers" || bad "firstboot controllers"
grep -q 'silk-plug.service' "$ROOT/build_files/05-finalize.sh" && ok "finalize enables silk-plug" || bad "finalize silk-plug"
grep -q 'bluetooth.service' "$ROOT/build_files/05-finalize.sh" && ok "finalize enables bluetooth" || bad "finalize bluetooth"
grep -q 'plug-ready' "$ROOT/system_files/usr/lib/systemd/system/silk-plug.service" && ok "silk-plug service" || bad "silk-plug service"
grep -q 'user-ready' "$ROOT/system_files/etc/skel/.config/autostart/silk-ready.desktop" && ok "skel silk-ready autostart" || bad "skel autostart"
grep -q 'X-GNOME-Autostart-enabled=false' "$ROOT/system_files/etc/skel/.config/autostart/silk-ready.desktop" && ok "ready autostart off (tour)" || bad "ready autostart"
grep -q 'Auspacken und loslegen' "$ROOT/docs/OUT-OF-BOX.md" && ok "OUT-OF-BOX.md" || bad "OUT-OF-BOX.md"
grep -q 'silk-ready' "$ROOT/README.md" && ok "README silk-ready" || bad "README silk-ready"
grep -q 'on the fly\|Auto-Switch' "$ROOT/docs/GPU-CONTROLLERS.md" && ok "GPU-CONTROLLERS OOB" || bad "GPU-CONTROLLERS OOB"
grep -q 'Auspacken und loslegen' "$ROOT/system_files/usr/share/silk/welcome.html" && ok "welcome OOB" || bad "welcome OOB"
[[ -x "$ROOT/system_files/usr/bin/silk-ready" ]] && ok "silk-ready executable" || bad "silk-ready exec"
[[ -x "$ROOT/system_files/usr/libexec/silk/plug-ready" ]] && ok "plug-ready executable" || bad "plug-ready exec"
[[ -x "$ROOT/system_files/usr/libexec/silk/user-ready" ]] && ok "user-ready executable" || bad "user-ready exec"
bash -n "$ROOT/system_files/usr/bin/silk-ready" && ok "silk-ready syntax" || bad "silk-ready syntax"
bash "$ROOT/system_files/usr/bin/silk-ready" --help >/dev/null && ok "silk-ready help" || bad "silk-ready help"

echo "== User Experience (Tour / Startzentrum) =="
grep -q 'silk_progress_start\|install_shortcuts' "$ROOT/system_files/usr/bin/silk-tour" && ok "silk-tour progress+shortcuts" || bad "silk-tour"
grep -q 'silk-tour' "$ROOT/system_files/etc/skel/.config/autostart/silk-tour.desktop" && ok "skel silk-tour autostart" || bad "skel tour"
grep -q 'X-GNOME-Autostart-enabled=false' "$ROOT/system_files/etc/skel/.config/autostart/silk-setup.desktop" && ok "setup autostart off" || bad "setup autostart"
grep -q 'X-GNOME-Autostart-enabled=false' "$ROOT/system_files/etc/skel/.config/autostart/silk-welcome.desktop" && ok "welcome autostart off" || bad "welcome autostart"
grep -q 'Startzentrum\|silk-tour --center' "$ROOT/system_files/usr/share/silk/center.html" && ok "center.html" || bad "center.html"
grep -q 'silk-tips' "$ROOT/system_files/usr/bin/silk-tips" && ok "silk-tips cmd" || bad "silk-tips"
grep -q 'Doppelklick auf .exe' "$ROOT/system_files/usr/share/silk/tips.txt" && ok "tips.txt" || bad "tips.txt"
grep -q 'silk_notify\|silk_progress' "$ROOT/system_files/usr/libexec/silk/ux-helpers" && ok "ux-helpers" || bad "ux-helpers"
grep -q 'Exec=silk-tour --center' "$ROOT/system_files/usr/share/applications/silk-center.desktop" && ok "menu silk-center" || bad "menu center"
grep -q 'Exec=silk-desktop --ask' "$ROOT/system_files/usr/share/applications/silk-desktop-style.desktop" && ok "menu desktop-style" || bad "menu style"
grep -q 'Exec=silk-doctor --gui' "$ROOT/system_files/usr/share/applications/silk-doctor.desktop" && ok "menu doctor" || bad "menu doctor"
grep -q '\-\-gui' "$ROOT/system_files/usr/bin/silk-doctor" && ok "doctor --gui" || bad "doctor gui"
grep -q 'silk-tour' "$ROOT/system_files/usr/libexec/silk/user-ready" && ok "user-ready → tour" || bad "user-ready tour"
grep -q 'User Experience' "$ROOT/docs/UX.md" && ok "UX.md" || bad "UX.md"
grep -q 'silk-tour' "$ROOT/README.md" && ok "README tour" || bad "README tour"
grep -q 'silk-tour' "$ROOT/system_files/usr/share/silk/welcome.html" && ok "welcome mentions tour" || bad "welcome tour"
[[ -x "$ROOT/system_files/usr/bin/silk-tour" ]] && ok "silk-tour executable" || bad "silk-tour exec"
[[ -x "$ROOT/system_files/usr/bin/silk-tips" ]] && ok "silk-tips executable" || bad "silk-tips exec"
bash -n "$ROOT/system_files/usr/bin/silk-tour" && ok "silk-tour syntax" || bad "silk-tour syntax"
bash -n "$ROOT/system_files/usr/bin/silk-tips" && ok "silk-tips syntax" || bad "silk-tips syntax"
bash "$ROOT/system_files/usr/bin/silk-tour" --help >/dev/null && ok "silk-tour help" || bad "silk-tour help"
bash "$ROOT/system_files/usr/bin/silk-tips" --list >/dev/null && ok "silk-tips list" || bad "silk-tips list"
# Tipps ohne Display
bash -n "$ROOT/system_files/usr/libexec/silk/ux-helpers" && ok "ux-helpers bash -n" || bad "ux-helpers bash -n"
bash -c 'source "'"$ROOT"'/system_files/usr/libexec/silk/ux-helpers"; silk_notify "t" "b"; true' && ok "ux-helpers source" || bad "ux-helpers source"

echo "== Windows VM Tool =="
[[ -f "$ROOT/windows/Install-SilkVM.ps1" ]] && ok "Install-SilkVM.ps1" || bad "Install-SilkVM.ps1"
[[ -f "$ROOT/windows/Install-SilkVM.cmd" ]] && ok "Install-SilkVM.cmd" || bad "Install-SilkVM.cmd"
[[ -f "$ROOT/windows/Get-SilkVM.ps1" ]] && ok "Get-SilkVM.ps1" || bad "Get-SilkVM.ps1"
grep -q 'Install-SilkVM.ps1' "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM bootstrap" || bad "Get-SilkVM bootstrap"
grep -q "Backend = 'Auto'" "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM default Auto" || bad "Get-SilkVM default Auto"
grep -q "\-Backend', \$Backend" "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM forwards Backend" || bad "Get-SilkVM forwards Backend"
grep -q "\-Mode', \$Mode" "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM forwards Mode" || bad "Get-SilkVM forwards Mode"
grep -q 'VirtualBox' "$ROOT/windows/Install-SilkVM.cmd" && ok "CMD VirtualBox choice" || bad "CMD VirtualBox"
grep -q 'HyperV\|VirtualBox' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 HyperV+VBox" || bad "PS1 backends"
grep -q 'if ($hasVBox) { return '\''VirtualBox'\'' }' "$ROOT/windows/Install-SilkVM.ps1" && ok "Auto prefers VirtualBox" || bad "Auto prefers VirtualBox"
grep -q 'Get-NoHypervisorHelp\|Kein Hypervisor gefunden' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 no-hypervisor help" || bad "PS1 no-hypervisor help"
grep -q '\-Backend HyperV' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 HyperV re-run hint" || bad "PS1 HyperV re-run hint"
grep -q 'virtualbox.org' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VirtualBox download link" || bad "PS1 VirtualBox link"
grep -q 'Enable-WindowsOptionalFeature' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Hyper-V enable hint" || bad "PS1 Hyper-V enable"
grep -q 'Silk-Installer-x86_64.iso' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 ISO download" || bad "PS1 ISO"
grep -q 'silk-media-latest' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 release tag" || bad "PS1 release"
# Auto-install VirtualBox when no hypervisor (unpack-and-go)
grep -q 'SkipVBoxInstall' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 SkipVBoxInstall switch" || bad "PS1 SkipVBoxInstall"
grep -q 'function Find-VBoxManage' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Find-VBoxManage" || bad "PS1 Find-VBoxManage"
grep -q 'function Register-VBoxManagePath' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Register-VBoxManagePath" || bad "PS1 Register-VBoxManagePath"
grep -q 'function Install-VirtualBoxAuto' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Install-VirtualBoxAuto" || bad "PS1 Install-VirtualBoxAuto"
grep -q 'function Get-VirtualBoxWindowsInstallerUrl' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VBox installer URL helper" || bad "PS1 VBox installer URL"
grep -q 'Oracle.VirtualBox' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 winget Oracle.VirtualBox" || bad "PS1 winget Oracle.VirtualBox"
grep -q 'accept-package-agreements' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 winget accept agreements" || bad "PS1 winget agreements"
grep -q 'choco install virtualbox' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 choco virtualbox fallback" || bad "PS1 choco fallback"
grep -q 'download.virtualbox.org/virtualbox/LATEST.TXT' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Oracle LATEST.TXT" || bad "PS1 Oracle LATEST.TXT"
grep -Fq 'VirtualBox-[\d\.]+-\d+-Win\.exe' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Win.exe pattern" || bad "PS1 Win.exe pattern"
grep -q '\-\-silent' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VBox silent install" || bad "PS1 VBox silent"
grep -q 'ProgramFiles.*Oracle\\VirtualBox\\VBoxManage\|Oracle\\VirtualBox\\VBoxManage.exe' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VBoxManage standard path" || bad "PS1 VBoxManage path"
# Native stderr must not terminate under ErrorActionPreference Stop (first-run showvminfo)
grep -q 'function Test-VBoxVmExists' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Test-VBoxVmExists" || bad "PS1 Test-VBoxVmExists"
grep -q 'function Invoke-VBoxManage' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 Invoke-VBoxManage" || bad "PS1 Invoke-VBoxManage"
grep -q 'AllowFail' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VBox AllowFail" || bad "PS1 VBox AllowFail"
grep -q "ErrorActionPreference = 'Continue'" "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 VBox EAP Continue" || bad "PS1 VBox EAP Continue"
if grep -nE 'VBoxManage.*(showvminfo|storageattach).*2>\$null|& \$VBoxManage showvminfo' "$ROOT/windows/Install-SilkVM.ps1" | grep -qvE '^\s*#'; then
  echo "raw VBoxManage + 2>\$null still present (can throw under Stop EAP):"
  grep -nE 'VBoxManage.*(showvminfo|storageattach).*2>\$null|& \$VBoxManage showvminfo' "$ROOT/windows/Install-SilkVM.ps1" || true
  bad "PS1 no raw VBoxManage 2>null"
else
  ok "PS1 no raw VBoxManage 2>null"
fi
grep -q 'Test-VBoxVmExists' "$ROOT/windows/Install-SilkVM.ps1" && \
  grep -q 'New-SilkVBoxInstaller' "$ROOT/windows/Install-SilkVM.ps1" && \
  ok "PS1 Installer uses Test-VBoxVmExists" || bad "PS1 Installer uses Test-VBoxVmExists"
# Cached ISO under WorkDir must be reused (no ForceDownload re-fetch)
grep -q 'skip (vorhanden)' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 download skip if present" || bad "PS1 download skip"
grep -q 'Bereits vorhanden' "$ROOT/windows/Install-SilkVM.ps1" && ok "PS1 ISO assemble skip if present" || bad "PS1 ISO assemble skip"
grep -q 'SkipVBoxInstall' "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM SkipVBoxInstall" || bad "Get-SilkVM SkipVBoxInstall"
grep -q "\-SkipVBoxInstall" "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM forwards SkipVBoxInstall" || bad "Get-SilkVM forwards SkipVBoxInstall"
grep -q 'SkipVBoxInstall\|winget\|automatisch' "$ROOT/windows/README.md" && ok "windows README auto-VBox" || bad "windows README auto-VBox"
grep -q 'winget\|SkipVBoxInstall\|bei Bedarf' "$ROOT/QUICKSTART.md" && ok "QUICKSTART auto-VBox" || bad "QUICKSTART auto-VBox"
# Windows PowerShell 5.1 mis-parses mojibake from UTF-8 ellipsis/arrows; keep .ps1 ASCII-only
ps1_non_ascii=0
for ps1 in "$ROOT/windows/Install-SilkVM.ps1" "$ROOT/windows/Get-SilkVM.ps1"; do
  if grep -P -q '[^\x00-\x7F]' "$ps1"; then
    echo "non-ASCII in $(basename "$ps1"):"
    grep -P -n '[^\x00-\x7F]' "$ps1" | head -20 || true
    ps1_non_ascii=1
  fi
done
if [[ "$ps1_non_ascii" -eq 0 ]]; then
  ok "PS1 files are ASCII-only"
else
  bad "PS1 files contain non-ASCII (breaks WinPS 5.1)"
fi
grep -q 'UTF8Encoding' "$ROOT/windows/Get-SilkVM.ps1" && ok "Get-SilkVM UTF8 BOM write" || bad "Get-SilkVM UTF8 BOM write"
grep -q 'Backend HyperV' "$ROOT/windows/README.md" && ok "windows README Hyper-V" || bad "windows README Hyper-V"
grep -q 'virtualbox.org' "$ROOT/windows/README.md" && ok "windows README VirtualBox" || bad "windows README VirtualBox"
grep -q 'Backend HyperV' "$ROOT/QUICKSTART.md" && ok "QUICKSTART Hyper-V one-liner" || bad "QUICKSTART Hyper-V"
[[ -f "$ROOT/docs/VM-WINDOWS.md" ]] && ok "VM-WINDOWS.md" || bad "VM-WINDOWS.md"
[[ -f "$ROOT/scripts/go-virtualbox.sh" ]] && ok "go-virtualbox.sh" || bad "go-virtualbox.sh"
[[ -f "$ROOT/scripts/test-silk-virtualbox.sh" ]] && ok "test-silk-virtualbox.sh" || bad "test-silk-vbox"
[[ -x "$ROOT/system_files/usr/bin/silk-vm" ]] && ok "silk-vm executable" || bad "silk-vm exec"
bash -n "$ROOT/system_files/usr/bin/silk-vm" && ok "silk-vm syntax" || bad "silk-vm syntax"
bash "$ROOT/system_files/usr/bin/silk-vm" --help >/dev/null && ok "silk-vm help" || bad "silk-vm help"
grep -q 'Install-SilkVM' "$ROOT/QUICKSTART.md" && ok "QUICKSTART Windows VM" || bad "QUICKSTART VM"
[[ -f "$ROOT/scripts/go-bazzite-vm.sh" ]] && ok "go-bazzite-vm.sh" || bad "go-bazzite-vm.sh"
bash -n "$ROOT/scripts/go-bazzite-vm.sh" && ok "go-bazzite-vm syntax" || bad "go-bazzite-vm syntax"
grep -q 'ujust setup-virtualization' "$ROOT/scripts/go-bazzite-vm.sh" && ok "bazzite ujust hint" || bad "bazzite ujust"
grep -q 'rpm-ostree install qemu' "$ROOT/scripts/go-bazzite-vm.sh" && ok "bazzite rpm-ostree qemu" || bad "bazzite rpm-ostree"
grep -q 'cmd_doctor\|doctor' "$ROOT/scripts/go-bazzite-vm.sh" && ok "bazzite doctor" || bad "bazzite doctor"
grep -q 'virt-manager' "$ROOT/scripts/go-bazzite-vm.sh" && ok "bazzite virt-manager path" || bad "bazzite virt-manager"
bash "$ROOT/scripts/go-bazzite-vm.sh" doctor >/dev/null && ok "bazzite doctor runs" || bad "bazzite doctor runs"
[[ -f "$ROOT/docs/VM-BAZZITE.md" ]] && ok "VM-BAZZITE.md" || bad "VM-BAZZITE.md"
grep -q 'go-bazzite-vm' "$ROOT/QUICKSTART.md" && ok "QUICKSTART Bazzite VM" || bad "QUICKSTART Bazzite"


echo "== Markenname Aurora nicht in Nutzer-Text =="
for f in README.md QUICKSTART.md ROADMAP.md LEGAL.md system_files/usr/share/silk/welcome.html docs/silk-produktuebersicht.html; do
  if [[ -f "$ROOT/$f" ]] && grep -qiE '\bAurora\b' "$ROOT/$f"; then
    bad "Aurora in $f"
  elif [[ -f "$ROOT/$f" ]]; then
    ok "no Aurora in $f"
  fi
done
WEBROOT="$(cd "$ROOT/.." && pwd)/Silk-Website"
for f in index.html faq.html quickstart.html connect.html platforms.html; do
  if [[ -f "$WEBROOT/$f" ]] && grep -qiE '\bAurora\b' "$WEBROOT/$f"; then
    bad "Aurora in Silk-Website/$f"
  elif [[ -f "$WEBROOT/$f" ]]; then
    ok "no Aurora in Website/$f"
  fi
done

echo
echo "Ergebnis: $PASS bestanden, $FAIL fehlgeschlagen"
[[ "$FAIL" -eq 0 ]]
