#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${PLAY_SPACE_ENV_FILE:-.env.localdev}"
export PLAY_SPACE_ENV_FILE="$ENV_FILE"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PIDS=()

cleanup() {
  local exit_code=$?

  echo
  echo "[dev-local] stopping services..."

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
    "$@" 2>&1 | sed "s/^/[${prefix}] /"
  ) &

  PIDS+=("$!")
}

require_command() {
  local name="$1"

  if ! command -v "$name" >/dev/null 2>&1; then
    echo "[dev-local] missing required command: $name"
    exit 1
  fi
}

require_command npm
require_command livekit-server

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[dev-local] missing env file: $ENV_FILE"
  echo "[dev-local] create it from .env.localdev.example"
  exit 1
fi

echo "[dev-local] starting localhost development stack"
echo "[dev-local] services: vite, presence-server, livekit-server"
echo "[dev-local] app url: http://localhost:5173"
echo "[dev-local] env file: $ENV_FILE"

run_with_prefix "vite" npm run dev
run_with_prefix "presence" npm run presence-server
run_with_prefix "livekit" npm run livekit-server

wait
