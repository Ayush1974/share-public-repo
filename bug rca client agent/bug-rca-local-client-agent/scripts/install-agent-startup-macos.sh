#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLIST_ID="${PLIST_ID:-com.oracle.simphony.bug.rca.agent}"
PLIST_FILE="/Library/LaunchDaemons/${PLIST_ID}.plist"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"
SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-$(stat -f '%Su' /dev/console)}}"

if [[ -z "${NODE_BIN}" ]]; then
  echo "node was not found on PATH." >&2
  exit 1
fi

USER_HOME="${USER_HOME:-$(dscl . -read "/Users/${SERVICE_USER}" NFSHomeDirectory | awk '{print $2}')}"
PATH_VALUE="$(dirname "${NODE_BIN}")"
if [[ -n "${CODEX_BIN}" ]]; then
  PATH_VALUE="${PATH_VALUE}:$(dirname "${CODEX_BIN}")"
fi
PATH_VALUE="${PATH_VALUE}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "${APP_DIR}/data"

cat > "${PLIST_FILE}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_ID}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${APP_DIR}/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${APP_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>${USER_HOME}</string>
    <key>CODEX_HOME</key>
    <string>${USER_HOME}/.codex</string>
    <key>USER</key>
    <string>${SERVICE_USER}</string>
    <key>LOGNAME</key>
    <string>${SERVICE_USER}</string>
    <key>PATH</key>
    <string>${PATH_VALUE}</string>
    <key>PORT</key>
    <string>${PORT:-3210}</string>
    <key>HOST</key>
    <string>${HOST:-127.0.0.1}</string>
    <key>RCA_SERVER_MODE</key>
    <string>agent</string>
    <key>CODEX_FULL_ACCESS</key>
    <string>${CODEX_FULL_ACCESS:-true}</string>
    <key>REQUIRE_ELEVATED_EXECUTION</key>
    <string>${REQUIRE_ELEVATED_EXECUTION:-true}</string>
    <key>CODEX_BIN</key>
    <string>${CODEX_BIN:-codex}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${APP_DIR}/data/agent-daemon.out.log</string>
  <key>StandardErrorPath</key>
  <string>${APP_DIR}/data/agent-daemon.err.log</string>
</dict>
</plist>
EOF

chown root:wheel "${PLIST_FILE}"
chmod 644 "${PLIST_FILE}"

launchctl bootout system "${PLIST_FILE}" >/dev/null 2>&1 || true
launchctl bootstrap system "${PLIST_FILE}"
launchctl enable "system/${PLIST_ID}"
launchctl kickstart -k "system/${PLIST_ID}" >/dev/null 2>&1 || true

echo
echo "Installed the local agent LaunchDaemon:"
echo "  ${PLIST_ID}"
echo
echo "The daemon uses HOME=${USER_HOME} so Codex can reuse that machine's local login state."
