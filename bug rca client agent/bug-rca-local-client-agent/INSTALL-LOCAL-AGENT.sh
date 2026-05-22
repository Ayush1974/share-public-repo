#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18+ is required." >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex CLI is required. Install it and complete codex login first." >&2
  exit 1
fi

case "$(uname -s)" in
  Linux*)
    bash ./scripts/install-agent-startup-linux.sh
    ;;
  Darwin*)
    bash ./scripts/install-agent-startup-macos.sh
    ;;
  *)
    echo "Unsupported OS for INSTALL-LOCAL-AGENT.sh. Use the Windows .cmd wrapper on Windows." >&2
    exit 1
    ;;
esac
