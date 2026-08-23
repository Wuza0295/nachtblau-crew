#!/usr/bin/env bash
# NachtBlau Minecraft-Install für Raspberry Pi 4 (Java + Bedrock + Geyser).
# Läuft auf dem Pi. Idempotent. Erfordert Root.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_AGENT="NachtBlau-Pi-Install/1.0 (https://github.com/Wuza0295/nachtblau-crew; hello@nacht-blau.de)"
JAVA_DIR="/opt/minecraft-java"
BEDROCK_DIR="/opt/minecraft-bedrock"
ENV_FILE="/etc/nachtblau/minecraft.env"
MC_USER="minecraft"
JAVA_PORT=25565
BEDROCK_PORT=19132
GEYSER_PORT=19134
ASSUME_YES=0
FORCE=0
NO_START=0
SKIP_BEDROCK=0

log() { printf '[nacht-install] %s\n' "$*"; }
die() { printf '[nacht-install] FEHLER: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
NachtBlau Minecraft-Install (Raspberry Pi 4)

  --yes            EULA akzeptieren, nicht nachfragen
  --force          Auch ohne erkanntes Pi-Board fortfahren
  --no-start       Dienste nach der Installation nicht starten
  --skip-bedrock   Dedicated Bedrock (Box64) weglassen
  -h, --help       Diese Hilfe
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) ASSUME_YES=1 ;;
    --force) FORCE=1 ;;
    --no-start) NO_START=1 ;;
    --skip-bedrock) SKIP_BEDROCK=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unbekannte Option: $1" ;;
  esac
  shift
done

[[ "$(id -u)" -eq 0 ]] || die "Bitte als root ausführen (sudo $0)."

is_pi() {
  local model=""
  if [[ -r /proc/device-tree/model ]]; then
    model="$(tr -d '\0' </proc/device-tree/model)"
  fi
  [[ "${model}" == *[Rr]aspberry* ]] && return 0
  grep -qi 'raspberry' /proc/cpuinfo 2>/dev/null
}

arch="$(uname -m)"
if ! is_pi && [[ "${FORCE}" -ne 1 ]]; then
  die "Kein Raspberry Pi erkannt (${arch}). Dieses Skript ist für den Pi gedacht. Bei Bedarf: --force"
fi
if [[ "${arch}" != "aarch64" && "${arch}" != "arm64" && "${FORCE}" -ne 1 ]]; then
  die "64-Bit-OS erforderlich (jetzt: ${arch}). Raspberry Pi OS Lite 64-bit oder Ubuntu Server ARM64 verwenden."
fi

if [[ "${ASSUME_YES}" -ne 1 ]]; then
  cat <<'EOF'
Mit der Installation akzeptierst du die Minecraft-EULA:
  https://aka.ms/MinecraftEULA
Es werden Paper (Java), Geyser/Floodgate und optional Bedrock Dedicated eingerichtet.
EOF
  read -r -p "Fortfahren? [j/N] " answer
  [[ "${answer}" == [jJyY] ]] || die "Abgebrochen."
fi

export DEBIAN_FRONTEND=noninteractive
log "Pakete installieren …"
apt-get update -qq
apt-get install -y --no-install-recommends \
  ca-certificates curl wget jq unzip tar gnupg \
  python3 sudo adduser \
  >/dev/null

install_java() {
  if command -v java >/dev/null 2>&1; then
    local ver
    ver="$(java -version 2>&1 | head -n1 || true)"
    if java -version 2>&1 | grep -Eq 'version "(2[1-9]|[3-9][0-9])'; then
      log "Java ist vorhanden: ${ver}"
      return 0
    fi
    log "Gefundene Java-Version ist zu alt (${ver}), installiere 21+."
  fi

  if apt-cache show openjdk-21-jre-headless >/dev/null 2>&1; then
    apt-get install -y --no-install-recommends openjdk-21-jre-headless
    return 0
  fi

  log "OpenJDK 21 nicht in apt – Temurin 21 von Adoptium …"
  install -d /usr/share/keyrings
  curl -fsSL https://packages.adoptium.net/artifactory/api/gpg/key/public \
    | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
  . /etc/os-release
  printf 'deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb %s main\n' \
    "${VERSION_CODENAME}" >/etc/apt/sources.list.d/adoptium.list
  apt-get update -qq
  apt-get install -y --no-install-recommends temurin-21-jre
}

install_java
command -v java >/dev/null 2>&1 || die "Java konnte nicht installiert werden."

if ! id -u "${MC_USER}" >/dev/null 2>&1; then
  adduser --system --group --home "${JAVA_DIR}" --shell /usr/sbin/nologin "${MC_USER}"
  log "Systemuser ${MC_USER} angelegt."
fi

install -d -m 0755 -o "${MC_USER}" -g "${MC_USER}" "${JAVA_DIR}" "${JAVA_DIR}/plugins"
install -d -m 0755 /etc/nachtblau

mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
if [[ "${mem_kb}" -ge 7000000 ]]; then
  heap="4G"
elif [[ "${mem_kb}" -ge 3500000 ]]; then
  heap="2500M"
else
  heap="1800M"
fi

cat >"${ENV_FILE}" <<EOF
# NachtBlau Minecraft – erzeugt von nacht-install.sh
JAVA_XMS=1G
JAVA_XMX=${heap}
JAVA_OPTS=-Xms1G -Xmx${heap} -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RsetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true
EOF
chmod 0644 "${ENV_FILE}"
log "Java-Heap: ${heap} (aus /proc/meminfo)"

download() {
  local url="$1" dest="$2"
  log "Download: ${url}"
  curl -fL --retry 4 --retry-delay 3 -A "${USER_AGENT}" -o "${dest}.partial" "${url}"
  mv -f "${dest}.partial" "${dest}"
}

install_paper() {
  log "Paper (Fill v3) auflösen …"
  local project_json version builds_json url sha dest
  project_json="$(curl -fsSL -H "User-Agent: ${USER_AGENT}" https://fill.papermc.io/v3/projects/paper)"
  version="$(printf '%s' "${project_json}" | jq -r '.versions["26.2"][0] // .versions["1.21"][0] // empty')"
  [[ -n "${version}" && "${version}" != "null" ]] || die "Keine Paper-Version von fill.papermc.io."
  builds_json="$(curl -fsSL -H "User-Agent: ${USER_AGENT}" \
    "https://fill.papermc.io/v3/projects/paper/versions/${version}/builds")"
  url="$(printf '%s' "${builds_json}" | jq -r '
    (map(select(.channel == "STABLE")) | first | .downloads["server:default"].url)
    // (first | .downloads["server:default"].url) // empty
  ')"
  sha="$(printf '%s' "${builds_json}" | jq -r '
    (map(select(.channel == "STABLE")) | first | .downloads["server:default"].checksums.sha256)
    // (first | .downloads["server:default"].checksums.sha256) // empty
  ')"
  [[ -n "${url}" ]] || die "Keine Paper-Download-URL für ${version}."
  dest="${JAVA_DIR}/paper.jar"
  if [[ -f "${dest}" && -n "${sha}" ]]; then
    if [[ "$(sha256sum "${dest}" | awk '{print $1}')" == "${sha}" ]]; then
      log "paper.jar ist bereits aktuell (${version})."
    else
      download "${url}" "${dest}"
      if [[ -n "${sha}" && "${sha}" != "null" ]]; then
        [[ "$(sha256sum "${dest}" | awk '{print $1}')" == "${sha}" ]] || die "SHA256 von paper.jar stimmt nicht."
      fi
      log "Paper ${version} nach ${dest}"
    fi
  else
    download "${url}" "${dest}"
    if [[ -n "${sha}" && "${sha}" != "null" ]]; then
      [[ "$(sha256sum "${dest}" | awk '{print $1}')" == "${sha}" ]] || die "SHA256 von paper.jar stimmt nicht."
    fi
    log "Paper ${version} nach ${dest}"
  fi

  cat >"${JAVA_DIR}/start-java.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/minecraft-java
# shellcheck disable=SC1091
[[ -f /etc/nachtblau/minecraft.env ]] && . /etc/nachtblau/minecraft.env
# shellcheck disable=SC2086
exec /usr/bin/java ${JAVA_OPTS:--Xms1G -Xmx3G} -jar /opt/minecraft-java/paper.jar nogui
EOF
  chmod 0755 "${JAVA_DIR}/start-java.sh"
}

install_geyser_plugins() {
  download \
    "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot" \
    "${JAVA_DIR}/plugins/Geyser-Spigot.jar"
  download \
    "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot" \
    "${JAVA_DIR}/plugins/Floodgate-Spigot.jar"
}

write_java_config() {
  printf 'eula=true\n' >"${JAVA_DIR}/eula.txt"
  cat >"${JAVA_DIR}/server.properties" <<EOF
motd=NachtBlau
server-port=${JAVA_PORT}
online-mode=true
enforce-secure-profile=true
view-distance=6
simulation-distance=4
max-players=10
difficulty=normal
spawn-protection=16
network-compression-threshold=256
sync-chunk-writes=false
white-list=false
enable-rcon=false
enable-status=true
hide-online-players=false
EOF

  install -d -m 0755 -o "${MC_USER}" -g "${MC_USER}" "${JAVA_DIR}/plugins/Geyser-Spigot"
  cat >"${JAVA_DIR}/plugins/Geyser-Spigot/config.yml" <<EOF
bedrock:
  address: 0.0.0.0
  port: ${GEYSER_PORT}
  clone-remote-port: false
  motd1: NachtBlau
  motd2: Crossplay Java + Bedrock
remote:
  address: 127.0.0.1
  port: ${JAVA_PORT}
  auth-type: floodgate
passthrough-motd: true
passthrough-player-counts: true
max-players: 10
debug-mode: false
EOF
}

install_box64() {
  if command -v box64 >/dev/null 2>&1; then
    log "box64 ist bereits installiert."
    return 0
  fi
  log "box64 für Bedrock-x86_64 auf ARM64 …"
  if apt-cache show box64 >/dev/null 2>&1; then
    apt-get install -y --no-install-recommends box64 && return 0
  fi

  if curl -fsSL https://pi-apps-coders.github.io/box64-debs/KEY.gpg \
      -o /etc/apt/trusted.gpg.d/box64-debs-archive-keyring.gpg; then
    printf 'deb [signed-by=/etc/apt/trusted.gpg.d/box64-debs-archive-keyring.gpg] https://Pi-Apps-Coders.github.io/box64-debs/debian ./\n' \
      >/etc/apt/sources.list.d/box64.list
    apt-get update -qq || true
    if apt-cache show box64 >/dev/null 2>&1; then
      apt-get install -y --no-install-recommends box64 && return 0
    fi
  fi

  log "box64 aus Quellcode bauen (einmalig, dauert) …"
  apt-get install -y --no-install-recommends git build-essential cmake python3
  local src="/tmp/box64-src"
  rm -rf "${src}"
  git clone --depth 1 https://github.com/ptitSeb/box64.git "${src}"
  cmake -S "${src}" -B "${src}/build" -DARM_DYNAREC=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
  cmake --build "${src}/build" -j"$(nproc)"
  cmake --install "${src}/build"
  command -v box64 >/dev/null 2>&1 || die "box64-Installation fehlgeschlagen."
}

install_bedrock() {
  install -d -m 0755 -o "${MC_USER}" -g "${MC_USER}" "${BEDROCK_DIR}"
  log "Bedrock Dedicated Server (offizielle Linux-x86_64-Builds) …"
  local links url zip
  links="$(curl -fsSL -A "${USER_AGENT}" https://net-secondary.web.minecraft-services.net/api/v1.0/download/links)"
  url="$(printf '%s' "${links}" | jq -r '.result.links[] | select(.downloadType=="serverBedrockLinux") | .downloadUrl')"
  [[ -n "${url}" && "${url}" != "null" ]] || die "Keine Bedrock-Linux-URL von Minecraft Services."
  zip="/tmp/bedrock-server.zip"
  download "${url}" "${zip}"
  unzip -o -q "${zip}" -d "${BEDROCK_DIR}"
  rm -f "${zip}"
  [[ -f "${BEDROCK_DIR}/bedrock_server" ]] || die "bedrock_server fehlt nach dem Entpacken."
  chmod +x "${BEDROCK_DIR}/bedrock_server"

  if [[ -f "${BEDROCK_DIR}/server.properties" ]]; then
    sed -i \
      -e "s/^server-name=.*/server-name=NachtBlau/" \
      -e "s/^server-port=.*/server-port=${BEDROCK_PORT}/" \
      -e "s/^max-players=.*/max-players=10/" \
      -e "s/^online-mode=.*/online-mode=true/" \
      "${BEDROCK_DIR}/server.properties"
  else
    cat >"${BEDROCK_DIR}/server.properties" <<EOF
server-name=NachtBlau
server-port=${BEDROCK_PORT}
max-players=10
online-mode=true
gamemode=survival
difficulty=normal
allow-cheats=false
EOF
  fi

  cat >"${BEDROCK_DIR}/start-bedrock.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/minecraft-bedrock
export LD_LIBRARY_PATH="/opt/minecraft-bedrock${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
if [[ "$(uname -m)" == "x86_64" ]]; then
  exec ./bedrock_server
fi
if command -v box64 >/dev/null 2>&1; then
  exec box64 ./bedrock_server
fi
echo "box64 fehlt – Bedrock Dedicated läuft auf ARM64 nur emuliert." >&2
exit 1
EOF
  chmod 0755 "${BEDROCK_DIR}/start-bedrock.sh"
}

install_units() {
  local unit_dir="${SCRIPT_DIR}/systemd"
  if [[ -f "${unit_dir}/minecraft-java.service" ]]; then
    install -m 0644 "${unit_dir}/minecraft-java.service" /etc/systemd/system/minecraft-java.service
  else
    die "systemd-Unit fehlt: ${unit_dir}/minecraft-java.service"
  fi
  if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
    install -m 0644 "${unit_dir}/minecraft-bedrock.service" /etc/systemd/system/minecraft-bedrock.service
  fi
  systemctl daemon-reload
}

install_paper
install_geyser_plugins
write_java_config
chown -R "${MC_USER}:${MC_USER}" "${JAVA_DIR}"

if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  install_box64
  install_bedrock
  chown -R "${MC_USER}:${MC_USER}" "${BEDROCK_DIR}"
fi

install_units
systemctl enable minecraft-java.service
if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  systemctl enable minecraft-bedrock.service
fi

if [[ "${NO_START}" -eq 0 ]]; then
  log "Dienste starten …"
  systemctl restart minecraft-java.service
  if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
    systemctl restart minecraft-bedrock.service
  fi
else
  log "Start übersprungen (--no-start)."
fi

log "Fertig."
log "  Java:    ${JAVA_DIR}  Port ${JAVA_PORT}/TCP"
if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  log "  Bedrock: ${BEDROCK_DIR}  Port ${BEDROCK_PORT}/UDP (Box64 auf ARM64)"
fi
log "  Geyser:  Plugin in Paper, Port ${GEYSER_PORT}/UDP"
log "Status:   ${SCRIPT_DIR}/nacht-status.sh"
