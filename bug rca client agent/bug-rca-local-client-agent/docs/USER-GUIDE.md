# Local Client User Guide

This package is for end users who need the local Bug RCA agent on their own machine.

The hosted UI VM can change at any time. The current default VM host can also be kept in the app root `.env` file under:

`BUG_RCA_VM_BASE_URL`

The local agent runs on:

`http://127.0.0.1:3210`

The browser is the bridge between the hosted UI and the user's local agent.

## Prerequisites

- Node.js 18 or newer
- Codex CLI installed
- `codex login` completed once on that machine
- access to the target local source workspace

## Recommended Windows Flow

Set the VM host first:

```powershell
powershell -ExecutionPolicy Bypass -File .\set-hosted-ui-url.ps1 -HostedUiBaseUrl http://your-vm-host:3210
```

That value can also be HTTPS:

```powershell
powershell -ExecutionPolicy Bypass -File .\set-hosted-ui-url.ps1 -HostedUiBaseUrl https://your-vm-host
```

Then use this as the normal Windows start command:

```powershell
.\START-LOCAL-AGENT.cmd
```

What `START-LOCAL-AGENT.cmd` does:

- stops anything already listening on port `3210`
- runs the direct elevated local startup
- verifies `http://127.0.0.1:3210/api/health`

Then open the hosted UI:

```powershell
start http://your-vm-host:3210/home
```

## Optional One-Time Persistent Install

If you want to try one-time persistent startup registration on Windows:

```powershell
.\INSTALL-LOCAL-AGENT.cmd
```

If it is blocked by local policy or Task Scheduler restrictions, keep using:

```powershell
.\START-LOCAL-AGENT.cmd
```

Straightforward `cmd` commands:

```cmd
SET-VM-HOST.cmd http://your-vm-host:3210
START-LOCAL-AGENT.cmd
```

Straightforward macOS/Linux commands:

```bash
bash ./SET-VM-HOST.sh http://your-vm-host:3210
bash ./INSTALL-LOCAL-AGENT.sh
```

What this does:

- stops anything already listening on port `3210`
- starts the local agent
- verifies the local health endpoint

## Usage Manual

After the local agent is running, the user opens the hosted UI VM URL that is configured in `ui-host-config.json`.

The page will use the local agent on `127.0.0.1:3210` for:

- workspace browsing
- RCA runs
- session history
- Codex execution

Workspace entry rules:

- Use this local client package for a local folder on the user machine or a direct UNC path.
- If a Windows user wants direct SMB access, use `\\BURVM08103\simphony\temp` as the workspace path.

## Manual Control

Start again:

```powershell
.\START-LOCAL-AGENT.cmd
```

Stop:

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-local-agent.ps1
```

On macOS/Linux:

```bash
bash ./START-LOCAL-AGENT.sh
bash ./STOP-LOCAL-AGENT.sh
```

## Direct Start Notes

If the persistent startup installer is blocked by machine policy or Task Scheduler restrictions, keep using:

```powershell
.\START-LOCAL-AGENT.cmd
```

On macOS/Linux, the direct foreground fallback is:

```bash
bash ./run-local-agent-now.sh
```

Then verify:

`http://127.0.0.1:3210/api/health`

Change VM host later:

```powershell
powershell -ExecutionPolicy Bypass -File .\set-hosted-ui-url.ps1 -HostedUiBaseUrl http://your-vm-host:3210
```

Or with HTTPS:

```powershell
powershell -ExecutionPolicy Bypass -File .\set-hosted-ui-url.ps1 -HostedUiBaseUrl https://your-vm-host
```

## Health Check

To confirm the agent is up:

`http://127.0.0.1:3210/api/health`

## Important Notes

- This package is for the user machine only.
- It does not host the main UI.
- The VM URL serves the UI and must be set explicitly for each environment.
- The user machine runs the local agent and Codex.
