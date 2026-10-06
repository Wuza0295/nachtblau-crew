#!/usr/bin/env bash
# NachtBlau: Status von Java, Bedrock und Geyser auf Bazzite/Desktop-Linux.
# Spiegelt scripts/pi/nacht-status.sh für den Desktop-Sync.
set -euo pipefail

JAVA_DIR="${JAVA_DIR:-/opt/minecraft-java}"
BEDROCK_DIR="${BEDROCK_DIR:-/opt/minecraft-bedrock}"

ok() { printf '  [ok] %s\n' "$*"; }
bad() { printf '  [!!] %s\n' "$*"; }
info() { printf '  [--] %s\n' "$*"; }

echo "NachtBlau Minecraft – Status (Bazzite/Desktop)"
echo

if command -v systemctl >/dev/null 2>&1; then
  for svc in minecraft-java minecraft-bedrock; do
    if systemctl list-unit-files "${svc}.service" >/dev/null 2>&1; then
      state="$(systemctl is-active "${svc}.service" 2>/dev/null || true)"
      enabled="$(systemctl is-enabled "${svc}.service" 2>/dev/null || true)"
      if [[ "${state}" == "active" ]]; then
        ok "${svc}: ${state} (${enabled})"
      else
        bad "${svc}: ${state} (${enabled})"
      fi
    else
      bad "${svc}: Unit nicht installiert"
    fi
  done
else
  info "systemd nicht verfügbar (z. B. Container/WSL ohne systemd)."
fi

echo
if [[ -d "${JAVA_DIR}" ]]; then
  ok "Java-Verzeichnis: ${JAVA_DIR}"
  [[ -f "${JAVA_DIR}/paper.jar" ]] && ok "paper.jar vorhanden" || bad "paper.jar fehlt"
  [[ -f "${JAVA_DIR}/plugins/Geyser-Spigot.jar" ]] && ok "Geyser-Plugin vorhanden" || bad "Geyser-Plugin fehlt"
  [[ -f "${JAVA_DIR}/plugins/floodgate-spigot.jar" || -f "${JAVA_DIR}/plugins/Floodgate-Spigot.jar" ]] \
    && ok "Floodgate-Plugin vorhanden" || bad "Floodgate-Plugin fehlt"
else
  bad "Java-Verzeichnis fehlt: ${JAVA_DIR}"
fi

if [[ -d "${BEDROCK_DIR}" ]]; then
  ok "Bedrock-Verzeichnis: ${BEDROCK_DIR}"
  [[ -x "${BEDROCK_DIR}/bedrock_server" || -f "${BEDROCK_DIR}/bedrock_server" ]] \
    && ok "bedrock_server vorhanden" || bad "bedrock_server fehlt"
else
  bad "Bedrock-Verzeichnis fehlt: ${BEDROCK_DIR}"
fi

echo
info "Erwartete Ports: Java 25565/TCP, Bedrock 19132/UDP, Geyser 19134/UDP"
if command -v ss >/dev/null 2>&1; then
  ss -lntu 2>/dev/null | awk '
    /:25565|:19132|:19134/ { print "  " $0 }
  ' || true
fi
