#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

PORT="${PORT:-3210}" \
HOST="${HOST:-0.0.0.0}" \
RCA_SERVER_MODE="${RCA_SERVER_MODE:-combined}" \
CODEX_FULL_ACCESS="${CODEX_FULL_ACCESS:-false}" \
REQUIRE_ELEVATED_EXECUTION="${REQUIRE_ELEVATED_EXECUTION:-false}" \
node ./scripts/run-bug-rca-ui.js --foreground --port "$PORT" --host "$HOST" --server-mode "$RCA_SERVER_MODE" --codex-full-access "$CODEX_FULL_ACCESS" --require-elevated-execution "$REQUIRE_ELEVATED_EXECUTION"
