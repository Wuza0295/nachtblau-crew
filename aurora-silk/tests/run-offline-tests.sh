#!/usr/bin/env bash
# Offline-Tests für Aurora Silk Helfer (ohne Container-Build)
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
  system_files/usr/share/silk/app-aliases.json \
  system_files/usr/share/silk/plasma-mac-layout.js \
  system_files/usr/share/silk/plasma-windows11-layout.js \
  system_files/usr/share/silk/plasma-windows10-layout.js \
  system_files/usr/share/applications/silk-open-mac.desktop \
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

echo "== Containerfile Basis =="
if grep -qE '^FROM ghcr.io/ublue-os/aurora:stable$' "$ROOT/Containerfile"; then
  ok "Aurora stable base (floating tag)"
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
if grep -qF 'Favorit: Aurora Silk' "$ROOT/README.md" || grep -qF 'Favorit: Aurora Silk / Silk' "$ROOT/README.md"; then
  ok "README naming recommendation"
else
  bad "README naming recommendation"
fi

echo "== CI Pull-Strategie =="
if grep -q -- '--pull=always' "$ROOT/Justfile"; then
  ok "Justfile --pull=always"
else
  bad "Justfile missing --pull=always"
fi
WF_ROOT="$(cd "$ROOT/.." && pwd)/.github/workflows/aurora-silk-build.yml"
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
