# Share Package Context

This file is the current handoff context for the `share` bundle on `2026-05-01`.

## Package layout

- Root docs now live under `docs/` so the bundle root stays limited to runnable packages plus the main entry document.
- `bug rca client agent/bug-rca-local-client-agent`
  - Local client-agent package for user machines.
  - Runs Codex locally for direct local or UNC workspaces.
  - Hosted UI target is now `http://burvm08103.us.oracle.com:3210`.
  - User-facing local-client UI/docs were cleaned so they no longer advertise `shared://simphony` or `shared://simphony-temp`.
- `bug rca server/bug-rca-vm-server`
  - Hosted VM/server package.
  - Runs the UI, sessions, artifacts, hosted shared workspace APIs, and hosted Codex execution when running in `combined` mode.
- `docs/references/generate-memory-bank-FINAL.md`
  - The supported memory-bank guidance file.
  - This replaced all earlier references to `generate-memory-bank-codex-optimized.md`.

## Default hosted workspace behavior

- `shared://simphony` is the default Simphony workspace placeholder and preferred workspace selection.
- `shared://simphony-temp` remains accepted as a legacy alias.
- On the VM, `shared://simphony` resolves to the hosted Simphony checkout, preferring `C:\code` when available and otherwise falling back to `C:\simphony\temp`.
- `Browse Workspace` is only for direct local folder picking on a local client-agent page.
- On the hosted VM UI, `Browse Workspace` stays disabled by design.
- Hosted shared workspace IDs must be entered manually in the UI.
- Port remains `3210`.

## Local client-agent behavior now implemented

- The local client-agent package is now local/UNC-first in its user-facing UI and setup docs.
- `Browse Workspace` on the local client-agent page is only for:
  - a local folder on the user machine
  - a direct UNC path such as `\\BURVM08103\simphony\temp`
- The local client-agent page no longer presents `shared://simphony` or `shared://simphony-temp` as the intended workflow.
- `Fix from RCA` on the local client-agent page is presented as a writable local/UNC workflow, not a hosted shared-workspace workflow.
- The local client-agent hosted UI config now points to:
  - `http://burvm08103.us.oracle.com:3210`
- The local client-agent `npm` scripts were corrected so `start`, `start:bg`, and `start:agent` now run in `agent` mode instead of the wrong `combined` mode.

## Browse Workspace clarification from latest UI capture

- `C:\Users\Ayush Mishra\Desktop\result.txt` captured the hosted VM UI, not the local client-agent page.
- The captured text explicitly shows:
  - `On the hosted VM UI, Browse Workspace now works for local/UNC paths through a direct or broker-paired local client agent`
  - `Browse Workspace is disabled on the hosted VM UI`
- That means the disabled button in that capture is expected behavior, not a local-client picker failure.
- If a user wants the folder picker, they must use the local client-agent page on the user machine, not `http://burvm08103.us.oracle.com:3210/home`.
- The same capture also showed a separate runtime issue:
  - workspace `C:\Simphony\trunk\Extensible2`
  - server response `Workspace path does not exist on this machine.`
  - this is a path-existence problem on the execution machine, separate from the browse-button behavior.

## RCA/report behavior now implemented

- Product-generic RCA is the primary `.clinerules`-driven mode and is presented as:
  - `Root Cause Report`
  - `Completed RCA report`
  - `Single report preview`
- Evidence-first remains separate and evidence-only.
- The parser now accepts both:
  - an explicit `## RCA:` block
  - `.clinerules` field output even when `## RCA:` is missing
- The structured RCA renderer now promotes these fields cleanly when present:
  - `Subsystem`
  - `Investigation Tier`
  - `Culprit`
  - `Call Chain`
  - `Root Cause Code`
  - `Log Evidence`
  - `Why It Fails`
  - `Complete Fix`
  - `Fix Explanation`
  - `All Affected Files`
  - `Confidence`
  - `Remaining Uncertainty`
- The home preview and full report now render in a more professional `.clinerules`-aligned layout:
  - RCA summary block
  - spotlight cards for key findings
  - metrics strip
  - grouped sections for Evidence, Root Cause Analysis, Complete Fix Scope, and Additional RCA Findings
  - numbered call-chain rendering
  - styled code/log blocks
  - affected-file pills
  - callout formatting for quoted/report text

## Session/final output fixes

- Saved session parsing no longer prefers noisy Codex websocket/auth chatter as the final RCA message.
- `result.txt`-style RCA content is now recognized and can populate the preview/report UI.
- `.clinerules` RCA field headings are promoted into structured report sections.
- The report UI can now show proper RCA content instead of only a generic `Report ready` message with no usable block.

## Fix-mode rules now enforced

- `Fix from RCA` is disabled for hosted `shared://...` workspaces, including `shared://simphony`.
- If stale fix guidance is already selected while a hosted shared workspace is active, the UI automatically falls back to `Root Cause Report`.
- The UI blocks manual submit attempts that still try to use fix guidance with a hosted shared workspace.
- Expected guidance:
  - use `shared://...` for RCA and source inspection
  - use a writable local checkout for fix/build/test flows

## Prompt/reference behavior

- The run prompt explicitly expects the full `.clinerules` output shape for product-generic RCA.
- Bundled references used for RCA guidance are:
  - `references/BUGINTWFLOW.md`
  - `references/.clinerules`
  - `references/generate-memory-bank-FINAL.md`
- `generate-memory-bank-FINAL.md` is supporting repo-intelligence guidance only.
- BugDB evidence and `.clinerules` RCA structure remain the source of truth.

## Key files changed in this bundle

- Local client agent:
  - `lib/file-utils.js`
  - `lib/parsing.js`
  - `lib/prompts.js`
  - `lib/session-store.js`
  - `package.json`
  - `public/app.js`
  - `public/index.html`
  - `ui-host-config.json`
  - `START-HERE.txt`
  - `README.md`
  - `docs/PREREQUISITES.md`
  - `docs/USER-GUIDE.md`
  - `docs/FOLDER-STRUCTURE.md`
  - `auth-config.json`
  - `aitoolinstruction.md`
- VM server:
  - `lib/file-utils.js`
  - `lib/parsing.js`
  - `lib/prompts.js`
  - `lib/session-store.js`
  - `public/app.js`
  - `public/index.html`
  - `public/styles.css`
  - `README.md`
  - `START-HERE.txt`
  - `ARCHITECTURE.md`
- Root bundle docs:
  - `README.md`
  - `docs/FOLDER-STRUCTURE.md`
  - `docs/setup/HOSTED-VM-SETUP-AND-RUN.md`
  - `docs/setup/LOCAL-CLIENT-SETUP-AND-RUN.md`
  - `docs/SHARE-CONTEXT.md`

## Verification completed

- `node --check` passed for the modified `public/app.js` files.
- `node --check` passed for the modified local-client and VM `public/app.js` files after the host and local-client cleanup.
- Search verification confirmed no remaining `burvm10496.us.oracle.com` references remain anywhere under `Desktop\share`.
- The local client hosted UI control file now contains:
  - `uiBaseUrl = http://burvm08103.us.oracle.com:3210`
- A fresh staged zip was rebuilt after the local-client cleanup:
  - `share-working-20260430-client-cleanup.zip`
- Parser logic was already verified for:
  - explicit `## RCA:` parsing
  - `.clinerules`-style RCA field extraction without explicit `## RCA:`
  - extraction of fields such as `Subsystem`, `Culprit`, `Why It Fails`, and `Confidence`
- Search verification already confirmed:
  - `generate-memory-bank-FINAL.md` is present and referenced
  - no `generate-memory-bank-codex-optimized.md` references remain

## Not yet fully live-validated

- A fresh browser-side visual end-to-end RCA run has not been executed in this pass after the latest UI rendering polish.
- The code is updated and syntax-checked, but one real RCA session should still be run through the UI to visually confirm:
  - `Single report preview`
  - full `Root Cause Report`
  - formatted `.clinerules` sections with real evidence/code/log content

## Operational expectation

- VM-hosted RCA for `shared://simphony` should use the VM package in `combined` mode.
- Hosted VM saved sessions and current artifact views are now scoped to the signed-in UI user.
- Local client-agent usage remains for:
  - direct local workspaces
  - UNC workspaces
  - writable fix/build/test workspaces on the user machine
- Hosted VM UI usage remains for:
  - `shared://simphony`
  - `shared://simphony-temp`
  - manual hosted workspace entry for hosted `shared://...` roots, with `Browse Workspace` reserved for local/UNC paths through a direct or broker-paired local client agent
