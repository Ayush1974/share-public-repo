# Local Client Setup And Run

## Package

- Zip: `bug rca client agent.zip`
- Extracted folder: `<extract-folder>\bug-rca-local-client-agent`

## Purpose

- Use this package on the end-user machine.
- The local client agent runs Codex on the user machine for direct local workspaces and UNC paths.
- The browser UI still opens from the hosted VM:
  - `http://burvm08103.us.oracle.com:3210/home`

## Health endpoint

- Local agent health: `http://127.0.0.1:3210/api/health`

## Before you start

1. Install Node.js 18 or newer.
2. Install Codex CLI.
3. Complete `codex login` once on the user machine.
4. Confirm the hosted UI URL is `http://burvm08103.us.oracle.com:3210/home`.

## Windows setup

1. Open PowerShell in `<extract-folder>\bug-rca-local-client-agent`.
2. Optional: point the local client package to the hosted VM UI:

```powershell
.\SET-VM-HOST.cmd http://burvm08103.us.oracle.com:3210
```

3. Complete Codex login if needed:

```powershell
codex login
```

4. Install the persistent local agent:

```powershell
.\INSTALL-LOCAL-AGENT.cmd
```

This installs the Windows Scheduled Task, saves the hosted UI URL, and starts the local agent in `agent` mode.

5. Start the local agent later when needed:

```powershell
cmd /c START-LOCAL-AGENT.cmd
```

6. Stop the local agent:

```powershell
.\STOP-LOCAL-AGENT.cmd
```

7. Check local health:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3210/api/health | Select-Object -ExpandProperty Content
```

## Linux and macOS setup

1. Open Terminal in `<extract-folder>/bug-rca-local-client-agent`.
2. Optional: point the local client package to the hosted VM UI:

```bash
bash ./SET-VM-HOST.sh http://burvm08103.us.oracle.com:3210
```

3. Complete Codex login if needed:

```bash
codex login
```

4. Install the persistent local agent:

```bash
bash ./INSTALL-LOCAL-AGENT.sh
```

5. Start the local agent:

```bash
bash ./START-LOCAL-AGENT.sh
```

6. Stop the local agent:

```bash
bash ./STOP-LOCAL-AGENT.sh
```

7. Check local health:

```bash
curl http://127.0.0.1:3210/api/health
```

## RCA usage

1. Start the local agent on the user machine.
2. Open `http://burvm08103.us.oracle.com:3210/home`.
3. Choose the product.
4. Use `Browse Workspace` or type a direct local/UNC path on the user machine.

Examples:

- `C:\Simphony\trunk`
- `\\BURVM08103\simphony\temp`

5. Enter ticket ID, issue title, product version, and RCA guidance.
6. Start RCA.

## When to use this package

- Use local or UNC paths when you want `Browse Workspace`, source inspection from the user machine, fix mode, code edits, build, or test.
- If you intentionally want the hosted VM Simphony checkout for RCA/source inspection, type `shared://simphony` manually in the hosted UI.
- `shared://simphony` is a hosted workspace ID, not a file path.
- On the VM it resolves to the hosted Simphony checkout, preferring `C:\code` when available and otherwise falling back to `C:\simphony\temp`.

## Important

- For hosted `shared://...` workspaces, the VM package runs Codex in combined mode.
- For direct local or UNC workspaces, the user machine runs Codex through the local client agent.
- Hosted `shared://...` workspaces are for RCA/source inspection.
- `Fix from RCA` is blocked for hosted `shared://...` workspaces by design.
