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
done < <(find "$ROOT/build_files" "$ROOT/system_files/usr/bin" "$ROOT/system_files/usr/libexec" -type f \( -name '*.sh' -o -name 'silk-*' -o -name 'firstboot' -o -name 'set-icon-theme' \) -print0)

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
  system_files/etc/sysctl.d/99-silk-amd.conf \
  system_files/etc/udev/rules.d/99-silk-amd.rules \
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

echo "== Branding / Image-Name =="
if grep -q '^IMAGE_NAME=silk$' "$ROOT/silk.env"; then
  ok "IMAGE_NAME=silk (kein aurora- Prefix)"
else
  bad "IMAGE_NAME sollte silk sein"
fi
if grep -qi 'Aurora Silk' "$ROOT/README.md" "$ROOT/silk.env" 2>/dev/null; then
  bad "Produktname darf nicht mehr Aurora Silk heißen"
else
  ok "kein Produktname Aurora Silk"
fi

echo "== Containerfile Basis =="
if grep -qE '^FROM ghcr.io/ublue-os/aurora:stable$' "$ROOT/Containerfile"; then
  ok "Upstream-Base aurora:stable (floating tag)"
else
  bad "Containerfile base image"
fi
# Kein Digest-Pin wie aurora@sha256:… – würde Upstream-Tracking einfrieren
if grep -qE 'FROM ghcr.io/ublue-os/aurora@sha256:' "$ROOT/Containerfile"; then
  bad "Containerfile must not pin aurora digest"
else
  ok "no aurora digest pin"
fi
if grep -qiE '^FROM[[:space:]].*bazzite' "$ROOT/Containerfile"; then
  bad "Containerfile must not FROM bazzite (single Aurora base)"
else
  ok "single Aurora base (no bazzite FROM)"
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
if [[ -f "$WF_ROOT" ]] && grep -q 'cron:' "$WF_ROOT" && grep -q 'podman pull ghcr.io/ublue-os/aurora:stable' "$WF_ROOT"; then
  ok "root workflow cron + base pull"
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

echo
echo "Ergebnis: $PASS bestanden, $FAIL fehlgeschlagen"
[[ "$FAIL" -eq 0 ]]
