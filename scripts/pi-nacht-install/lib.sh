# Gemeinsame Hilfen für das NachtBlau-Pi-Nacht-Install.
# shellcheck shell=bash

UA="${NACHTBLAU_UA:-nachtblau-crew/pi-nacht-install (https://github.com/Wuza0295/nachtblau-crew; hello@nacht-blau.de)}"
FILL_API="https://fill.papermc.io/v3"
GEYSER_SPIGOT_URL="https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot"
GEYSER_STANDALONE_URL="https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/standalone"
FLOODGATE_URL="https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot"
BEDROCK_LINKS_API="https://net-secondary.web.minecraft-services.net/api/v1.0/download/links"

log() { printf '[nachtblau] %s\n' "$*"; }
die() { printf '[nachtblau] FEHLER: %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Befehl fehlt: $1"
}

download() {
  local url="$1" dest="$2"
  log "Lade $(basename "$dest") …"
  curl -fL --retry 5 --retry-delay 3 -A "$UA" -o "$dest" "$url"
}

json_get() {
  python3 -c "$1"
}

latest_paper_url() {
  local preferred="${PAPER_VERSION:-1.21.11}"
  local payload builds url
  payload="$(curl -fsS -H "User-Agent: $UA" "$FILL_API/projects/paper/versions/${preferred}/builds")" || true
  url="$(PAPER_JSON="$payload" python3 - <<'PY'
import json, os, sys
raw = os.environ.get("PAPER_JSON") or ""
if not raw.strip():
    sys.exit(0)
try:
    builds = json.loads(raw)
except json.JSONDecodeError:
    sys.exit(0)
if not isinstance(builds, list):
    sys.exit(0)
stable = [b for b in builds if b.get("channel") == "STABLE"]
chosen = stable[0] if stable else (builds[0] if builds else None)
if not chosen:
    sys.exit(0)
url = ((chosen.get("downloads") or {}).get("server:default") or {}).get("url")
if url:
    print(url)
PY
)"
  if [[ -n "${url:-}" && "$url" != "null" ]]; then
    printf '%s\n' "$url"
    return 0
  fi

  local versions version
  versions="$(curl -fsS -H "User-Agent: $UA" "$FILL_API/projects/paper" | python3 -c '
import json,sys
data=json.load(sys.stdin)
vers=[]
for group in (data.get("versions") or {}).values():
    vers.extend(group)
print("\n".join(vers))
')"
  while read -r version; do
    [[ "$version" == 1.21.* && "$version" != *-* ]] || continue
    builds="$(curl -fsS -H "User-Agent: $UA" "$FILL_API/projects/paper/versions/${version}/builds")"
    url="$(PAPER_JSON="$builds" python3 - <<'PY'
import json, os, sys
builds=json.loads(os.environ["PAPER_JSON"])
stable=[b for b in builds if b.get("channel")=="STABLE"]
chosen=stable[0] if stable else None
if not chosen:
    sys.exit(0)
url=((chosen.get("downloads") or {}).get("server:default") or {}).get("url")
if url:
    print(url)
PY
)"
    if [[ -n "${url:-}" ]]; then
      printf '%s\n' "$url"
      return 0
    fi
  done <<<"$versions"
  return 1
}

latest_bedrock_url() {
  curl -fsS -A "$UA" "$BEDROCK_LINKS_API" | python3 -c '
import json,sys
data=json.load(sys.stdin)
for link in (data.get("result") or {}).get("links") or []:
    if link.get("downloadType")=="serverBedrockLinux":
        print(link["downloadUrl"])
        break
else:
    sys.exit(1)
'
}
