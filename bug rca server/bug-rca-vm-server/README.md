# Oracle Restaurants Bug RCA Console

Oracle Restaurants RCA UI server package for hosted VM/server use.

This folder is the hosted server package:

- it serves the browser UI
- it runs Codex on the VM for hosted shared workspaces such as `shared://simphony`
- it stores hosted sessions and artifacts on the VM

The separate local client-agent package for direct local folders or UNC paths is not included in this folder.

## Architecture

This project now supports three runtime modes:

- `combined`
  UI and execution API on the same machine. This is the simplest local setup.
- `agent`
  Localhost execution API only. This is the mode that launches Codex, reads local workspaces, writes sessions, and manages artifacts.
- `ui`
  Static UI host only. This mode does not run Codex and does not access the user workspace.

If the UI is hosted on a VM and the user selects a true local or UNC workspace, the browser should connect to a local agent such as:

```text
http://127.0.0.1:3210
```

That way, RCA and fix execution still happen on the user machine.

For hosted shared workspaces such as `shared://simphony`, this VM package should run in `combined` mode so the browser can keep RCA execution, sessions, and artifacts on the VM without requiring a user-installed local agent.

Port `3210` is the only supported runtime port for both the hosted UI entry point and the local agent. The shared launcher force-clears any older listener already bound to `3210` before starting a new runtime.

On the Windows VM, stop the hosted runtime with `stop-server-service.cmd`, `stop-service.cmd`, or `npm run stop:server`.

For a full end-to-end explanation with diagrams and demo guidance, see:

- `docs/ARCHITECTURE.md`
- `docs/FOLDER-STRUCTURE.md`

## What Runs Where

- browser UI:
  can run from the user machine or a VM
- Codex CLI:
  always runs on the machine hosting the `agent` or `combined` server
- source workspace:
  must exist on the machine hosting the `agent` or `combined` server
- sessions and artifacts:
  are stored under `data/` on the machine hosting the `agent` or `combined` server

## Included In This Bundle

- `.env`
- `.env.example`
- `README.md`
- `docs/`
- `START-HERE.txt`
- `server.js`
- `lib/`
- `public/`
- `scripts/`
- `deploy/`
- `skills/simphony-bug-rca-pipeline/`
- `references/`
- `mcp-servers.json`
- `auth-config.json`
- `auth-config.oracle-sso.example.json`
- `oracle-sso.env.example`
- `package.json`
- `product-catalog.example.json`
- `start-server.cmd`
- `start-server.sh`
- `start-agent.cmd`
- `start-agent.sh`
- `install-simphony-nightly-update.cmd`
- `run-simphony-nightly-update-now.cmd`
- `remove-simphony-nightly-update.cmd`
- `install-gbujira-pat-rotation.cmd`
- `run-gbujira-pat-rotation-now.cmd`
- `remove-gbujira-pat-rotation.cmd`
- `install-server-startup.cmd`
- `start-server-service.cmd`
- `stop-server-service.cmd`
- `remove-server-startup.cmd`
- `scripts/install-server-startup.ps1`
- `scripts/install-simphony-nightly-update.ps1`
- `scripts/update-simphony-working-copy.ps1`
- `scripts/rotate-jira-pat.js`
- `scripts/revoke-jira-pat.js`
- `scripts/install-jira-pat-rotation.ps1`
- `scripts/update-jira-pat.ps1`
- `scripts/remove-server-startup.ps1`
- `scripts/remove-scheduled-task.ps1`
- `scripts/run-server-task.ps1`

Human-facing package docs now live under `docs/`:

- `docs/ARCHITECTURE.md`
- `docs/FOLDER-STRUCTURE.md`
- `docs/SHARE-MANIFEST.md`

## Prerequisites

For this VM package running `combined` mode:

- Node.js 18 or newer
- Codex CLI on `PATH`
- either `codex login` already completed on that machine, or API-key provider env vars are set for that machine user
- supported API-key env inputs now include:
  `OPENAI_API_KEY`
  `CODEX_API_KEY`
  `ORACLE_CODE_ASSIST_API_KEY`
  `OCA_API_KEY`
- optional provider endpoint env inputs:
  `OPENAI_BASE_URL`
  `CODEX_BASE_URL`
  `ORACLE_CODE_ASSIST_BASE_URL`
  `OCA_BASE_URL`
- do not set any of those API-key vars to an Oracle SSO or JWT token when you are targeting the OpenAI-hosted endpoint; hosted runs reject that before start
- Oracle Code Assist example:
  `ORACLE_CODE_ASSIST_BASE_URL=https://code-internal.aiservice.us-chicago-1.oci.oraclecloud.com/20250206/app/litellm`
  `CODEX_PROVIDER_ID=oca`
  `ORACLE_CODE_ASSIST_MODEL=gpt5`
  `ORACLE_CODE_ASSIST_HTTP_HEADERS={"client":"codex-cli","client-version":"0"}`
- access to the product workspace on that machine

For BugDB or Jira evidence:

- BugDB workflow guidance is bundled under `references/` and does not require a BugDB MCP server
- local access to the needed MCP server is required only for live systems such as Jira
- any required credentials configured locally

For a VM running `ui` mode only:

- Node.js 18 or newer
- Codex CLI is not required there
- `codex login` is not required there
- the product workspace is not required there
- this machine only serves the hosted browser UI and optional sign-in flow

For a VM exposing hosted shared workspaces in `combined` mode:

- the VM can expose read/search/browse APIs for the shared roots you configure
- Codex runs on the VM for hosted shared workspaces such as `shared://simphony`
- users do not need a local agent for hosted shared workspaces
- sessions and artifacts for hosted shared runs stay on the VM
- hosted saved sessions and current artifact views are scoped to the signed-in UI user
- local agents are still used only for direct local or UNC workspaces on user machines
- on the hosted VM UI, `Browse Workspace` can open a local or UNC folder picker when a local client agent is reachable directly or through the broker; users still type `shared://simphony` manually for hosted runs
- `shared://simphony` is a logical hosted workspace ID, not a filesystem path
- `shared://simphony` resolves only when `SHARED_WORKSPACE_ROOTS` defines a hosted root for that descriptor on the VM
- `shared://simphony-temp` remains available as a legacy alias
- in Product mode, the default VM checkout folders are `C:\Code\simphony`, `C:\Code\rna`, `C:\Code\cnc`, and `C:\Code\flm`
- do not use `file://BURVM08103/simphony/temp` for this hosted mode
- if a Windows user wants direct SMB access instead, the direct path is `\\BURVM08103\simphony\temp`
- if hosted UI sign-in is enabled, the browser issues a short-lived shared-workspace access token so the hosted shared-runtime helper can call the VM browse/read/search APIs safely during RCA
- if hosted runs fail immediately with `0xC0000139`, the Codex native Windows binary is crashing on that VM OS build; move hosted execution to a newer compatible Windows VM or use the local client agent instead
- this package now blocks hosted `shared://` execution up front on Windows build `10.0.14393` because that VM build is known to hit the Codex `0xC0000139` native crash

For Oracle SSO on the hosted UI:

- an OIDC-compatible Oracle SSO tenant
- a client/application registration for this UI host
- a valid callback URL that points back to this app, for example:
  `http://<vm-host>:3210/auth/callback`
- a strong cookie secret for app-session signing

## MCP Configuration

The runtime auto-loads `.env` from the VM package root before startup. Put real tokens in `.env`, then reference them from `mcp-servers.json`.

BugDB note:

- this package does not require a BugDB MCP entry
- BugDB workflow guidance comes from bundled `references/BUGINTWFLOW.md` and `references/.clinerules`
- `mcp-servers.json` is primarily for Jira or other optional live MCP integrations

Edit `mcp-servers.json`.

Format:

```json
{
  "jira": "",
  "mcp-atlassian": {
    "enabled": false,
    "command": "docker",
    "args": ["run", "--rm", "-i", "-e", "JIRA_URL", "-e", "JIRA_PERSONAL_TOKEN", "-e", "JIRA_SSL_VERIFY", "ghcr.io/sooperset/mcp-atlassian:latest"],
    "env": {
      "JIRA_URL": "https://jira.oci.oraclecorp.com/",
      "JIRA_PERSONAL_TOKEN": "${JIRA_OCI_PERSONAL_TOKEN}",
      "JIRA_SSL_VERIFY": "false",
      "READ_ONLY_MODE": "true",
      "MCP_VERBOSE": "true"
    }
  }
}
```

Example `.env`:

```text
JIRA_OCI_PERSONAL_TOKEN=your-jira-oci-pat
JIRA_CENTRAL_PERSONAL_TOKEN=your-jira-central-pat
GBUJIRA_PERSONAL_TOKEN=your-gbujira-pat
ORACLE_CODE_ASSIST_API_KEY=your-oca-api-key
ORACLE_CODE_ASSIST_BASE_URL=https://code-internal.aiservice.us-chicago-1.oci.oraclecloud.com/20250206/app/litellm
CODEX_PROVIDER_ID=oca
```

Rules:

- key = MCP server name
- value can be either:
  - MCP URL string
  - command-based MCP object with `command`, optional `args`, optional `env`, and optional `enabled`
- empty value = disabled
- set `"enabled": false` to keep a command-based MCP entry in the file without activating it
- `${VAR}` and `$VAR` placeholders are expanded from the server process environment, including values loaded from `.env`
- do not store tokens or credentials in this file

Jira MCP note:

- this package now supports command-based Jira MCP entries directly from `mcp-servers.json`
- Atlassian Docker MCP examples are documented in `references/JIRA_MCP_SETUP.md`
- command-based Jira MCP entries require the backing command to exist on the runtime host, for example `docker`
- disabled template entries for `mcp-atlassian`, `mcp-atlassian-central`, and `mcp-atlassian-gbujira` are shipped in `mcp-servers.json`

Jira PAT rotation:

- `npm run jira:rotate:gbu`
  creates a replacement PAT through Jira's PAT API, updates `GBUJIRA_PERSONAL_TOKEN` in `.env`, auto-revokes the previous PAT when it can identify it safely, and writes local expiry metadata under `data/jira-pat-rotation/`
- `npm run jira:rotate-pat -- --target central`
  rotates one of the built-in Jira targets: `gbujira`, `central`, or `oci`
- `npm run jira:revoke:previous:gbu`
  revokes the single non-current GBU Jira PAT based on the last successful rotation metadata
- `npm run jira:revoke-pat -- --target gbujira --token-name AyushMishraJIRAToken`
  revokes a specific PAT by name, with a safety check that refuses to delete the current PAT from rotation metadata
- `--only-when-expiring-within-days <N>`
  skips rotation until the locally recorded expiry is inside that window, which makes the script safe to run from a daily scheduler after it has been bootstrapped once
- `--current-token-expires-at <ISO>`
  seeds the local metadata for an existing token that was created outside this script so the first scheduled run does not rotate immediately
- `--auth-token-env <NAME>`
  lets you authenticate the create call with a PAT stored in another env var instead of the target token variable
- `--basic-user <USER> --basic-password-env <NAME>`
  switches the create call to basic auth if you prefer to bootstrap with username/password instead of an existing PAT
- by default the rotation script now revokes the previous PAT automatically after the new PAT is created and written to `.env`
- `--keep-previous`
  disables the automatic revoke step if you want to keep the older PAT temporarily
- current `gbujira` policy only allows PAT lifetimes up to 5 days, so the repo now defaults to a 5-day PAT lifetime and a 1-day scheduled renewal window

Scheduled PAT rotation:

- `install-gbujira-pat-rotation.cmd`
  installs a daily Windows Task Scheduler job named `GbujiraPatRotation`
- `run-gbujira-pat-rotation-now.cmd`
  runs the same rotation check immediately without waiting for the scheduler
- `remove-gbujira-pat-rotation.cmd`
  removes the scheduled task
- the scheduled task runs `scripts/update-jira-pat.ps1`, which calls `scripts/rotate-jira-pat.js`
- safe steady-state flow:
  keep `GBUJIRA_PERSONAL_TOKEN` in `.env`, seed the current expiry once, and let the task run daily with `--only-when-expiring-within-days 1`
- after the first successful rotation, the task can continue authenticating with the current token stored in `.env`, create the next replacement PAT, update `.env`, and wait until the next renewal window
- if the token is already expired before the task runs, PAT-based automation cannot recover by itself because the old PAT can no longer authenticate the create call; in that case you must bootstrap again with a fresh PAT or with basic auth. Atlassian documents PAT replacement via `POST /rest/pat/latest/tokens`, and expired PATs still require replacement rather than reactivation. ([confluence.atlassian.com](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html))

Example:

```text
npm run jira:rotate:gbu -- --only-when-expiring-within-days 1 --current-token-expires-at 2026-05-05T11:54:36+05:30
```

Example scheduled-task install:

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-jira-pat-rotation.ps1 -Target gbujira -CurrentTokenExpiresAt 2026-05-05T11:54:36+05:30 -OnlyWhenExpiringWithinDays 1 -StartTime 01:30
```

## Temporary VM Host In `.env`

If you want one temporary VM host to be reused by the generic share builders, keep it in:

- `.env`

Example:

```text
BUG_RCA_VM_BASE_URL=http://your-vm-host:3210
```

Current behavior:

- the server reads `.env` automatically at startup
- this value is used by the server-side runtime and by operators as the canonical hosted base URL reference

BugDB workflow guidance is read from bundled `references/` by default.

## Oracle SSO / OIDC

Oracle SSO is optional and is configured on the UI host.

Edit `auth-config.json`.

Recommended auth modes:

- `local`
  login page shows the password path and keeps Oracle SSO placeholders ready
- `oracle-sso`
  login page pushes users to Oracle SSO and disables local password endpoints
- `hybrid`
  login page offers both `Continue with SSO sign-in` and `Continue sign-in with password`

Required fields when Oracle SSO is enabled:

```json
{
  "authMode": "hybrid",
  "enabled": true,
  "providerName": "Oracle SSO",
  "issuer": "https://your-oracle-sso-issuer",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://your-vm-host:3210/auth/callback",
  "postLogoutRedirectUri": "http://your-vm-host:3210/login",
  "registrationUrl": "https://your-access-request-page",
  "supportUrl": "https://your-password-help-page",
  "scope": "openid profile email",
  "cookieSecret": "replace-with-a-long-random-secret",
  "sessionTtlHours": 12
}
```

You can start from either:

- `auth-config.oracle-sso.example.json`
- `oracle-sso.env.example`

Field notes:

- `authMode`
  `local`, `oracle-sso`, or `hybrid`
- `enabled`
  turns Oracle SSO on or off
- `issuer`
  base issuer URL used for OIDC discovery
- `clientId`
  OIDC client ID from Oracle SSO
- `clientSecret`
  OIDC client secret from Oracle SSO
- `redirectUri`
  callback URL registered with the identity provider
- `postLogoutRedirectUri`
  where the app sends the browser after local sign-out
- `registrationUrl`
  optional link shown on the login page for access requests or registration
- `supportUrl`
  optional link shown on the login page for password help or sign-in support
- `cookieSecret`
  used to sign the short-lived login flow state cookie
- `sessionTtlHours`
  lifetime of the app session created after sign-in

Environment variables can override the file:

- `AUTH_MODE` or `OIDC_AUTH_MODE`
- `OIDC_ENABLED`
- `OIDC_PROVIDER_NAME`
- `OIDC_ISSUER`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_REDIRECT_URI`
- `OIDC_POST_LOGOUT_REDIRECT_URI`
- `OIDC_REGISTRATION_URL`
- `OIDC_SUPPORT_URL`
- `OIDC_SCOPE`
- `OIDC_COOKIE_SECRET`
- `OIDC_SESSION_TTL_HOURS`
- `AUTH_DATA_DIR` or `OIDC_DATA_DIR`

When SSO is enabled, the server stores concise logged-in user information only:

- subject
- username
- display name
- email
- employee ID
- given name
- family name
- groups
- roles
- last login time

For local password sign-in, this app stores only a versioned `scrypt` password record with a random salt and cost parameters. Plain passwords are never stored.

The server also keeps a synced Excel workbook:

- `data/auth-login-details.xlsx`

Sync behavior:

- `auth-users.json` and `local-accounts.json` remain the source of truth
- the workbook is regenerated on startup
- the workbook is regenerated after app-driven auth updates
- while the server is running, direct edits to those JSON files also trigger a workbook refresh
- the workbook intentionally excludes password hashes, salts, and other secret material

Default auth storage location:

- first choice:
  `data/auth-sessions/`, `data/auth-users.json`, `data/local-accounts.json`, and `data/auth-login-details.xlsx`
- Windows fallback order when the repo-local `data/` directory is not writable:
  `%LOCALAPPDATA%\bug-rca-ui\auth-data\`
  then `%TEMP%\bug-rca-ui\auth-data\`
  then `%USERPROFILE%\.bug-rca-ui\auth-data\`
- Linux and macOS fallback order:
  `$TMPDIR/bug-rca-ui/auth-data/` when available
  then `~/.bug-rca-ui/auth-data/`

## Server Startup Commands

This VM package ships the hosted server commands and lightweight local-agent compatibility wrappers.

Use the separate client-agent package on user machines when you need the full user-machine local-agent setup experience.

### 1. Foreground VM Start

Use this on a VM when you want the hosted UI and hosted `shared://simphony` execution in one foreground process.

Windows:

```powershell
.\start-server.cmd
```

Unix:

```bash
./start-server.sh
```

Defaults:

- host: `0.0.0.0`
- port: `3210`

In this package, `start-server.cmd` is the VM/server shortcut for `combined` mode. It serves the browser UI and runs Codex on the VM for hosted shared workspaces such as `shared://simphony`.

Hosted `shared://` runs now force Codex full-access mode on the VM so the packaged `shared-workspace-client.js` helper can browse/search/read the server-side workspace without approval-policy blocking.
Set `SHARED_WORKSPACE_ROOTS` explicitly when you want hosted `shared://...` workspaces on the VM. No default shared workspace path is injected automatically.

Direct local folders and UNC paths still stay on the user machine and still need the local client agent.

### 2. Persistent Windows VM Hosting

Use this when the VM should keep serving the hosted UI and hosted `shared://simphony` runtime until you explicitly stop it.

```cmd
Run once as Administrator on the VM while signed in as the same Windows account that already completed `codex login`:

```cmd
cd /d C:\bug-rca-ui
install-server-startup.cmd
```

That creates a Windows Scheduled Task named:

```text
SimphonyBugRcaUiHost
```

Behavior:

- runs the hosted UI and RCA runtime in `combined` mode
- binds to `0.0.0.0:3210`
- starts automatically when that same VM user signs in
- reuses that VM user's Codex login/profile for hosted shared runs
- keeps serving all users until you stop or remove the task
- writes logs to `data/server-runtime.out.log` and `data/server-runtime.err.log`

If an older package already installed this task under `SYSTEM`, remove it first and then install it again so the task switches to the signed-in VM user profile.

Control commands from `cmd`:

Start it now:

```cmd
cd /d C:\bug-rca-ui
start-server-service.cmd
```

Stop it:

```cmd
cd /d C:\bug-rca-ui
stop-server-service.cmd
```

Alias:

```cmd
cd /d C:\bug-rca-ui
stop-service.cmd
```

`start-server-service.cmd` starts the hosted server task `SimphonyBugRcaUiHost` by default.
`stop-server-service.cmd` and `stop-service.cmd` stop the hosted server task when present, also try the known `SimphonyBugRcaAgent` task as a cleanup path for older or conflicting RCA runtimes on the same VM, and then force-clear any remaining listener on port `3210`.

Remove the persistent startup task entirely:

```cmd
cd /d C:\bug-rca-ui
remove-server-startup.cmd
```

Check the task:

```cmd
schtasks /Query /TN "SimphonyBugRcaUiHost"
```

Check whether port `3210` is listening:

```cmd
netstat -ano | findstr :3210
```

Open the shared UI:

```cmd
start http://your-vm-host:3210/home
```

If Windows Firewall is enabled, allow the port once:

```cmd
netsh advfirewall firewall add rule name="bug-rca-ui-3210" dir=in action=allow protocol=TCP localport=3210
```

## Browser Flow For VM Hosting

Recommended flow:

1. Start the VM combined host with `start-server.cmd` or the installed startup task.
2. Let users open the VM-hosted UI page.
3. In Product mode, select the product to run against the matching VM checkout under `C:\Code`.
4. Use Developer mode / Browse Code Folder only for local or UNC paths when a local client agent is connected directly or through the broker.
5. Only when a user intentionally chooses a direct local folder or UNC workspace does the page fall back to the local agent on `127.0.0.1:3210`.
6. If the default local-agent address is not correct for those direct local/UNC cases, expand `Advanced agent settings` and change it.
7. Run RCA or fix from the browser.

For direct local or UNC workspaces, the page will call the localhost agent for:

- `/api/config`
- `/api/run`
- `/api/pick-workspace`
- `/api/sessions`
- `/api/artifacts`

## Default URLs

Local agent default:

```text
http://127.0.0.1:3210
```

UI host default:

```text
http://<vm-host>:3210/home
```

Example VM UI host:

```text
http://your-vm-host:3210/home
```

## Multi-User Behavior

Yes, multiple users can use the hosted VM URL at the same time.

What is shared on the VM:

- the hosted browser UI
- Codex execution for hosted shared workspaces such as `shared://simphony`
- hosted shared workspace browsing and file search APIs
- sessions and RCA artifacts for hosted shared runs
- hosted login/auth session handling
- concise login tracking JSON and the synced `auth-login-details.xlsx`

What remains per user machine:

- the elevated local agent on `127.0.0.1:3210`, but only for direct local or UNC workspaces
- Codex execution for those direct local or UNC workspaces
- workspace browsing for those direct local or UNC workspaces
- RCA session history and artifacts for those direct local or UNC workspaces

That means many users can open the same VM URL together. Hosted shared runs stay on the VM, while direct local or UNC runs stay on the user's machine.

## Environment Variables

Common:

```powershell
$env:PORT = "3210"
$env:HOST = "127.0.0.1"
$env:RCA_SERVER_MODE = "combined"
$env:SIMPHONY_WORKSPACE = "C:\Code\simphony"
$env:RNA_WORKSPACE = "C:\Code\rna"
$env:FLM_WORKSPACE = "C:\Code\flm"
$env:CNC_WORKSPACE = "C:\Code\cnc"
$env:CODEX_BIN = "codex.cmd"
$env:CODEX_MODEL = "gpt-5.3-codex"
$env:CODEX_FULL_ACCESS = "true"
$env:REQUIRE_ELEVATED_EXECUTION = "true"
```

Optional hosted shared workspace roots on the UI server:

```powershell
$env:SHARED_WORKSPACE_ROOTS = '[{"id":"simphony","aliases":["simphony-temp"],"label":"Simphony Shared Workspace","rootPath":"D:\\shared-workspaces\\simphony","productKey":"simphony"}]'
```

`RCA_SERVER_MODE` values:

- `combined`
- `agent`
- `ui`

## Shared Simphony SVN Maintenance

If the Windows VM hosts a shared Simphony SVN working copy, this bundle can maintain that checkout nightly and also run hosted RCA directly on the VM when the package is started in `combined` mode.

Users can then open the hosted UI and use the fixed hosted shared workspace exposed for that product, such as `shared://simphony`. The browser sends that descriptor to the hosted runtime, and the shared RCA run stays on the VM. A separate local agent is only needed when the user intentionally chooses a direct local or UNC workspace instead of the hosted shared descriptor.

That hosted descriptor is not the same as a direct file-share path. If a Windows user is intentionally bypassing hosted API mode and has SMB access, the direct share path is `\\BURVM08103\simphony\temp`.

If the hosted UI requires sign-in, the browser also obtains a short-lived shared-workspace access token from the VM UI and passes it to the hosted helper used during shared RCA runs.

Nightly maintenance for the shared checkout:

- `install-simphony-nightly-update.cmd`
- `run-simphony-nightly-update-now.cmd`
- `remove-simphony-nightly-update.cmd`

## Session Management

Session History now supports:

- opening saved sessions
- deleting one session
- deleting all saved sessions
- protection against deleting currently running sessions

Session files are stored under:

```text
data/sessions/
```

## Behavior Rules

- `Run RCA` is analysis only
- `Continue With Changes` continues investigation context
- `Fix Files From RCA` is the step that authorizes code edits
- after a fix, builds and targeted automated tests are allowed
- UI automation is allowed only when the user explicitly asks for `UI automation`, `UI automation testing`, or unmistakably equivalent wording
- use bundled `references/` as the BugDB workflow source

## Generated Local Files

- `aitoolinstruction.md`
- `newtoolinstruction.md`
- `error.md`
- `data/sessions/*.json`
- `data/launcher-background.out.log`
- `data/launcher-background.err.log`
- `data/launcher-background.ps1`
- `data/launcher-background.cmd`
- `data/agent-startup.log`
- `data/agent-daemon.out.log`
- `data/agent-daemon.err.log`
- `data/auth-sessions/*.json`
- `data/auth-users.json`

## Compatibility Notes

- `combined` mode was runtime-verified on Windows in this environment
- the hosted server package in this folder is Windows-focused
- the UI still supports connecting to a separate localhost agent when the user intentionally picks a direct local or UNC workspace
- local-agent installers and user-machine wrappers belong to the separate client-agent package, not this VM package

## Important Browser Limitation

If you host the UI over `https` and try to call a plain `http://127.0.0.1` local agent, some browsers may block that as mixed content.

For that case, use one of these approaches:

- host the UI over internal `http`
- run the full app locally in `combined` mode
- add an HTTPS-capable localhost agent layer later

## HTTPS On The VM UI Host

Recommended approach:

- keep this app listening on `http://0.0.0.0:3210` on the VM
- terminate TLS in front of it with IIS, a load balancer, or another reverse proxy
- expose only the HTTPS address to users, for example:
  `https://your-vm-host/home`

Why this is the right pattern:

- this app already understands forwarded protocol information for secure auth cookies
- the browser entry point becomes HTTPS without forcing immediate TLS changes on the local agent runtime
- VM-side cert lifecycle stays centralized

### IIS Reverse Proxy Example

On the Windows VM:

1. Install IIS.
2. Install the IIS URL Rewrite module.
3. Install IIS Application Request Routing and enable proxying.
4. Keep the app running locally on the VM with:
   `start-server.cmd`
5. Bind the IIS site to your HTTPS certificate on port `443`.
6. Add a reverse-proxy rule from the IIS site to:
   `http://127.0.0.1:3210`
7. Forward these headers:
   `X-Forwarded-Proto=https`
   `X-Forwarded-Host=<public-hostname>`
8. Expose users to:
   `https://<public-hostname>/home`

### Auth Configuration For HTTPS

If Oracle SSO is enabled on the VM UI host, update these values to the HTTPS public address:

- `redirectUri`
  `https://<public-hostname>/auth/callback`
- `postLogoutRedirectUri`
  `https://<public-hostname>/login`

Also make sure the Oracle SSO app registration uses the same HTTPS callback URL.

### User Local-Agent Package With HTTPS

The separate user local-agent package can still point to an HTTPS-hosted VM URL.

That configuration is managed in the client-agent package, not in this VM server folder.

### What To Test

Before rolling HTTPS to users, test this in your actual corporate browser build:

1. Open the hosted UI at `https://<public-hostname>/home`.
2. Confirm login works if Oracle SSO is enabled.
3. Confirm the page can still reach `http://127.0.0.1:3210/api/health`.
4. Confirm workspace browsing and RCA runs still work.

If the browser blocks localhost calls from the HTTPS page, the next step is not a VM fix. The next step is adding HTTPS support or another trusted local bridge for the local agent.

## Security Notes

Safe to share:

- app source
- bundled skill files
- bundled references
- static assets
- launcher scripts
- documentation

Do not share:

- tokens
- credentials
- personal Codex login data
- unrelated private session history
