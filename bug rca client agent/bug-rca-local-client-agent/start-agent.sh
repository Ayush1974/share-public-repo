#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

if [[ "${1:-}" != "--elevated" ]] && [[ "$(id -u)" -ne 0 ]]; then
  exec sudo -E bash "$0" --elevated
fi

export PORT="${PORT:-3210}"
export HOST="${HOST:-127.0.0.1}"
export RCA_SERVER_MODE="${RCA_SERVER_MODE:-agent}"
export CODEX_FULL_ACCESS="${CODEX_FULL_ACCESS:-true}"
export REQUIRE_ELEVATED_EXECUTION="${REQUIRE_ELEVATED_EXECUTION:-true}"
node ./scripts/run-bug-rca-ui.js --foreground --port "${PORT}" --host "${HOST}" --server-mode "${RCA_SERVER_MODE}" --codex-full-access "${CODEX_FULL_ACCESS}" --require-elevated-execution "${REQUIRE_ELEVATED_EXECUTION}"
