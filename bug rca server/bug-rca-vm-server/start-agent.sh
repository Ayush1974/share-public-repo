#!/usr/bin/env bash
set -euo pipefail

# Optional local-agent compatibility wrapper.
# This is not needed for hosted shared://simphony runs on the VM.
# Use it only when this folder is intentionally run in local agent mode.

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

PORT="${PORT:-3210}" \
HOST="${HOST:-127.0.0.1}" \
RCA_SERVER_MODE="${RCA_SERVER_MODE:-agent}" \
CODEX_FULL_ACCESS="${CODEX_FULL_ACCESS:-true}" \
REQUIRE_ELEVATED_EXECUTION="${REQUIRE_ELEVATED_EXECUTION:-true}" \
node ./scripts/run-bug-rca-ui.js --foreground --port "$PORT" --host "$HOST" --server-mode "$RCA_SERVER_MODE" --codex-full-access "$CODEX_FULL_ACCESS" --require-elevated-execution "$REQUIRE_ELEVATED_EXECUTION"
