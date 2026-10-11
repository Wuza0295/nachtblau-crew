#!/usr/bin/env bash
# NachtBlau-Sync fuer Bazzite (Fedora Atomic / bootc) und andere Linux-Systeme.
#
# Holt den aktuellen Projektstand, gleicht die Git-Konfiguration an, installiert
# die Abhaengigkeiten und schreibt einen Fingerabdruck in den Share-Ordner.
# Das Windows-Gegenstueck ist scripts/sync/nachtblau-sync.ps1 – beide erzeugen
# denselben Fingerabdruck, damit "gleicher Stand" ueberpruefbar ist.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/sync-manifest.json"
STATE_SCHEMA=1

COMMAND="sync"
BRANCH=""
ROOT=""
SHARE=""
DRY_RUN=0
DO_INSTALL=1
DO_VERIFY=0
JSON_ONLY=0
COMPARE_ARGS=()

# --- Ausgabe ---------------------------------------------------------------

info() { [[ "$JSON_ONLY" -eq 1 ]] || printf '\n==> %s\n' "$*"; }
step() { [[ "$JSON_ONLY" -eq 1 ]] || printf '    %s\n' "$*"; }
warn() { printf '    ! %s\n' "$*" >&2; }
die() {
  printf 'Fehler: %s\n' "$*" >&2
  exit 1
}

have() { command -v "$1" >/dev/null 2>&1; }

usage() {
  cat <<'EOF'
NachtBlau-Sync (Bazzite / Linux)

  nachtblau-sync.sh [Befehl] [Optionen]

Befehle:
  sync              Repo aktualisieren, Abhaengigkeiten installieren, Stand melden (Standard)
  status            Nur den aktuellen Stand ermitteln und anzeigen
  compare [A B]     Zwei Zustandsdateien vergleichen (ohne Angabe: Bazzite vs. Windows im Share)
  help              Diese Hilfe

Optionen:
  --branch <name>   Zweig, der synchronisiert wird (Standard: main aus dem Manifest)
  --root <pfad>     Arbeitskopie (Standard: aktuelles Repo bzw. ~/NachtBlau/nachtblau-crew)
  --share <pfad>    Gemeinsamer Ordner fuer die Zustandsdateien
                    (Standard: $NACHTBLAU_SYNC_SHARE oder <root>/.nachtblau-sync)
  --no-install      Abhaengigkeiten nicht installieren
  --verify          Nach dem Sync "pnpm check" und "pnpm test" ausfuehren
  --dry-run         Nichts veraendern, nur zeigen, was passieren wuerde
  --json            Nur die Zustandsdatei auf stdout ausgeben

Beispiele:
  ./scripts/sync/nachtblau-sync.sh
  ./scripts/sync/nachtblau-sync.sh sync --branch main --verify
  ./scripts/sync/nachtblau-sync.sh compare
EOF
}

# --- Argumente -------------------------------------------------------------

parse_args() {
  if [[ $# -gt 0 && "$1" != -* ]]; then
    COMMAND="$1"
    shift
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --branch)
        BRANCH="${2:-}"
        shift 2
        ;;
      --root)
        ROOT="${2:-}"
        shift 2
        ;;
      --share)
        SHARE="${2:-}"
        shift 2
        ;;
      --no-install)
        DO_INSTALL=0
        shift
        ;;
      --verify)
        DO_VERIFY=1
        shift
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      --json)
        JSON_ONLY=1
        shift
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        if [[ "$COMMAND" == "compare" ]]; then
          COMPARE_ARGS+=("$1")
          shift
        else
          usage >&2
          die "Unbekannte Option: $1"
        fi
        ;;
    esac
  done
}

# --- Manifest --------------------------------------------------------------

manifest_get() {
  local path="$1"
  if have jq; then
    jq -r "$path // empty" "$MANIFEST"
  elif have python3; then
    python3 - "$MANIFEST" "$path" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
for key in sys.argv[2].lstrip('.').split('.'):
    if key:
        data = data.get(key, '') if isinstance(data, dict) else ''
print(data if isinstance(data, str) else '')
PY
  else
    die "Weder jq noch python3 gefunden – Manifest kann nicht gelesen werden."
  fi
}

manifest_git_config_keys() {
  if have jq; then
    jq -r '.gitConfig | keys[]' "$MANIFEST"
  else
    python3 - "$MANIFEST" <<'PY'
import json, sys
for key in sorted(json.load(open(sys.argv[1]))['gitConfig']):
    print(key)
PY
  fi
}

# --- Plattform -------------------------------------------------------------

OS_RELEASE="${OS_RELEASE:-/etc/os-release}"

detect_platform() {
  local id="" variant=""
  if [[ -r "$OS_RELEASE" ]]; then
    # shellcheck disable=SC1090
    id="$(. "$OS_RELEASE" && printf '%s' "${ID:-}")"
    # shellcheck disable=SC1090
    variant="$(. "$OS_RELEASE" && printf '%s' "${VARIANT_ID:-}")"
  fi
  if [[ "$id" == "bazzite" || "$variant" == *bazzite* ]]; then
    printf 'bazzite'
  elif have bootc || have rpm-ostree; then
    printf 'bootc'
  else
    printf 'linux'
  fi
}

os_description() {
  if [[ -r "$OS_RELEASE" ]]; then
    # shellcheck disable=SC1090
    (. "$OS_RELEASE" && printf '%s' "${PRETTY_NAME:-${NAME:-Linux}}")
  else
    printf 'Linux'
  fi
}

# Auf Bazzite ist das Host-System unveraenderlich: keine Pakete per dnf oder
# rpm-ostree, sondern brew/distrobox. Fehlt die Toolchain, wird nur gewarnt.
toolchain_hint() {
  local platform="$1" tool="$2"
  case "$platform" in
    bazzite | bootc)
      printf '%s fehlt. Auf Bazzite nicht per dnf/rpm-ostree installieren, sondern: brew install %s (oder distrobox enter).' "$tool" "$tool"
      ;;
    *)
      printf '%s fehlt. Bitte ueber den Paketmanager der Distribution installieren.' "$tool"
      ;;
  esac
}

tool_version() {
  local tool="$1"
  if have "$tool"; then
    "$tool" --version 2>/dev/null | head -1 | tr -d '\r'
  else
    printf ''
  fi
}

# --- Pfade -----------------------------------------------------------------

resolve_root() {
  if [[ -n "$ROOT" ]]; then
    printf '%s' "$ROOT"
    return
  fi
  if [[ -n "${NACHTBLAU_ROOT:-}" ]]; then
    printf '%s' "$NACHTBLAU_ROOT"
    return
  fi
  # Innerhalb einer vorhandenen Arbeitskopie genau diese verwenden.
  local inner
  if inner="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"; then
    printf '%s' "$inner"
    return
  fi
  printf '%s/%s/nachtblau-crew' "$HOME" "$(manifest_get '.workspace.linux')"
}

resolve_share() {
  local root="$1"
  if [[ -n "$SHARE" ]]; then
    printf '%s' "$SHARE"
  elif [[ -n "${NACHTBLAU_SYNC_SHARE:-}" ]]; then
    printf '%s' "$NACHTBLAU_SYNC_SHARE"
  else
    printf '%s/.nachtblau-sync' "$root"
  fi
}

# --- Fingerabdruck ---------------------------------------------------------

sha256_stdin() { sha256sum | cut -d' ' -f1; }

json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

# Der Fingerabdruck muss unter Linux und Windows identisch sein. Deshalb wird
# ausschliesslich Git-eigene, normalisierte Ausgabe gehasht (core.autocrlf=false
# erzwingt auf beiden Seiten byte-gleiche Arbeitskopien) und die Statuszeilen
# werden binaer sortiert, nicht nach Gebietsschema.
compute_state() {
  local root="$1" platform="$2"
  local branch commit tree status_lines status_hash diff_file diff_hash dirty combined manifest_hash

  branch="$(git -C "$root" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'unbekannt')"
  commit="$(git -C "$root" rev-parse HEAD 2>/dev/null || printf '')"
  tree="$(git -C "$root" rev-parse 'HEAD^{tree}' 2>/dev/null || printf '')"

  status_lines="$(git -C "$root" -c core.autocrlf=false status --porcelain=v1 2>/dev/null | LC_ALL=C sort || true)"
  if [[ -n "$status_lines" ]]; then
    status_hash="$(printf '%s\n' "$status_lines" | sha256_stdin)"
    dirty="true"
  else
    status_hash="$(printf '' | sha256_stdin)"
    dirty="false"
  fi

  # --output laesst git die Bytes selbst schreiben; damit entfaellt jede
  # Shell-Umkodierung und PowerShell kann denselben Hash bilden.
  diff_file="$(mktemp)"
  git -C "$root" -c core.autocrlf=false diff HEAD --binary --output="$diff_file" 2>/dev/null || true
  diff_hash="$(sha256_stdin <"$diff_file")"
  rm -f "$diff_file"

  combined="$(printf '%s\n%s\n%s\n' "$tree" "$status_hash" "$diff_hash" | sha256_stdin)"
  manifest_hash="$(sha256_stdin <"$MANIFEST")"
  root="$(json_escape "$root")"

  cat <<EOF
{
  "schema": $STATE_SCHEMA,
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "host": {
    "platform": "$platform",
    "name": "$(hostname)",
    "os": "$(os_description)"
  },
  "repo": {
    "root": "$root",
    "branch": "$branch",
    "commit": "$commit",
    "dirty": $dirty
  },
  "fingerprint": {
    "tree": "$tree",
    "status": "$status_hash",
    "diff": "$diff_hash",
    "manifest": "$manifest_hash",
    "combined": "$combined"
  },
  "toolchain": {
    "git": "$(tool_version git)",
    "node": "$(tool_version node)",
    "pnpm": "$(tool_version pnpm)"
  }
}
EOF
}

state_file_path() {
  local share="$1" platform="$2"
  printf '%s/state-%s-%s.json' "$share" "$platform" "$(hostname)"
}

json_field() {
  local file="$1" path="$2"
  if have jq; then
    # Kein "// \"\"": das wuerde den Booleschen Wert false verschlucken.
    jq -r "$path | if . == null then \"\" else . end" "$file"
  else
    python3 - "$file" "$path" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
for key in sys.argv[2].lstrip('.').split('.'):
    if key:
        data = data.get(key, '') if isinstance(data, dict) else ''
print('' if data is None else (data if isinstance(data, str) else json.dumps(data)))
PY
  fi
}

# --- Schritte --------------------------------------------------------------

ensure_checkout() {
  local root="$1" branch="$2" url="$3"

  if [[ -d "$root/.git" ]]; then
    step "Arbeitskopie: $root"
  else
    if [[ "$DRY_RUN" -eq 1 ]]; then
      step "wuerde klonen: $url -> $root"
      return
    fi
    step "Klone $url -> $root"
    mkdir -p "$(dirname "$root")"
    git clone "$url" "$root"
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    step "wuerde holen: origin/$branch"
    return
  fi

  git -C "$root" fetch origin "$branch" --prune
  if [[ -n "$(git -C "$root" status --porcelain=v1)" ]]; then
    warn "Arbeitskopie hat lokale Aenderungen – kein automatischer Wechsel auf $branch."
  else
    git -C "$root" checkout "$branch" 2>/dev/null || git -C "$root" checkout -b "$branch" "origin/$branch"
    git -C "$root" merge --ff-only "origin/$branch" 2>/dev/null ||
      warn "Kein Fast-Forward auf origin/$branch moeglich – bitte manuell mergen."
  fi
}

apply_git_config() {
  local root="$1" key value
  while read -r key; do
    [[ -n "$key" ]] || continue
    value="$(manifest_get ".gitConfig[\"$key\"]")"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      step "wuerde setzen: $key=$value"
    else
      git -C "$root" config "$key" "$value"
      step "$key=$value"
    fi
  done < <(manifest_git_config_keys)
}

check_toolchain() {
  local platform="$1" tool
  for tool in git node pnpm; do
    if have "$tool"; then
      step "$tool $(tool_version "$tool")"
    elif [[ "$tool" == "pnpm" ]] && have corepack; then
      step "pnpm fehlt – wird ueber corepack bereitgestellt."
    else
      warn "$(toolchain_hint "$platform" "$tool")"
    fi
  done
}

install_deps() {
  local root="$1"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    step "wuerde ausfuehren: pnpm install --frozen-lockfile"
    return
  fi
  have corepack && corepack enable >/dev/null 2>&1 || true
  if ! have pnpm; then
    warn "pnpm nicht verfuegbar – Installation uebersprungen."
    return
  fi
  (cd "$root" && pnpm install --frozen-lockfile)
}

run_verify() {
  local root="$1" cmd
  if [[ "$DRY_RUN" -eq 1 ]]; then
    step "wuerde pruefen: pnpm check && pnpm test"
    return
  fi
  for cmd in check test; do
    step "pnpm $cmd"
    (cd "$root" && pnpm "$cmd")
  done
}

write_state() {
  local share="$1" platform="$2" state="$3" target
  target="$(state_file_path "$share" "$platform")"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    step "wuerde schreiben: $target"
    return
  fi
  mkdir -p "$share"
  printf '%s\n' "$state" >"$target"
  step "Zustand gespeichert: $target"
}

print_state_summary() {
  local state="$1" tmp
  tmp="$(mktemp)"
  printf '%s\n' "$state" >"$tmp"
  printf '    Plattform : %s (%s)\n' "$(json_field "$tmp" '.host.platform')" "$(json_field "$tmp" '.host.os')"
  printf '    Zweig     : %s\n' "$(json_field "$tmp" '.repo.branch')"
  printf '    Commit    : %s\n' "$(json_field "$tmp" '.repo.commit')"
  printf '    Geaendert : %s\n' "$(json_field "$tmp" '.repo.dirty')"
  printf '    Fingerprint: %s\n' "$(json_field "$tmp" '.fingerprint.combined')"
  rm -f "$tmp"
}

# --- compare ---------------------------------------------------------------

newest_state_for() {
  local share="$1" platform="$2"
  find "$share" -maxdepth 1 -name "state-${platform}-*.json" -type f -printf '%T@ %p\n' 2>/dev/null |
    sort -rn | head -1 | cut -d' ' -f2-
}

compare_states() {
  local share="$1" a="$2" b="$3"

  if [[ -z "$a" || -z "$b" ]]; then
    a="$(newest_state_for "$share" bazzite)"
    [[ -n "$a" ]] || a="$(newest_state_for "$share" linux)"
    [[ -n "$a" ]] || a="$(newest_state_for "$share" bootc)"
    b="$(newest_state_for "$share" windows)"
  fi

  [[ -n "$a" && -f "$a" ]] || die "Zustandsdatei der Linux-/Bazzite-Seite fehlt in $share."
  [[ -n "$b" && -f "$b" ]] || die "Zustandsdatei der Windows-Seite fehlt in $share."

  info "Vergleich"
  printf '    A: %s (%s @ %s)\n' "$(json_field "$a" '.host.platform')" "$(json_field "$a" '.host.name')" "$(json_field "$a" '.generatedAt')"
  printf '    B: %s (%s @ %s)\n' "$(json_field "$b" '.host.platform')" "$(json_field "$b" '.host.name')" "$(json_field "$b" '.generatedAt')"

  local differences=0 field label
  for field in 'repo.branch:Zweig' 'repo.commit:Commit' 'fingerprint.tree:Baum' 'fingerprint.combined:Fingerprint' 'fingerprint.manifest:Manifest'; do
    label="${field#*:}"
    field="${field%%:*}"
    local va vb
    va="$(json_field "$a" ".$field")"
    vb="$(json_field "$b" ".$field")"
    if [[ "$va" == "$vb" ]]; then
      printf '    = %-11s %s\n' "$label" "$va"
    else
      printf '    x %-11s A=%s B=%s\n' "$label" "$va" "$vb"
      differences=$((differences + 1))
    fi
  done

  local da db
  da="$(json_field "$a" '.repo.dirty')"
  db="$(json_field "$b" '.repo.dirty')"
  [[ "$da" == "true" ]] && printf '    ! %s hat ungespeicherte Aenderungen\n' "$(json_field "$a" '.host.platform')"
  [[ "$db" == "true" ]] && printf '    ! %s hat ungespeicherte Aenderungen\n' "$(json_field "$b" '.host.platform')"

  if [[ "$differences" -eq 0 && "$da" == "false" && "$db" == "false" ]]; then
    info "Bazzite und Windows sind auf demselben Stand."
    return 0
  fi
  info "Stand weicht ab – betroffene Seite erneut synchronisieren."
  return 1
}

# --- main ------------------------------------------------------------------

main() {
  parse_args "$@"

  [[ -f "$MANIFEST" ]] || die "Manifest nicht gefunden: $MANIFEST"
  have git || die "git fehlt – ohne git ist kein Sync moeglich."

  local platform root share url state
  platform="$(detect_platform)"
  root="$(resolve_root)"
  share="$(resolve_share "$root")"
  url="$(manifest_get '.repo.url')"
  [[ -n "$BRANCH" ]] || BRANCH="$(manifest_get '.repo.defaultBranch')"

  case "$COMMAND" in
    help)
      usage
      ;;
    compare)
      compare_states "$share" "${COMPARE_ARGS[0]:-}" "${COMPARE_ARGS[1]:-}"
      ;;
    status)
      [[ -d "$root/.git" ]] || die "Keine Arbeitskopie unter $root – zuerst 'sync' ausfuehren."
      state="$(compute_state "$root" "$platform")"
      if [[ "$JSON_ONLY" -eq 1 ]]; then
        printf '%s\n' "$state"
      else
        info "Stand ($platform)"
        print_state_summary "$state"
      fi
      ;;
    sync)
      info "NachtBlau-Sync – $platform ($(os_description))"
      step "Zweig: $BRANCH"
      step "Share: $share"
      [[ "$DRY_RUN" -eq 1 ]] && step "Probelauf – es wird nichts veraendert."

      info "Arbeitskopie"
      ensure_checkout "$root" "$BRANCH" "$url"

      if [[ -d "$root/.git" ]]; then
        info "Git-Konfiguration angleichen"
        apply_git_config "$root"
      fi

      info "Toolchain"
      check_toolchain "$platform"

      if [[ "$DO_INSTALL" -eq 1 && -d "$root/.git" ]]; then
        info "Abhaengigkeiten"
        install_deps "$root"
      fi

      if [[ "$DO_VERIFY" -eq 1 && -d "$root/.git" ]]; then
        info "Verifikation"
        run_verify "$root"
      fi

      if [[ -d "$root/.git" ]]; then
        state="$(compute_state "$root" "$platform")"
        info "Stand"
        print_state_summary "$state"
        write_state "$share" "$platform" "$state"
        info "Naechster Schritt: auf der anderen Seite synchronisieren, danach 'compare'."
      fi
      ;;
    *)
      usage >&2
      die "Unbekannter Befehl: $COMMAND"
      ;;
  esac
}

# Beim Sourcen (Tests) nur die Funktionen bereitstellen.
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
