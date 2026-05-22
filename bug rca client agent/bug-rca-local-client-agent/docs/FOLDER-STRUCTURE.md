# Local Client Package Folder Structure

## Top level

- `README.md`
  - Main package overview.
- `START-HERE.txt`
  - Quick operator entry for end users.
- `docs/`
  - Human-facing setup and usage documentation.
- `server.js`
  - Local client agent server entry point.
- `lib/`
  - Local runtime helpers, session handling, prompts, and shared-workspace logic.
- `public/`
  - Browser UI assets served by the local client package when needed.
- `scripts/`
  - Startup, host-url, and background task helpers.
- `references/`
  - Bundled BugDB workflow guidance files and supporting references.
- `skills/`
  - Bundled Simphony RCA skill files.
- `data/`
  - Local sessions, artifacts, runtime output, and Codex profile state.

## Important root files

- `INSTALL-LOCAL-AGENT.cmd`, `INSTALL-LOCAL-AGENT.sh`
  - Persistent install helpers.
- `START-LOCAL-AGENT.cmd`, `START-LOCAL-AGENT.sh`
  - Normal local agent start commands.
- `STOP-LOCAL-AGENT.cmd`, `STOP-LOCAL-AGENT.sh`
  - Stop commands.
- `SET-VM-HOST.cmd`, `SET-VM-HOST.sh`
  - Set the hosted VM UI base URL.
- `ui-host-config.json`
  - Stores the hosted VM UI target used by this package.
- `mcp-servers.json`
  - Optional live MCP configuration for this local package, such as Jira.

## Documentation

- `docs/PREREQUISITES.md`
  - Quick prerequisites and setup flow.
- `docs/USER-GUIDE.md`
  - Detailed local client usage guide.
- `docs/FOLDER-STRUCTURE.md`
  - This file.

## Runtime note

- `aitoolinstruction.md`, `newtoolinstruction.md`, and `error.md` remain at the package root because the runtime reads them from fixed paths.
