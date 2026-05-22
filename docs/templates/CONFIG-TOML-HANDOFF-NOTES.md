# Codex `config.toml` Handoff Notes

Use [config.toml.rishabh.template](</C:/Users/Ayush Mishra/Desktop/share/docs/templates/config.toml.rishabh.template>) as the starting point for Rishabh.

## Where he should place it

Create this file on his machine:

`C:\Users\<his-user>\.codex\config.toml`

## What he must replace

- `REPLACE_WITH_THE_REAL_OCA_RESPONSES_COMPATIBLE_BASE_URL`
- `REPLACE_WITH_BUGDB_MCP_HOST:PORT`

## What he must provide separately

- his own OCA API key
- his own BugDB bearer token if BugDB MCP requires auth
- any Jira or additional MCP configuration he needs

## What not to share

Do not share your personal:

- `C:\Users\Ayush Mishra\.codex\auth.json`
- real API keys
- real bearer tokens
- real `.env` files containing secrets

## Important

- Keep `wire_api = "responses"`
- Do not use `wire_api = "chat"`
- The OCA base URL must be a real Responses-compatible endpoint
- If `.../responses` returns `404`, the base URL is wrong even if the API key is correct
