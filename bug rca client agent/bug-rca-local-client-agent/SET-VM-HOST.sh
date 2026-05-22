#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

if [[ -z "${1:-}" ]]; then
  echo "Usage:"
  echo "  bash ./SET-VM-HOST.sh http://your-vm-host:3210"
  exit 1
fi

node ./scripts/set-hosted-ui-url.js "$1"
