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
PIDS=()

cleanup() {
  local exit_code=$?

  echo
  echo "[dev-lan] stopping services..."

  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  wait || true
  exit "$exit_code"
}

trap cleanup INT TERM EXIT

run_with_prefix() {
  local prefix="$1"
  shift

  (
    set -o pipefail
    "$@" 2>&1 | sed "s/^/[${prefix}] /"
  ) &

  PIDS+=("$!")
}

require_command() {
  local name="$1"

  if ! command -v "$name" >/dev/null 2>&1; then
    echo "[dev-lan] missing required command: $name"
    exit 1
  fi
}

require_command npm
require_command livekit-server
require_command caddy

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[dev-lan] missing env file: $ENV_FILE"
  echo "[dev-lan] create it from .env.landev.example"
  exit 1
fi

if [[ -z "$LAN_HOST" ]]; then
  echo "[dev-lan] missing LAN_HOST in $ENV_FILE"
  exit 1
fi

require_env_var() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "[dev-lan] missing required env var: $name"
    exit 1
  fi
}

require_env_var VITE_Y_WEBSOCKET_URL
require_env_var VITE_API_BASE_URL
require_env_var VITE_LIVEKIT_URL
require_env_var VITE_LIVEKIT_TOKEN_URL
require_env_var LIVEKIT_API_KEY
require_env_var LIVEKIT_API_SECRET

echo "[dev-lan] starting LAN HTTPS development stack"
echo "[dev-lan] services: vite, presence-server, livekit-server, caddy"
echo "[dev-lan] app url: https://${LAN_HOST}:3443"
echo "[dev-lan] env file: $ENV_FILE"
echo "[dev-lan] using wss://${LAN_HOST}:3444 and wss://${LAN_HOST}:3445"

run_with_prefix "vite" npm run dev -- --host 0.0.0.0
run_with_prefix "presence" npm run presence-server
run_with_prefix "livekit" npm run livekit-server
run_with_prefix "caddy" npm run lan-proxy

while true; do
  for pid in "${PIDS[@]:-}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      if wait "$pid"; then
        echo "[dev-lan] service exited unexpectedly"
        exit 1
      fi

      exit "$?"
    fi
  done

  sleep 1
done
