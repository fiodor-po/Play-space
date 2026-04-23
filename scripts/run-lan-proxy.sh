#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${PLAY_SPACE_ENV_FILE:-.env.landev}"
export PLAY_SPACE_ENV_FILE="$ENV_FILE"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

LAN_HOST="${LAN_HOST:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[lan-proxy] missing env file: $ENV_FILE"
  echo "[lan-proxy] create it from .env.landev.example"
  exit 1
fi

if [[ -z "$LAN_HOST" ]]; then
  echo "[lan-proxy] missing LAN_HOST in $ENV_FILE"
  exit 1
fi

echo "[lan-proxy] starting Caddy for https://${LAN_HOST}:3443"

export XDG_DATA_HOME="${XDG_DATA_HOME:-$ROOT_DIR/.runtime-data/caddy/data}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$ROOT_DIR/.runtime-data/caddy/config}"
mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

exec caddy run --config ./Caddyfile.lan
