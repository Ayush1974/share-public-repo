# Share Manifest

## Bundle Purpose

Portable share bundle for the Oracle Restaurants Bug RCA Console.

## Included

- `server.js`
- `lib/`
- `public/`
- `scripts/`
- `deploy/`
- `package.json`
- `.env`
- `.env.example`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/FOLDER-STRUCTURE.md`
- `docs/SHARE-MANIFEST.md`
- `auth-config.json`
- `mcp-servers.json`
- `start-server.cmd`
- `start-server.sh`
- `start-agent.cmd`
- `start-agent.sh`
- `install-server-startup.cmd`
- `start-server-service.cmd`
- `stop-server-service.cmd`
- `stop-service.cmd`
- `remove-server-startup.cmd`
- `scripts/install-server-startup.ps1`
- `scripts/remove-server-startup.ps1`
- `scripts/run-server-task.ps1`
- `references/BUGINTWFLOW.md`
- `references/.clinerules`
- `references/CLINE_BUGDB_SETUP_GUIDE.md`
- `references/JIRA_MCP_SETUP.md`
- `references/generate-memory-bank-FINAL.md`
- `lib/auth-config.js`
- `lib/auth-store.js`
- `lib/auth.js`
- `lib/env-file.js`
- `public/login.html`
- `public/login.js`
- `skills/simphony-bug-rca-pipeline/SKILL.md`
- `skills/simphony-bug-rca-pipeline/agents/openai.yaml`
- `aitoolinstruction.md`
- `newtoolinstruction.md`
- `error.md`
- `data/`
- `data/auth-login-details.xlsx`

## Excluded From The Share Zip

- populated `data/sessions/*.json`
- populated `data/auth-sessions/*.json`
- populated `data/auth-users.json`
- populated `data/local-accounts.json`
- populated `data/auth-login-details.xlsx`
- populated runtime logs under `data/`
- personal Codex login/session data
- local tokens, auth headers, and credentials

## Recipient Setup Still Required

For the VM UI host:

- Node.js 18+
- Codex CLI installed for the VM user running the hosted server
- either `codex login` completed for that VM user, or API-key provider env vars configured for that VM user
- product workspace available on the VM for the hosted shared roots you configure

For each user machine running the elevated local agent:

- Node.js 18+
- Codex CLI installed and logged in
- access to the target workspace
- bundled `references/` are used for BugDB workflow guidance
- local MCP access is only needed for optional live systems such as Jira
- use the separate client-agent package, not this VM server folder

## Portability Notes

- the app uses bundled `skills/` and bundled `references/`
- `.env` in the package root is auto-loaded at startup when present
- Jira and other optional live MCP server URLs are configured through `mcp-servers.json`
- command-based MCP entries in `mcp-servers.json` can use `${VAR}` or `$VAR` placeholders resolved from runtime env or `.env`
- Jira MCP command-based Docker reference is documented in `references/JIRA_MCP_SETUP.md`
- bundled `references/` are the default BugDB workflow source in this package
- the bundle in this folder is the hosted VM/server package
- the runtime still supports `combined`, `agent`, and `ui` modes, but this packaged share exposes only the hosted VM/server commands
- for VM hosting, `shared://simphony` runs in `combined` mode with Codex on the VM and no local agent required
- `start-server.cmd` and `start-server.sh` are straightforward VM shortcuts for hosted `combined` mode
- the VM can also run the hosted UI persistently through the `SimphonyBugRcaUiHost` Windows Scheduled Task helper scripts
- auth login details are stored in JSON and mirrored into `data/auth-login-details.xlsx` for server-side reporting
- runtime verification in this environment was completed on Windows

## Latest Chat Context - 2026-05-01

- Scope fixed in this package:
  `shared://simphony` and `shared://simphony-temp` should run server-side on the VM without requiring the separate local client agent.
- Hosted VM behavior now implemented:
  Codex runs on the VM, hosted runs force full-access mode so the packaged `shared-workspace-client.js` helper can execute, and shared RCA stays on the server.
- Shared root registration must now be configured explicitly:
  set `SHARED_WORKSPACE_ROOTS` to the hosted roots you want this VM package to expose.
- Current Oracle Code Assist path:
  the package supports `ORACLE_CODE_ASSIST_API_KEY`, `ORACLE_CODE_ASSIST_BASE_URL`, `CODEX_MODEL_PROVIDER=oracle-code-assist`, and `CODEX_PROVIDER_ID=oca`.
- Current Jira token handling:
  keep real Jira PAT values in `.env` and reference them from `mcp-servers.json` placeholders such as `${GBUJIRA_PERSONAL_TOKEN}` instead of storing tokens in the shared files.
- Hosted/local URL update captured from this chat:
  the active VM host is now `http://burvm08103.us.oracle.com:3210`.
- Local client-agent package update captured from this chat:
  the local client bundle was cleaned so its user-facing UI/docs are local/UNC-first and no longer present `shared://simphony` as the intended workflow.
- Browse Workspace clarification:
  the hosted VM UI intentionally keeps `Browse Workspace` disabled; the folder picker belongs only to the local client-agent page on the user machine.
- OCA base URL captured from this chat:
  `https://code-internal.aiservice.us-chicago-1.oci.oraclecloud.com/20250206/app/litellm`
- Current BugDB workflow mode:
  BugDB guidance is intentionally reference-driven from bundled `references/`, with no live BugDB MCP dependency in this package.
- Important operator note:
  after replacing files on the VM, restart the hosted server process so the updated shared-root mapping and launcher defaults are loaded.
