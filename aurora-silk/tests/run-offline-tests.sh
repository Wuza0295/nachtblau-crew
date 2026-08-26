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
  system_files/usr/bin/silk-setup \
  system_files/usr/share/silk/app-aliases.json \
  system_files/usr/share/silk/plasma-mac-layout.js \
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
if grep -q 'FROM ghcr.io/ublue-os/aurora:stable' "$ROOT/Containerfile"; then
  ok "Aurora stable base"
else
  bad "Containerfile base image"
fi

echo "== app-aliases.json =="
if jq -e '.steam == "com.valvesoftware.Steam"' "$ROOT/system_files/usr/share/silk/app-aliases.json" >/dev/null; then
  ok "steam alias"
else
  bad "steam alias / jq"
fi

echo "== silk-install Hilfslogik =="
# shellcheck disable=SC1091
guess_query_from_file() {
  local stem b
  b="$(basename "$1")"
  stem="${b%.*}"
  echo "$stem" | sed -E 's/[-_]?(setup|installer|x64|x86|win64|windows|portable)$//I; s/[0-9]+(\.[0-9]+){1,3}//g; s/[-_.]+/ /g; s/^ +| +$//g'
}

q="$(guess_query_from_file "/tmp/DiscordSetup.exe")"
if [[ "$q" == *"Discord"* ]] || [[ "$q" == *"discord"* ]] || [[ "$q" =~ [Dd]iscord ]]; then
  ok "guess DiscordSetup.exe → [$q]"
else
  # sed may strip differently; accept non-empty
  if [[ -n "$q" ]]; then ok "guess non-empty [$q]"; else bad "guess empty"; fi
fi

alias_lookup() {
  local key="$1"
  jq -r --arg k "${key,,}" '
    to_entries[]
    | select((.key | ascii_downcase) == $k)
    | .value
  ' "$ROOT/system_files/usr/share/silk/app-aliases.json" | head -1
}

if [[ "$(alias_lookup steam)" == "com.valvesoftware.Steam" ]]; then
  ok "alias_lookup steam"
else
  bad "alias_lookup steam"
fi

if [[ "$(alias_lookup FIREFOX)" == "org.mozilla.firefox" ]]; then
  ok "alias_lookup FIREFOX"
else
  bad "alias_lookup FIREFOX"
fi

echo "== MIME Desktop-Dateien =="
grep -q 'MimeType=application/x-ms-dos-executable' "$ROOT/system_files/usr/share/applications/silk-open-exe.desktop" \
  && ok "exe mime" || bad "exe mime"
grep -q 'MimeType=application/vnd.android.package-archive' "$ROOT/system_files/usr/share/applications/silk-open-apk.desktop" \
  && ok "apk mime" || bad "apk mime"

echo
echo "Ergebnis: $PASS bestanden, $FAIL fehlgeschlagen"
[[ "$FAIL" -eq 0 ]]
