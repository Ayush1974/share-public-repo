# Jira MCP Setup

This package can use Jira as an MCP-backed evidence source in two ways:

- URL-based MCP entry in `mcp-servers.json`
- command-based MCP entry in `mcp-servers.json`

Current package behavior:

- URL-based entries are forwarded to Codex as `mcp_servers.<name>.url=...`
- command-based entries are written into the generated runtime `config.toml` for Codex
- `.env` from the VM package root is loaded automatically before startup
- `${VAR}` and `$VAR` placeholders inside `mcp-servers.json` are expanded from the runtime environment
- shipped Jira MCP command examples are present in `mcp-servers.json` but disabled by default

## Current `mcp-servers.json` format

```json
{
  "jira": "http://host:port/mcp",
  "mcp-atlassian": {
    "enabled": true,
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

If Jira MCP is not ready yet, keep:

```json
{
  "jira": ""
}
```

## Jira MCP reference configs

Use the following Atlassian MCP definitions as the upstream Jira-side reference.

### Jira OCI

```toml
[mcp_servers.mcp-atlassian]
command = "docker"
args = [
  "run",
  "--rm",
  "-i",
  "-e", "JIRA_URL",
  "-e", "JIRA_PERSONAL_TOKEN",
  "-e", "JIRA_SSL_VERIFY",
  "ghcr.io/sooperset/mcp-atlassian:latest",
]
env = {
  JIRA_URL = "https://jira.oci.oraclecorp.com/",
  JIRA_PERSONAL_TOKEN = "${JIRA_OCI_PERSONAL_TOKEN}",
  JIRA_SSL_VERIFY = "false",
  READ_ONLY_MODE = "true",
  MCP_VERBOSE = "true",
}
```

### Jira Central

```toml
[mcp_servers.mcp-atlassian-central]
command = "docker"
args = [
  "run",
  "--rm",
  "-i",
  "-e", "JIRA_URL",
  "-e", "JIRA_PERSONAL_TOKEN",
  "-e", "JIRA_SSL_VERIFY",
  "ghcr.io/sooperset/mcp-atlassian:latest",
]
env = {
  JIRA_URL = "https://jira.oraclecorp.com/jira",
  JIRA_PERSONAL_TOKEN = "${JIRA_CENTRAL_PERSONAL_TOKEN}",
  JIRA_SSL_VERIFY = "false",
  READ_ONLY_MODE = "true",
  MCP_VERBOSE = "true",
}
```

### GBU Jira

```toml
[mcp_servers.mcp-atlassian-gbujira]
command = "docker"
args = [
  "run",
  "--rm",
  "-i",
  "-e", "JIRA_URL",
  "-e", "JIRA_PERSONAL_TOKEN",
  "-e", "JIRA_SSL_VERIFY",
  "ghcr.io/sooperset/mcp-atlassian:latest",
]
env = {
  JIRA_URL = "https://gbujira.oraclecorp.com/",
  JIRA_PERSONAL_TOKEN = "${GBUJIRA_PERSONAL_TOKEN}",
  JIRA_SSL_VERIFY = "false",
  READ_ONLY_MODE = "true",
  MCP_VERBOSE = "true",
}
```

## How to use those configs with this package

Option 1: URL-based Jira MCP

1. Stand up the Jira MCP service separately.
2. Expose that Jira MCP service through a reachable MCP HTTP endpoint.
3. Put that endpoint into `mcp-servers.json` under the `jira` key.

Example:

```json
{
  "jira": "http://your-jira-mcp-host:port/mcp"
}
```

Option 2: command-based Jira MCP

1. Put the Jira PAT into `.env` in the VM package root.
2. Put the command-based Jira MCP object directly into `mcp-servers.json`, using `${VAR}` placeholders.
3. Set `"enabled": true` for the Jira MCP entry you want to activate.
4. Ensure the runtime host has the backing command installed, for example `docker`.

Example `.env`:

```text
JIRA_OCI_PERSONAL_TOKEN=your-jira-oci-pat
JIRA_CENTRAL_PERSONAL_TOKEN=your-jira-central-pat
GBUJIRA_PERSONAL_TOKEN=your-gbujira-pat
```

## Operational notes

- Keep Jira in read-only mode unless there is an explicit need to allow writes.
- Do not store real Jira personal access tokens in `mcp-servers.json`, README text, or shareable package files.
- If a URL-based Jira MCP entry returns HTML instead of MCP content, the package will skip that endpoint before the RCA run starts.
- If a command-based Jira MCP entry points to a missing command such as `docker`, the package will skip that entry before the RCA run starts.
- BugDB can still run without Jira if the `jira` field is empty or disabled.
