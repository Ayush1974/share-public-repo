#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

SERVICE_NAME="${SERVICE_NAME:-simphony-bug-rca-agent}"
PLIST_ID="${PLIST_ID:-com.oracle.simphony.bug.rca.agent}"
PLIST_FILE="/Library/LaunchDaemons/${PLIST_ID}.plist"

case "$(uname -s)" in
  Linux*)
    if systemctl list-unit-files "${SERVICE_NAME}.service" >/dev/null 2>&1; then
      sudo systemctl start "${SERVICE_NAME}"
    else
      echo "Persistent service not found. Running direct foreground fallback..."
      exec bash ./run-local-agent-now.sh
    fi
    ;;
  Darwin*)
    if [[ -f "${PLIST_FILE}" ]]; then
      sudo launchctl bootstrap system "${PLIST_FILE}" >/dev/null 2>&1 || true
      sudo launchctl enable "system/${PLIST_ID}" >/dev/null 2>&1 || true
      sudo launchctl kickstart -k "system/${PLIST_ID}" >/dev/null 2>&1 || true
    else
      echo "LaunchDaemon not found. Running direct foreground fallback..."
      exec bash ./run-local-agent-now.sh
    fi
    ;;
  *)
    echo "Unsupported OS for START-LOCAL-AGENT.sh. Use the Windows .cmd wrapper on Windows." >&2
    exit 1
    ;;
esac

for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:3210/api/health" >/dev/null 2>&1; then
    echo "Local agent is running at http://127.0.0.1:3210"
    exit 0
  fi
  sleep 1
done

echo "Local agent did not become healthy on http://127.0.0.1:3210. Running direct foreground fallback..." >&2
exec bash ./run-local-agent-now.sh
