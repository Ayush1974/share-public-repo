# VM HTTP Setup

Use this on the Windows VM that hosts the Bug RCA server package.

## Final URL Pattern

- Public HTTP URL:
  `http://your-vm-host:3210/home`
- VM listener:
  `http://0.0.0.0:3210`

## Prerequisites

- Windows VM
- Node.js 18 or newer installed on the VM
- the full Bug RCA UI app present on the VM at:
  `C:\bug-rca-ui\bug-rca-ui-2`
- port `3210` available on the VM

## What Runs Where

- the VM runs the hosted `combined` server from this package
- the VM serves the UI and runs Codex for hosted shared workspaces such as `shared://simphony`
- users only need the separate local client-agent package when they intentionally use a direct local or UNC workspace

## Installation

This package is the VM server package. Run it from this folder on the VM.

## Usage Manual

### Start In Foreground

Use this package command:

```cmd
RUN-VM-UI-NOW.cmd
```

If you are already inside this VM package folder, you can also run:

```cmd
start-server.cmd
```

### Install Persistent Startup

Use these package commands:

```cmd
INSTALL-VM-UI-STARTUP.cmd
START-VM-UI-SERVICE.cmd
```

If you are already inside this VM package folder, you can also run:

```cmd
install-server-startup.cmd
start-server-service.cmd
```

### Stop Or Remove Persistent Startup

```cmd
STOP-VM-UI-SERVICE.cmd
REMOVE-VM-UI-STARTUP.cmd
```

## Verification

On the VM:

```cmd
netstat -ano | findstr :3210
```

In a browser:

- `http://your-vm-host:3210/login`
- `http://your-vm-host:3210/home`

The VM should expose the UI on port `3210`.

## Notes

- hosted `shared://simphony` runs execute on the VM from this package
- direct local folders and UNC paths still use the separate client-agent package on the user machine
