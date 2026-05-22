# Bug RCA Local Client Agent

## Purpose

This package is for end users. It runs the local agent on the user's machine while the hosted UI stays on the VM.

## Requirements

- Node.js 18 or newer
- Codex CLI installed
- codex login completed once on the user machine

## Hosted UI

- Hosted VM UI: `http://burvm08103.us.oracle.com:3210/home`
- Local health: `http://127.0.0.1:3210/api/health`

## Windows

1. Open PowerShell in the extracted `bug-rca-local-client-agent` folder.
2. Run `codex login` if not already done.
3. Run `.\INSTALL-LOCAL-AGENT.cmd`.
4. Start manually with `cmd /c START-LOCAL-AGENT.cmd`.

## Linux and macOS

1. Open Terminal in the extracted `bug-rca-local-client-agent` folder.
2. Run `codex login` if not already done.
3. Run `bash ./INSTALL-LOCAL-AGENT.sh`.
4. Start manually with `bash ./START-LOCAL-AGENT.sh`.

## Notes

- Use this local client package for a local folder on the user machine or a direct UNC path.
- If a Windows user wants direct share access, use `\\BURVM08103\simphony\temp`.
- shared://... workspaces are for RCA and source inspection.
- Fix mode still requires a writable local checkout.
- For hosted shared://... workspaces, the VM package can run Codex when it is running in combined mode.

