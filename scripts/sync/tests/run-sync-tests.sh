#!/usr/bin/env bash
# Offline-Tests fuer das Bazzite/Windows-Sync-Tooling.
#
# Prueft Syntax beider Skripte und faehrt einen vollstaendigen Sync gegen ein
# lokales Test-Remote - einmal ueber den Linux-Pfad (bash) und einmal ueber den
# Windows-Pfad (pwsh). Beide muessen denselben Fingerabdruck liefern.
set -uo pipefail

SYNC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASH_SCRIPT="$SYNC_DIR/nachtblau-sync.sh"
PS_SCRIPT="$SYNC_DIR/nachtblau-sync.ps1"
MANIFEST="$SYNC_DIR/sync-manifest.json"

PASS=0
FAIL=0
SKIP=0

ok() {
  printf '  [ ok ] %s\n' "$1"
  PASS=$((PASS + 1))
}
no() {
  printf '  [FAIL] %s\n' "$1"
  [[ -n "${2:-}" ]] && printf '         %s\n' "$2"
  FAIL=$((FAIL + 1))
}
skip() {
  printf '  [skip] %s\n' "$1"
  SKIP=$((SKIP + 1))
}
section() { printf '\n== %s ==\n' "$1"; }

have() { command -v "$1" >/dev/null 2>&1; }

check() {
  local label="$1"
  shift
  local out
  if out="$("$@" 2>&1)"; then
    ok "$label"
  else
    no "$label" "$(printf '%s' "$out" | tail -5)"
  fi
}

# --- Statische Pruefungen --------------------------------------------------

section "Statische Pruefungen"

check "bash -n nachtblau-sync.sh" bash -n "$BASH_SCRIPT"
check "bash -n run-sync-tests.sh" bash -n "${BASH_SOURCE[0]}"

if have shellcheck; then
  check "shellcheck nachtblau-sync.sh" shellcheck -S warning "$BASH_SCRIPT"
  check "shellcheck run-sync-tests.sh" shellcheck -S warning "${BASH_SOURCE[0]}"
else
  skip "shellcheck nicht installiert"
fi

check "Manifest ist gueltiges JSON" python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$MANIFEST"

if [[ -x "$BASH_SCRIPT" ]]; then
  ok "nachtblau-sync.sh ist ausfuehrbar"
else
  no "nachtblau-sync.sh ist ausfuehrbar" "chmod +x fehlt"
fi

if have pwsh; then
  check "PowerShell-Syntax nachtblau-sync.ps1" pwsh -NoProfile -Command \
    "\$e=\$null; \$t=\$null; [System.Management.Automation.Language.Parser]::ParseFile('$PS_SCRIPT',[ref]\$t,[ref]\$e) | Out-Null; if (\$e.Count) { \$e | ForEach-Object { \$_.Message }; exit 1 }"
else
  skip "pwsh nicht installiert – PowerShell-Pfad wird nicht geprueft"
fi

# --- Hilfe-Ausgabe ---------------------------------------------------------

section "Hilfe"

if "$BASH_SCRIPT" help | grep -q 'NachtBlau-Sync'; then
  ok "bash: help"
else
  no "bash: help"
fi

if have pwsh; then
  if pwsh -NoProfile -File "$PS_SCRIPT" help | grep -q 'NachtBlau-Sync'; then
    ok "pwsh: help"
  else
    no "pwsh: help"
  fi
fi

# --- Funktionaler Durchlauf ------------------------------------------------

section "Sync gegen Test-Remote"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

REMOTE="$TMP/remote.git"
SEED="$TMP/seed"
SHARE="$TMP/share"
LINUX_ROOT="$TMP/linux/nachtblau-crew"
WINDOWS_ROOT="$TMP/windows/nachtblau-crew"
WINDOWS_STATE="$SHARE/state-windows-testhost.json"

# Beide Laeufe passieren hier auf derselben Maschine, deshalb bekommt jede Seite
# ihren eigenen Share-Ordner; der Vergleichsordner wird daraus bestueckt.
SHARE_LINUX="$TMP/share-linux"
SHARE_WINDOWS="$TMP/share-windows"
mkdir -p "$SHARE"

# Der Windows-Pfad laeuft im Test unter pwsh auf Linux und meldet deshalb die
# Plattform "linux". Fuer den Vergleich wird die Datei auf Windows umgeschrieben.
as_windows_state() {
  python3 - "$1" "$2" <<'PY'
import json, sys
state = json.load(open(sys.argv[1]))
state['host']['platform'] = 'windows'
state['host']['name'] = 'testhost'
with open(sys.argv[2], 'w') as fh:
    json.dump(state, fh, indent=2)
PY
}

fingerprint_of() {
  python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['fingerprint']['combined'])" "$1"
}

git init -q --bare "$REMOTE"
git init -q "$SEED"
git -C "$SEED" config user.email "sync-test@nachtblau.local"
git -C "$SEED" config user.name "Sync Test"
git -C "$SEED" config core.autocrlf false
mkdir -p "$SEED/scripts/sync"
cp "$BASH_SCRIPT" "$PS_SCRIPT" "$MANIFEST" "$SEED/scripts/sync/"
printf 'nachtblau\n' >"$SEED/README.md"
printf '* text=auto eol=lf\n' >"$SEED/.gitattributes"
git -C "$SEED" add -A >/dev/null
git -C "$SEED" commit -qm "Test-Stand"
git -C "$SEED" branch -M main
git -C "$SEED" push -q "$REMOTE" main

# Das Manifest zeigt auf GitHub; fuer den Test wird das lokale Remote injiziert.
TEST_MANIFEST="$TMP/manifest"
mkdir -p "$TEST_MANIFEST"
cp "$BASH_SCRIPT" "$PS_SCRIPT" "$TEST_MANIFEST/"
python3 - "$MANIFEST" "$REMOTE" "$TEST_MANIFEST/sync-manifest.json" <<'PY'
import json, sys
manifest = json.load(open(sys.argv[1]))
manifest['repo']['url'] = sys.argv[2]
with open(sys.argv[3], 'w') as fh:
    json.dump(manifest, fh, indent=2)
    fh.write('\n')
PY

export NACHTBLAU_SYNC_SHARE="$SHARE_LINUX"

if "$TEST_MANIFEST/nachtblau-sync.sh" sync --root "$LINUX_ROOT" --no-install >"$TMP/linux.log" 2>&1; then
  ok "bash: sync klont und meldet Stand"
else
  no "bash: sync klont und meldet Stand" "$(tail -5 "$TMP/linux.log")"
fi

if [[ -d "$LINUX_ROOT/.git" ]]; then
  ok "bash: Arbeitskopie angelegt"
else
  no "bash: Arbeitskopie angelegt"
fi

if [[ "$(git -C "$LINUX_ROOT" config core.autocrlf)" == "false" ]] &&
  [[ "$(git -C "$LINUX_ROOT" config core.eol)" == "lf" ]]; then
  ok "bash: Git-Konfiguration aus Manifest gesetzt"
else
  no "bash: Git-Konfiguration aus Manifest gesetzt"
fi

LINUX_STATE="$(find "$SHARE_LINUX" -maxdepth 1 -name 'state-*.json' -type f | head -1)"
if [[ -n "$LINUX_STATE" ]]; then
  cp "$LINUX_STATE" "$SHARE/$(basename "$LINUX_STATE")"
  ok "bash: Zustandsdatei geschrieben"
else
  no "bash: Zustandsdatei geschrieben" "$(tail -5 "$TMP/linux.log")"
fi

if have pwsh; then
  if NACHTBLAU_SYNC_SHARE="$SHARE_WINDOWS" \
    pwsh -NoProfile -File "$TEST_MANIFEST/nachtblau-sync.ps1" sync -Root "$WINDOWS_ROOT" -NoInstall \
    >"$TMP/windows.log" 2>&1; then
    ok "pwsh: sync klont und meldet Stand"
  else
    no "pwsh: sync klont und meldet Stand" "$(tail -5 "$TMP/windows.log")"
  fi

  if [[ "$(git -C "$WINDOWS_ROOT" config core.longpaths)" == "true" ]]; then
    ok "pwsh: Git-Konfiguration aus Manifest gesetzt"
  else
    no "pwsh: Git-Konfiguration aus Manifest gesetzt"
  fi

  WIN_STATE_SRC="$(find "$SHARE_WINDOWS" -maxdepth 1 -name 'state-*.json' -type f | head -1)"
  if [[ -n "$WIN_STATE_SRC" ]]; then
    as_windows_state "$WIN_STATE_SRC" "$WINDOWS_STATE"
    ok "pwsh: Zustandsdatei geschrieben"
  else
    no "pwsh: Zustandsdatei geschrieben" "$(tail -5 "$TMP/windows.log")"
  fi

  LINUX_FP="$(fingerprint_of "$LINUX_STATE")"
  WIN_FP="$(fingerprint_of "$WINDOWS_STATE")"
  if [[ -n "$LINUX_FP" && "$LINUX_FP" == "$WIN_FP" ]]; then
    ok "Fingerabdruck identisch (bash == pwsh): ${LINUX_FP:0:16}…"
  else
    no "Fingerabdruck identisch (bash == pwsh)" "bash=$LINUX_FP pwsh=$WIN_FP"
  fi

  section "Vergleich"

  if "$TEST_MANIFEST/nachtblau-sync.sh" compare --share "$SHARE" >"$TMP/compare.log" 2>&1 &&
    grep -q 'demselben Stand' "$TMP/compare.log"; then
    ok "bash: compare meldet gleichen Stand"
  else
    no "bash: compare meldet gleichen Stand" "$(tail -10 "$TMP/compare.log")"
  fi

  if pwsh -NoProfile -File "$TEST_MANIFEST/nachtblau-sync.ps1" compare -Share "$SHARE" \
    >"$TMP/compare-ps.log" 2>&1 && grep -q 'demselben Stand' "$TMP/compare-ps.log"; then
    ok "pwsh: compare meldet gleichen Stand"
  else
    no "pwsh: compare meldet gleichen Stand" "$(tail -10 "$TMP/compare-ps.log")"
  fi

  # Abweichung erzeugen: ein zusaetzlicher Commit nur auf der Windows-Seite.
  git -C "$WINDOWS_ROOT" config user.email "sync-test@nachtblau.local"
  git -C "$WINDOWS_ROOT" config user.name "Sync Test"
  printf 'abweichung\n' >"$WINDOWS_ROOT/NEU.md"
  git -C "$WINDOWS_ROOT" add -A >/dev/null
  git -C "$WINDOWS_ROOT" commit -qm "Nur auf der Windows-Seite"
  pwsh -NoProfile -File "$TEST_MANIFEST/nachtblau-sync.ps1" status -Root "$WINDOWS_ROOT" -AsJson \
    >"$TMP/drift.json" 2>/dev/null
  as_windows_state "$TMP/drift.json" "$WINDOWS_STATE"

  if ! "$TEST_MANIFEST/nachtblau-sync.sh" compare --share "$SHARE" >"$TMP/drift.log" 2>&1 &&
    grep -q 'weicht ab' "$TMP/drift.log"; then
    ok "bash: compare erkennt Abweichung"
  else
    no "bash: compare erkennt Abweichung" "$(tail -10 "$TMP/drift.log")"
  fi

  if ! pwsh -NoProfile -File "$TEST_MANIFEST/nachtblau-sync.ps1" compare -Share "$SHARE" \
    >"$TMP/drift-ps.log" 2>&1 && grep -q 'weicht ab' "$TMP/drift-ps.log"; then
    ok "pwsh: compare erkennt Abweichung"
  else
    no "pwsh: compare erkennt Abweichung" "$(tail -10 "$TMP/drift-ps.log")"
  fi
else
  skip "pwsh nicht installiert – Windows-Pfad und Vergleich uebersprungen"
fi

# --- Bazzite-Erkennung -----------------------------------------------------

section "Bazzite-Erkennung"

BAZZITE_OS_RELEASE="$TMP/os-release-bazzite"
cat >"$BAZZITE_OS_RELEASE" <<'EOF'
NAME="Bazzite"
ID=bazzite
VARIANT_ID=bazzite
PRETTY_NAME="Bazzite 42 (FROM Fedora Silverblue)"
EOF

DETECTED="$(OS_RELEASE="$BAZZITE_OS_RELEASE" bash -c "source '$BASH_SCRIPT'; detect_platform")"
if [[ "$DETECTED" == "bazzite" ]]; then
  ok "detect_platform erkennt Bazzite"
else
  no "detect_platform erkennt Bazzite" "erkannt: $DETECTED"
fi

DESCRIBED="$(OS_RELEASE="$BAZZITE_OS_RELEASE" bash -c "source '$BASH_SCRIPT'; os_description")"
if [[ "$DESCRIBED" == "Bazzite 42 (FROM Fedora Silverblue)" ]]; then
  ok "os_description liest PRETTY_NAME"
else
  no "os_description liest PRETTY_NAME" "gelesen: $DESCRIBED"
fi

# Auf einem bootc-System darf nie zu dnf oder rpm-ostree geraten werden - das
# wuerde den unveraenderlichen Host anfassen und einen Neustart erzwingen.
HINT="$(bash -c "source '$BASH_SCRIPT'; toolchain_hint bazzite node")"
if [[ "$HINT" == *"brew install node"* && "$HINT" != *"dnf"* ]] ||
  [[ "$HINT" == *"brew install node"* && "$HINT" == *"nicht per dnf"* ]]; then
  ok "Toolchain-Hinweis verweist auf brew statt dnf"
else
  no "Toolchain-Hinweis verweist auf brew statt dnf" "$HINT"
fi

# --- JSON ohne jq ----------------------------------------------------------

# Bazzite bringt jq nicht zwingend mit; dann muss der python3-Pfad dieselben
# Werte liefern - inklusive des Booleschen false.
section "JSON-Zugriff ohne jq"

JQ_PROBE="$TMP/jq-probe.sh"
cat >"$JQ_PROBE" <<EOF
#!/usr/bin/env bash
set -euo pipefail
source "$BASH_SCRIPT"
have() { [[ "\$1" != "jq" ]] && command -v "\$1" >/dev/null 2>&1; }
printf '%s|%s|%s\n' \\
  "\$(json_field "$LINUX_STATE" '.repo.branch')" \\
  "\$(json_field "$LINUX_STATE" '.repo.dirty')" \\
  "\$(json_field "$LINUX_STATE" '.fingerprint.combined')"
EOF
chmod +x "$JQ_PROBE"

if have jq; then
  WITH_JQ="$(bash -c "source '$BASH_SCRIPT'; printf '%s|%s|%s\n' \
    \"\$(json_field '$LINUX_STATE' '.repo.branch')\" \
    \"\$(json_field '$LINUX_STATE' '.repo.dirty')\" \
    \"\$(json_field '$LINUX_STATE' '.fingerprint.combined')\"")"
  WITHOUT_JQ="$("$JQ_PROBE")"
  if [[ "$WITH_JQ" == "$WITHOUT_JQ" && "$WITH_JQ" == *"|false|"* ]]; then
    ok "json_field liefert mit und ohne jq dasselbe ($WITH_JQ)"
  else
    no "json_field liefert mit und ohne jq dasselbe" "jq=$WITH_JQ python=$WITHOUT_JQ"
  fi
else
  skip "jq nicht installiert – Vergleich der beiden JSON-Pfade entfaellt"
fi

# --- Probelauf -------------------------------------------------------------

section "Probelauf"

if "$TEST_MANIFEST/nachtblau-sync.sh" sync --root "$TMP/dry/nachtblau-crew" --dry-run \
  >"$TMP/dry.log" 2>&1 && [[ ! -d "$TMP/dry" ]]; then
  ok "bash: --dry-run veraendert nichts"
else
  no "bash: --dry-run veraendert nichts" "$(tail -5 "$TMP/dry.log")"
fi

if have pwsh; then
  if pwsh -NoProfile -File "$TEST_MANIFEST/nachtblau-sync.ps1" sync -Root "$TMP/dryps/nachtblau-crew" -DryRun \
    >"$TMP/dry-ps.log" 2>&1 && [[ ! -d "$TMP/dryps" ]]; then
    ok "pwsh: -DryRun veraendert nichts"
  else
    no "pwsh: -DryRun veraendert nichts" "$(tail -5 "$TMP/dry-ps.log")"
  fi
fi

# --- Ergebnis --------------------------------------------------------------

printf '\n== Ergebnis ==\n  %d bestanden, %d fehlgeschlagen, %d uebersprungen\n' "$PASS" "$FAIL" "$SKIP"
[[ "$FAIL" -eq 0 ]]
