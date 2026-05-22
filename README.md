# Bug RCA Share Bundle

This folder is the cleaned share root for the Bug RCA packages.

## Main folders

- `bug rca server/bug-rca-vm-server`
  - Hosted VM/server package.
  - Use this on `burvm08103` or another supported hosted VM.
- `bug rca client agent/bug-rca-local-client-agent`
  - Local client-agent package.
  - Use this on end-user machines for local folders and UNC workspaces.
- `docs/`
  - Shared setup guides, handoff context, and reference material for this bundle.

## Start here

1. If you are setting up the hosted VM, read `docs/setup/HOSTED-VM-SETUP-AND-RUN.md`.
2. If you are setting up an end-user machine, read `docs/setup/LOCAL-CLIENT-SETUP-AND-RUN.md`.
3. If you need the latest operational context, read `docs/SHARE-CONTEXT.md`.
4. If you want the full bundle map, read `docs/FOLDER-STRUCTURE.md`.

## Current runtime split

- Hosted `shared://simphony` runs on the VM package.
- Direct local folders and UNC paths run through the local client agent.
- `Fix from RCA` is for writable local or UNC workspaces, not hosted `shared://...` workspaces.
