#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-simphony-bug-rca-agent}"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"
SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-${USER:-root}}}"

if [[ -z "${NODE_BIN}" ]]; then
  echo "node was not found on PATH." >&2
  exit 1
fi

USER_HOME="${USER_HOME:-}"
if [[ -z "${USER_HOME}" ]] && command -v getent >/dev/null 2>&1; then
  USER_HOME="$(getent passwd "${SERVICE_USER}" | cut -d: -f6)"
fi
if [[ -z "${USER_HOME}" ]]; then
  USER_HOME="$(eval echo "~${SERVICE_USER}")"
fi

PATH_VALUE="$(dirname "${NODE_BIN}")"
if [[ -n "${CODEX_BIN}" ]]; then
  PATH_VALUE="${PATH_VALUE}:$(dirname "${CODEX_BIN}")"
fi
PATH_VALUE="${PATH_VALUE}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Simphony Bug RCA Local Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=HOME=${USER_HOME}
Environment=CODEX_HOME=${USER_HOME}/.codex
Environment=USER=${SERVICE_USER}
Environment=LOGNAME=${SERVICE_USER}
Environment=PATH=${PATH_VALUE}
Environment=PORT=${PORT:-3210}
Environment=HOST=${HOST:-127.0.0.1}
Environment=RCA_SERVER_MODE=agent
Environment=CODEX_FULL_ACCESS=${CODEX_FULL_ACCESS:-true}
Environment=REQUIRE_ELEVATED_EXECUTION=${REQUIRE_ELEVATED_EXECUTION:-true}
Environment=CODEX_BIN=${CODEX_BIN:-codex}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"

echo
echo "Installed the local agent systemd service:"
echo "  ${SERVICE_NAME}"
echo
echo "The service uses HOME=${USER_HOME} so Codex can reuse that machine's local login state."
