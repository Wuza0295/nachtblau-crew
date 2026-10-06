#!/usr/bin/env bash
# NachtBlau Minecraft-Sync für Bazzite (und artverwandte Fedora-Atomic/x86_64-Desktops).
# Gleicher Stand wie der Pi-Install: Java (Paper) :25565/TCP, Bedrock Dedicated :19132/UDP,
# Geyser+Floodgate als Paper-Plugin :19134/UDP. Idempotent. Erfordert Root (sudo).
#
# Aufruf auf dem Bazzite-Rechner:
#   sudo ./scripts/desktop/nacht-install-bazzite.sh --yes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_SYSTEMD_DIR="$(cd "${SCRIPT_DIR}/../pi/systemd" && pwd)"
USER_AGENT="NachtBlau-Desktop-Sync/1.0 (https://github.com/Wuza0295/nachtblau-crew; hello@nacht-blau.de)"
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

log() { printf '[bazzite-sync] %s\n' "$*"; }
die() { printf '[bazzite-sync] FEHLER: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
NachtBlau Minecraft-Sync (Bazzite / Fedora-Atomic / x86_64-Linux)

  --yes            EULA akzeptieren, nicht nachfragen
  --force          Auch ohne erkanntes Bazzite/Fedora fortfahren
  --no-start       Dienste nach dem Sync nicht starten
  --skip-bedrock   Dedicated Bedrock weglassen (nur Java + Geyser)
  -h, --help       Diese Hilfe

Ports (identisch zu Pi und Windows):
  Java 25565/TCP, Bedrock 19132/UDP, Geyser 19134/UDP
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

arch="$(uname -m)"
if [[ "${arch}" != "x86_64" && "${arch}" != "amd64" && "${FORCE}" -ne 1 ]]; then
  die "x86_64 erforderlich (jetzt: ${arch}). Bei Bedarf: --force"
fi

is_bazzite=0
if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  case "${ID:-}${VARIANT_ID:-}${NAME:-}" in
    *[Bb]azzite*|*ublue*|*aurora*|*bluefin*) is_bazzite=1 ;;
  esac
  [[ "${ID:-}" == "fedora" ]] && is_bazzite=1
fi
if [[ "${is_bazzite}" -ne 1 && "${FORCE}" -ne 1 ]]; then
  log "WARNUNG: Kein Bazzite/Fedora erkannt – fahre nur mit --force fort."
  die "Kein Bazzite/Fedora erkannt. Dieses Skript ist für Bazzite gedacht. Bei Bedarf: --force"
fi

if [[ "${ASSUME_YES}" -ne 1 ]]; then
  cat <<'EOF'
Mit dem Sync akzeptierst du die Minecraft-EULA:
  https://aka.ms/MinecraftEULA
Es werden Paper (Java), Geyser/Floodgate und (optional) Bedrock Dedicated
im gleichen Stand wie auf dem Pi eingerichtet.
EOF
  read -r -p "Fortfahren? [j/N] " answer
  [[ "${answer}" == [jJyY] ]] || die "Abgebrochen."
fi

have_cmd() { command -v "$1" >/dev/null 2>&1; }

install_base_packages() {
  log "Basispakete prüfen …"
  local pkgs=(ca-certificates curl wget jq unzip tar python3)
  if have_cmd rpm-ostree; then
    log "rpm-ostree erkannt (Bazzite/Atomic): Java wird per Overlay installiert."
    if ! have_cmd java || ! java -version 2>&1 | grep -Eq 'version "(2[1-9]|[3-9][0-9])'; then
      log "Lege Java-Overlay an (erfordert danach ggf. einen Reboot) …"
      rpm-ostree install --idempotent java-21-openjdk-headless "${pkgs[@]}" 2>/dev/null \
        || rpm-ostree install java-21-openjdk-headless
      if ! have_cmd java; then
        die "Java-Overlay angelegt, aber java ist erst nach einem Reboot verfügbar. Bitte rebooten und das Skript erneut starten."
      fi
    fi
    return 0
  fi
  if have_cmd dnf; then
    dnf install -y "${pkgs[@]}" java-21-openjdk-headless
    return 0
  fi
  if have_cmd apt-get; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y --no-install-recommends "${pkgs[@]}" openjdk-21-jre-headless
    return 0
  fi
  die "Weder rpm-ostree noch dnf noch apt-get gefunden."
}

install_base_packages
have_cmd java || die "Java konnte nicht bereitgestellt werden."
log "Java: $(java -version 2>&1 | head -n1)"

if ! id -u "${MC_USER}" >/dev/null 2>&1; then
  useradd --system --home-dir "${JAVA_DIR}" --shell /usr/sbin/nologin "${MC_USER}" \
    || useradd --system --home "${JAVA_DIR}" --shell /usr/sbin/nologin "${MC_USER}"
  log "Systemuser ${MC_USER} angelegt."
fi

install -d -m 0755 -o "${MC_USER}" -g "${MC_USER}" "${JAVA_DIR}" "${JAVA_DIR}/plugins"
install -d -m 0755 /etc/nachtblau

mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
if [[ "${mem_kb}" -ge 12000000 ]]; then
  heap="6G"
elif [[ "${mem_kb}" -ge 7000000 ]]; then
  heap="4G"
elif [[ "${mem_kb}" -ge 3500000 ]]; then
  heap="2500M"
else
  heap="1800M"
fi

cat >"${ENV_FILE}" <<EOF
# NachtBlau Minecraft – erzeugt von nacht-install-bazzite.sh
JAVA_XMS=1G
JAVA_XMX=${heap}
JAVA_OPTS=-Xms1G -Xmx${heap} -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RsetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true
EOF
chmod 0644 "${ENV_FILE}"
log "Java-Heap: ${heap} (aus /proc/meminfo)"

download() {
  local url="$1" dest="$2" agent="${3:-${USER_AGENT}}"
  log "Download: ${url}"
  curl -fL --http1.1 --retry 5 --retry-all-errors --retry-delay 3 -A "${agent}" -o "${dest}.partial" "${url}"
  mv -f "${dest}.partial" "${dest}"
}

BROWSER_UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

install_paper() {
  log "Paper (Fill v3) auflösen …"
  local project_json version builds_json url sha dest
  project_json="$(curl -fsSL -H "User-Agent: ${USER_AGENT}" https://fill.papermc.io/v3/projects/paper)"
  version="$(printf '%s' "${project_json}" | python3 -c '
import json,sys
data=json.load(sys.stdin)
vers=(data.get("versions") or {})
for group in ("26.2","1.21"):
    if vers.get(group):
        print(vers[group][0]); break
')"
  [[ -n "${version}" ]] || die "Keine Paper-Version von fill.papermc.io."
  builds_json="$(curl -fsSL -H "User-Agent: ${USER_AGENT}" \
    "https://fill.papermc.io/v3/projects/paper/versions/${version}/builds")"
  url="$(printf '%s' "${builds_json}" | python3 -c '
import json,sys
builds=json.load(sys.stdin)
stable=[b for b in builds if b.get("channel")=="STABLE"]
c=(stable or builds)[0]
print((((c.get("downloads") or {}).get("server:default")) or {}).get("url") or "")
')"
  sha="$(printf '%s' "${builds_json}" | python3 -c '
import json,sys
builds=json.load(sys.stdin)
stable=[b for b in builds if b.get("channel")=="STABLE"]
c=(stable or builds)[0]
print((((c.get("downloads") or {}).get("server:default")) or {}).get("checksums") or {}).get("sha256") or "")
')"
  [[ -n "${url}" ]] || die "Keine Paper-Download-URL für ${version}."
  dest="${JAVA_DIR}/paper.jar"
  if [[ -f "${dest}" && -n "${sha}" && "${sha}" != "" ]]; then
    if [[ "$(sha256sum "${dest}" | awk '{print $1}')" == "${sha}" ]]; then
      log "paper.jar ist bereits aktuell (${version})."
    else
      download "${url}" "${dest}"
      [[ "$(sha256sum "${dest}" | awk '{print $1}')" == "${sha}" ]] || die "SHA256 von paper.jar stimmt nicht."
      log "Paper ${version} nach ${dest}"
    fi
  else
    download "${url}" "${dest}"
    if [[ -n "${sha}" && "${sha}" != "" ]]; then
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

install_bedrock() {
  install -d -m 0755 -o "${MC_USER}" -g "${MC_USER}" "${BEDROCK_DIR}"
  log "Bedrock Dedicated Server (nativ auf x86_64, kein Box64 nötig) …"
  local links url zip
  links="$(curl -fsSL --http1.1 -A "${BROWSER_UA}" https://net-secondary.web.minecraft-services.net/api/v1.0/download/links)"
  url="$(printf '%s' "${links}" | python3 -c '
import json,sys
data=json.load(sys.stdin)
for link in (data.get("result") or {}).get("links") or []:
    if link.get("downloadType")=="serverBedrockLinux":
        print(link["downloadUrl"]); break
')"
  [[ -n "${url}" ]] || die "Keine Bedrock-Linux-URL von Minecraft Services."
  zip="/tmp/bedrock-server.zip"
  download "${url}" "${zip}" "${BROWSER_UA}"
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
exec ./bedrock_server
EOF
  chmod 0755 "${BEDROCK_DIR}/start-bedrock.sh"
}

install_units() {
  [[ -f "${PI_SYSTEMD_DIR}/minecraft-java.service" ]] \
    || die "systemd-Unit fehlt: ${PI_SYSTEMD_DIR}/minecraft-java.service"
  install -m 0644 "${PI_SYSTEMD_DIR}/minecraft-java.service" /etc/systemd/system/minecraft-java.service
  if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
    install -m 0644 "${PI_SYSTEMD_DIR}/minecraft-bedrock.service" /etc/systemd/system/minecraft-bedrock.service
  fi
  systemctl daemon-reload
}

install_paper
install_geyser_plugins
write_java_config
chown -R "${MC_USER}:${MC_USER}" "${JAVA_DIR}"

if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  install_bedrock
  chown -R "${MC_USER}:${MC_USER}" "${BEDROCK_DIR}"
fi

install_units
systemctl enable minecraft-java.service
if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  systemctl enable minecraft-bedrock.service
fi

if have_cmd firewall-cmd; then
  firewall-cmd --permanent --add-port=${JAVA_PORT}/tcp >/dev/null || true
  firewall-cmd --permanent --add-port=${BEDROCK_PORT}/udp >/dev/null || true
  firewall-cmd --permanent --add-port=${GEYSER_PORT}/udp >/dev/null || true
  firewall-cmd --reload >/dev/null || true
  log "Firewall-Ports freigegeben (firewalld)."
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

log "Fertig (Bazzite-Sync)."
log "  Java:    ${JAVA_DIR}  Port ${JAVA_PORT}/TCP"
if [[ "${SKIP_BEDROCK}" -eq 0 ]]; then
  log "  Bedrock: ${BEDROCK_DIR}  Port ${BEDROCK_PORT}/UDP (nativ, ohne Box64)"
fi
log "  Geyser:  Plugin in Paper, Port ${GEYSER_PORT}/UDP"
log "Status:   ${SCRIPT_DIR}/nacht-status-desktop.sh"
