# Bug RCA Local Client Agent

This folder is the local client package for end-user machines.

Use this package when Codex should run on the user machine for:

- a direct local folder
- a direct UNC path
- writable fix/build/test workflows

Do not use this package as the hosted VM/server package.

## Start here

- Quick operator entry: `START-HERE.txt`
- Package docs:
  - `docs/PREREQUISITES.md`
  - `docs/USER-GUIDE.md`
  - `docs/FOLDER-STRUCTURE.md`

## Main URLs

- Hosted UI: `http://burvm08103.us.oracle.com:3210/home`
- Local health: `http://127.0.0.1:3210/api/health`

## Important

- `Browse Workspace` belongs to the local client flow for local/UNC paths.
- Hosted `shared://...` workspaces such as `shared://simphony` are VM-side workflows and must be typed manually on the hosted UI when intentionally used.
- `Fix from RCA` should use a writable local or UNC workspace.
