#!/usr/bin/env bash
# Lädt Paper, Geyser, Floodgate und Bedrock vorab in .cache/ (nicht ins Git).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

CACHE="${NACHTBLAU_CACHE:-$SCRIPT_DIR/.cache}"
mkdir -p "$CACHE"

need_cmd curl
need_cmd python3

paper_url="$(latest_paper_url)" || die "Paper-URL fehlt"
bedrock_url="$(latest_bedrock_url)" || die "Bedrock-URL fehlt"

printf '%s\n' "$paper_url" >"$CACHE/paper.url"
printf '%s\n' "$bedrock_url" >"$CACHE/bedrock.url"

download "$paper_url" "$CACHE/paper.jar"
download "$GEYSER_SPIGOT_URL" "$CACHE/Geyser-Spigot.jar"
download "$GEYSER_STANDALONE_URL" "$CACHE/Geyser-Standalone.jar"
download "$FLOODGATE_URL" "$CACHE/floodgate-spigot.jar"
download "$bedrock_url" "$CACHE/bedrock-server.zip"

{
  echo "prefetch_ok=$(date -Is)"
  echo "paper=$paper_url"
  echo "bedrock=$bedrock_url"
  ls -lh "$CACHE"
} | tee "$CACHE/prefetch.ok"

log "Prefetch fertig in $CACHE"
