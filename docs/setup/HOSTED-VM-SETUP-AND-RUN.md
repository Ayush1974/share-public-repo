# Hosted VM Setup And Run

## Package

- Zip: `bug rca server.zip`
- Extracted folder: `<extract-folder>\bug-rca-vm-server`

## Purpose

- Use this package on the hosted VM/server only.
- It runs the UI host, hosted shared-workspace APIs, session storage, and Codex on the VM for hosted `shared://...` workspaces.

## Before you start

1. Install Node.js 18 or newer on the VM.
2. Prepare the hosted shared checkout if you want RCA against VM source.
3. If nightly update is required, confirm `svn` works on the VM.
4. Open Windows PowerShell as Administrator.

Example `svn` check:

```powershell
svn info C:\simphony\temp
```

## Windows setup

1. Go to the extracted folder:

```powershell
cd "<extract-folder>\bug-rca-vm-server"
```

2. Configure the hosted shared workspace root:

```powershell
[System.Environment]::SetEnvironmentVariable(
  "SHARED_WORKSPACE_ROOTS",
  '[{"id":"simphony","aliases":["simphony-temp"],"label":"Simphony Shared Workspace","rootPath":"C:\\simphony\\temp","productKey":"simphony"}]',
  "Machine"
)
```

Notes:

- This exposes hosted browse/read/search APIs for the hosted Simphony checkout.
- `shared://simphony` prefers `C:\code` when available and otherwise falls back to `C:\simphony\temp`.
- Users type `shared://simphony` manually in the hosted UI.
- `shared://simphony-temp` remains accepted as a legacy alias.
- `shared://simphony` is a hosted logical ID, not a network path.
- Do not use `file://BURVM08103/simphony/temp` for hosted mode.

3. Install the VM UI startup task:

```powershell
.\install-server-startup.cmd
```

This installs the Windows Scheduled Task, runs the app in `combined` mode, binds the hosted UI to `0.0.0.0:3210`, and enables Codex execution on the VM for hosted `shared://...` workspaces.

4. Start the hosted UI now:

```powershell
.\start-server-service.cmd
```

5. Verify the hosted UI:

- Browser URL: `http://burvm08103.us.oracle.com:3210/home`
- Optional local health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3210/api/health | Select-Object -ExpandProperty Content
```

6. Optional foreground run for testing:

```powershell
.\start-server.cmd
```

## Shared checkout nightly maintenance

- Install nightly update task:

```powershell
.\install-simphony-nightly-update.cmd
```

- Run once now:

```powershell
.\run-simphony-nightly-update-now.cmd
```

- Remove the nightly task:

```powershell
.\remove-simphony-nightly-update.cmd
```

- Default hosted checkout path: `C:\simphony\temp`

## How RCA works on this VM

- Users open the hosted UI in their browser.
- The VM serves the UI, hosted source APIs, sessions, and artifacts.
- On the hosted VM page, `Browse Workspace` is for local/UNC paths through a connected local client agent; `shared://simphony` is still typed manually.
- For hosted `shared://...` workspaces, the VM runs Codex directly in `combined` mode.
- Users only need the separate local client package for direct local or UNC workspaces.
- If a Windows user intentionally wants SMB access instead of hosted mode, the direct path is `\\BURVM08103\simphony\temp`.

## Important

- Do not run `INSTALL-LOCAL-AGENT.cmd` on the VM.
- Complete `codex login` on the VM account if you want hosted `shared://...` execution on the VM.
- `Fix from RCA` should use a writable local checkout on the user machine.
- The separate user package is `bug rca client agent.zip`.
