# VM Package Folder Structure

This folder is the hosted VM/server package only.

It is intended for:

- hosted `shared://simphony` execution on the VM
- hosted UI serving on the VM
- VM-side session and artifact storage

It does not include the separate local client-agent package for direct local folders or UNC paths.

## Top-Level Layout

- `server.js`
  Main HTTP server for the hosted UI, hosted shared-workspace APIs, auth, session APIs, and Codex run orchestration.
- `lib/`
  Server-side modules split by responsibility.
- `public/`
  Browser UI files served by the Node server.
- `scripts/`
  Windows/Node helper scripts used by this VM package.
- `deploy/`
  VM deployment helper wrappers and setup notes.
- `references/`
  Bundled BugDB workflow guidance and supporting reference material.
- `skills/`
  Bundled Codex skill content for Simphony RCA runs.
- `data/`
  Runtime output location for sessions, auth state, logs, and generated artifacts.
- `docs/`
  Human-facing package documentation and inventory notes.
- `.env`
  Real runtime configuration and secrets for this VM.
- `.env.example`
  Template for `.env`.
- `mcp-servers.json`
  MCP configuration for Jira and other optional live MCP entries.
- `START-HERE.txt`
  Fast operator entry point for VM setup and usage.
- `README.md`
  Main package documentation.
- `docs/ARCHITECTURE.md`
  System behavior and deployment model.
- `docs/SHARE-MANIFEST.md`
  Bundle inventory and packaging notes.
- `start-server.cmd`, `start-server.sh`
  Hosted server launchers for VM/server use.
- `start-agent.cmd`, `start-agent.sh`
  Lightweight compatibility wrappers for local agent mode when needed.

## `lib/`

The server implementation is now grouped modulewise. The historical flat filenames still exist as compatibility shims so existing imports and operator habits do not break.

- `core/`
  Shared runtime primitives such as environment loading, config, parsing, prompts, session persistence, runtime checks, and report shaping.
- `auth/`
  Hosted login, SSO, auth storage, and workbook export logic.
- `shared/`
  Hosted shared-workspace APIs and hosted/local broker logic.

Compatibility shims kept at the old flat paths:

- `config.js`, `env-file.js`, `file-utils.js`, `http-utils.js`, `parsing.js`, `prompts.js`, `rca-output.js`, `runtime.js`, `session-store.js`
- `auth-config.js`, `auth-store.js`, `auth-workbook.js`, `auth.js`
- `shared-workspace.js`, `broker.js`

## `public/`

- `index.html`, `app.js`, `styles.css`
  Main hosted application UI.
- `login.html`, `login.js`
  Hosted sign-in page.
- `register.html`, `register.js`
  Local registration UI when enabled.
- `assets/`
  Static images and brand assets.

## `scripts/`

Scripts are now grouped by operational module. The original top-level script names remain as wrappers so existing `.cmd`, `npm`, and task-scheduler entry points still work.

- `server/`
  Hosted server launch and scheduled-task helpers:
  `run-bug-rca-ui.js`, `install-server-startup.ps1`, `remove-server-startup.ps1`, `run-server-task.ps1`, `get-listening-pids.ps1`
- `jira/`
  Jira PAT rotation and revoke helpers:
  `install-jira-pat-rotation.ps1`, `update-jira-pat.ps1`, `rotate-jira-pat.js`, `revoke-jira-pat.js`
- `simphony/`
  Shared Simphony workspace maintenance helpers:
  `install-simphony-nightly-update.ps1`, `update-simphony-working-copy.ps1`
- `common/`
  Shared operational helper scripts such as `remove-scheduled-task.ps1`

Top-level wrapper scripts are preserved for backward compatibility.

## `deploy/`

- `deploy/vm/`
  Convenience wrappers for VM operators.
- `deploy/iis/`
  IIS-related deployment artifacts if that hosting style is used.

## `data/`

- `sessions/`
  Saved RCA sessions.
- `auth-sessions/`
  Auth session state.
- `runtime/codex-output/`
  Latest saved Codex output per session.
- `runtime/remote-workspaces/`
  Generated hosted run directories, including runtime `AGENTS.md`.

## Operator Notes

- If you need the separate local agent for user-machine workspaces, use the client-agent package, not this folder.
- If you change `.env`, `mcp-servers.json`, or server code, restart the VM server.
- This package is intentionally focused on hosted/server behavior so the visible files and commands stay direct.
