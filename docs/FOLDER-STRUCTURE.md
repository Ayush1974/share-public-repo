# Folder Structure

## Root

- `README.md`
  - Entry document for this share bundle.
- `docs/`
  - Shared documentation and handoff context.
- `bug rca server/`
  - Hosted VM/server package container.
- `bug rca client agent/`
  - Local client-agent package container.

## docs

- `docs/setup/HOSTED-VM-SETUP-AND-RUN.md`
  - Hosted VM install, configure, and run steps.
- `docs/setup/LOCAL-CLIENT-SETUP-AND-RUN.md`
  - Local client install, configure, and run steps.
- `docs/SHARE-CONTEXT.md`
  - Latest handoff state and behavior notes.
- `docs/references/generate-memory-bank-FINAL.md`
  - Memory-bank generator reference prompt kept at the share level.

## Hosted VM package

- `bug rca server/bug-rca-vm-server/public`
  - Hosted web UI assets.
- `bug rca server/bug-rca-vm-server/lib`
  - Shared runtime and server helpers.
- `bug rca server/bug-rca-vm-server/references`
  - Bundled RCA prompt/reference files used by the hosted package.
- `bug rca server/bug-rca-vm-server/skills`
  - Hosted skill bundle for RCA flows.
- `bug rca server/bug-rca-vm-server/scripts`
  - Setup, startup-task, and utility scripts.
- `bug rca server/bug-rca-vm-server/data`
  - Runtime sessions, artifacts, and working directories.

## Local client package

- `bug rca client agent/bug-rca-local-client-agent/public`
  - Local client web UI assets.
- `bug rca client agent/bug-rca-local-client-agent/lib`
  - Shared runtime and local-agent helpers.
- `bug rca client agent/bug-rca-local-client-agent/references`
  - Bundled RCA prompt/reference files used by the local client package.
- `bug rca client agent/bug-rca-local-client-agent/skills`
  - Local skill bundle for RCA flows.
- `bug rca client agent/bug-rca-local-client-agent/scripts`
  - Local startup and helper scripts.
- `bug rca client agent/bug-rca-local-client-agent/data`
  - Local runtime sessions, artifacts, and agent state.
