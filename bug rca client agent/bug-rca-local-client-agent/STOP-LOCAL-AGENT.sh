#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-simphony-bug-rca-agent}"
PLIST_ID="${PLIST_ID:-com.oracle.simphony.bug.rca.agent}"
PLIST_FILE="/Library/LaunchDaemons/${PLIST_ID}.plist"

case "$(uname -s)" in
  Linux*)
    sudo systemctl stop "${SERVICE_NAME}" >/dev/null 2>&1 || true
    ;;
  Darwin*)
    sudo launchctl bootout system "${PLIST_FILE}" >/dev/null 2>&1 || true
    ;;
  *)
    echo "Unsupported OS for STOP-LOCAL-AGENT.sh. Use the Windows .cmd wrapper on Windows." >&2
    exit 1
    ;;
esac

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:3210 || true)"
  if [[ -n "${PIDS}" ]]; then
    echo "${PIDS}" | xargs kill -9 >/dev/null 2>&1 || true
  fi
fi

echo "Stop request completed for port 3210."
