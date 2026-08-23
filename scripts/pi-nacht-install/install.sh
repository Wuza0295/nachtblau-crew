#!/usr/bin/env bash
# NachtBlau Nacht-Install für Raspberry Pi 4 (unattended).
# Java :25565, Bedrock-Protokoll :19132 (Geyser+Floodgate), Geyser :19134.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

if [[ "${1:-}" == "--dry-run" ]]; then
  export DRY_RUN=1
fi

STAMP_DIR="${STAMP_DIR:-/var/lib/nachtblau}"
JAVA_DIR="${JAVA_DIR:-/opt/minecraft-java}"
BEDROCK_DIR="${BEDROCK_DIR:-/opt/minecraft-bedrock}"
GEYSER_DIR="${GEYSER_DIR:-/opt/minecraft-geyser}"
ENV_FILE="${ENV_FILE:-/etc/nachtblau/minecraft.env}"
LOG_FILE="${LOG_FILE:-/var/log/nachtblau-pi-install.log}"

mkdir -p "$STAMP_DIR" "$(dirname "$LOG_FILE")"
if [[ -z "${DRY_RUN:-}" && -f "$STAMP_DIR/install.ok" ]]; then
  log "Install bereits abgeschlossen ($(cat "$STAMP_DIR/install.ok")). Abbruch."
  exit 0
fi

date -Is >"$STAMP_DIR/install.running"
trap 'if [[ ! -f "$STAMP_DIR/install.ok" ]]; then date -Is >"$STAMP_DIR/install.failed"; fi' EXIT

need_cmd curl
need_cmd python3

if [[ "$(id -u)" -ne 0 && -z "${DRY_RUN:-}" ]]; then
  die "install.sh muss als root auf dem Pi laufen"
fi

install_packages() {
  log "Pakete installieren …"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends \
    ca-certificates curl python3 unzip zip \
    openjdk-21-jre-headless \
    net-tools iproute2
}

ensure_user() {
  if ! id mc >/dev/null 2>&1; then
    useradd --system --home "$JAVA_DIR" --shell /usr/sbin/nologin mc
  fi
}

write_env() {
  mkdir -p "$(dirname "$ENV_FILE")"
  cat >"$ENV_FILE" <<'EOF'
JAVA_XMS=2G
JAVA_XMX=3G
GEYSER_XMX=512M
EOF
}

stage_java() {
  log "Paper Java nach $JAVA_DIR"
  mkdir -p "$JAVA_DIR/plugins"
  local url
  url="$(latest_paper_url)" || die "Paper-Download-URL nicht gefunden"
  download "$url" "$JAVA_DIR/paper.jar"
  download "$GEYSER_SPIGOT_URL" "$JAVA_DIR/plugins/Geyser-Spigot.jar"
  download "$FLOODGATE_URL" "$JAVA_DIR/plugins/floodgate-spigot.jar"
  install -m 0644 "$SCRIPT_DIR/conf/server.properties" "$JAVA_DIR/server.properties"
  mkdir -p "$JAVA_DIR/plugins/Geyser-Spigot"
  install -m 0644 "$SCRIPT_DIR/conf/geyser-spigot.yml" "$JAVA_DIR/plugins/Geyser-Spigot/config.yml"
  printf 'eula=true\n' >"$JAVA_DIR/eula.txt"
}

stage_geyser() {
  log "Geyser Standalone nach $GEYSER_DIR (:19134)"
  mkdir -p "$GEYSER_DIR"
  download "$GEYSER_STANDALONE_URL" "$GEYSER_DIR/geyser.jar"
  install -m 0644 "$SCRIPT_DIR/conf/geyser-standalone.yml" "$GEYSER_DIR/config.yml"
}

write_bedrock_wrapper() {
  cat >"$BEDROCK_DIR/start-bedrock.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
arch="$(uname -m)"
if [[ -x ./bedrock_server && ( "$arch" == "x86_64" || "$arch" == "amd64" ) ]]; then
  exec ./bedrock_server
fi
if [[ -x ./bedrock_server ]] && command -v box64 >/dev/null 2>&1; then
  exec box64 ./bedrock_server
fi
# Auf dem Pi 4 (ARM64) gibt es keinen offiziellen Bedrock-Dedicated-Binary.
# Bedrock-Spieler kommen über Geyser+Floodgate auf :19132 in die Java-Welt.
echo "[nachtblau] Offizieller Bedrock-Dedicated läuft auf dieser CPU nicht nativ."
echo "[nachtblau] Bedrock-Protokoll: Geyser-Spigot :19132 → Java :25565"
echo "[nachtblau] Zusätzlich: Geyser Standalone :19134"
# Aktiv bleiben, damit systemctl den Dienst als laufend sieht, ohne Port 19132 zu blocken.
exec sleep infinity
EOF
  chmod +x "$BEDROCK_DIR/start-bedrock.sh"
}

stage_bedrock() {
  log "Bedrock Dedicated nach $BEDROCK_DIR (offiziell x86_64, auf ARM Fallback)"
  mkdir -p "$BEDROCK_DIR"
  local url zip
  url="$(latest_bedrock_url)" || die "Bedrock-Download-URL nicht gefunden"
  zip="$BEDROCK_DIR/bedrock-server.zip"
  download "$url" "$zip"
  unzip -o -q "$zip" -d "$BEDROCK_DIR"
  rm -f "$zip"
  install -m 0644 "$SCRIPT_DIR/conf/bedrock-server.properties" "$BEDROCK_DIR/server.properties"
  write_bedrock_wrapper
}

install_units() {
  log "systemd-Units installieren"
  install -m 0644 "$SCRIPT_DIR/systemd/minecraft-java.service" /etc/systemd/system/minecraft-java.service
  install -m 0644 "$SCRIPT_DIR/systemd/minecraft-bedrock.service" /etc/systemd/system/minecraft-bedrock.service
  install -m 0644 "$SCRIPT_DIR/systemd/minecraft-geyser.service" /etc/systemd/system/minecraft-geyser.service
  systemctl daemon-reload
  systemctl enable minecraft-java.service minecraft-bedrock.service minecraft-geyser.service
}

fix_perms() {
  chown -R mc:mc "$JAVA_DIR" "$BEDROCK_DIR" "$GEYSER_DIR"
}

wait_for_file() {
  local file="$1" timeout="${2:-900}" elapsed=0
  while [[ "$elapsed" -lt "$timeout" ]]; do
    if [[ -f "$file" ]]; then
      return 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  return 1
}

start_stack() {
  log "Dienste starten"
  systemctl restart minecraft-java.service
  log "Warte auf Floodgate-Key (erster Paper-Start auf dem Pi kann 10–20 Minuten dauern) …"
  if wait_for_file "$JAVA_DIR/plugins/floodgate/key.pem" 1200; then
    install -o mc -g mc -m 0600 "$JAVA_DIR/plugins/floodgate/key.pem" "$GEYSER_DIR/key.pem"
  else
    log "WARNUNG: key.pem noch nicht da – Geyser :19134 nach dem nächsten Java-Start neu laden"
  fi
  systemctl restart minecraft-geyser.service
  systemctl restart minecraft-bedrock.service
}

write_ok() {
  date -Is >"$STAMP_DIR/install.ok"
  rm -f "$STAMP_DIR/install.running" "$STAMP_DIR/install.failed"
  log "Nacht-Install fertig."
}

if [[ -n "${DRY_RUN:-}" ]]; then
  log "Dry-Run: prüfe nur Download-URLs"
  latest_paper_url >/tmp/nachtblau-paper.url
  latest_bedrock_url >/tmp/nachtblau-bedrock.url
  log "Paper: $(cat /tmp/nachtblau-paper.url)"
  log "Bedrock: $(cat /tmp/nachtblau-bedrock.url)"
  log "Geyser Spigot: $GEYSER_SPIGOT_URL"
  log "Geyser Standalone: $GEYSER_STANDALONE_URL"
  log "Floodgate: $FLOODGATE_URL"
  exit 0
fi

install_packages
ensure_user
write_env
stage_java
stage_geyser
stage_bedrock
install_units
fix_perms
start_stack
write_ok
