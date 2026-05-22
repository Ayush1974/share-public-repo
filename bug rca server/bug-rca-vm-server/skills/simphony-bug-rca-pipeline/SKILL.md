---
name: "simphony-bug-rca-pipeline"
description: "Use when the user wants Oracle Hospitality Simphony bug investigation, BugDB analysis, Jira-style RCA, workaround guidance, or a step-by-step fix plan. Trigger for bug numbers, BugDB prompts, deep RCA, root-cause analysis, attachment/log analysis, or when Codex should combine ../../references/BUGINTWFLOW.md with ../../references/.clinerules in one workflow."
---

# Simphony Bug RCA Pipeline

Use this skill as the wrapper around the existing workspace instructions. Do not edit or paraphrase them unless the user explicitly asks for a rewrite. Load them in this order:

1. `../../references/BUGINTWFLOW.md`
2. `../../references/.clinerules`

Treat `BUGINTWFLOW.md` as the BugDB workflow reference and `.clinerules` as the second-pass deep RCA and fix-completeness framework.

## Required operating rules

- Do not expect a BugDB MCP server in this package.
- Use bundled `../../references/BUGINTWFLOW.md`, `../../references/.clinerules`, and related packaged reference material as the primary BugDB workflow guidance path.
- Do not use bundled `references/` as a generic fallback for non-BugDB systems such as Jira, shared source evidence, or other live runtime data.
- If the request is generic, ask for the bug number first.
- Always read the bundled BugDB workflow references before concluding.
- Never rely on a single clue; correlate the bundled BugDB workflow guidance with the provided bug number, logs, comments, attachments, Jira details, and source evidence when available.
- Always list the MCP calls used. If no live MCP was used, state that clearly in `MCP Calls`.
- Always inspect comments, audit/history, attachments list, and downloadable text/csv/log attachments when available.
- If attachments include logs or text, analyze them before finalizing RCA.
- If any required data cannot be retrieved, state exactly what is missing.
- When live BugDB data is not available, keep using the bundled references to preserve the workflow contract and document the missing BugDB fields clearly in `MCP Calls` and `Remaining Uncertainty`.
- After finding a likely root cause, run the `.clinerules` second-pass validation, contradiction check, caller verification, and tier-upgrade logic before final output.
- If confidence is below `HIGH`, continue the investigation rather than stopping early.
- Treat `shared://` workspaces, including `shared://simphony` and the legacy alias `shared://simphony-temp`, as RCA-only by default. Do not create patches, fix bundles, handoff files, or other fix artifacts there unless the user explicitly requests a dedicated fix step on a writable local checkout.
- Normalize mojibake in the final RCA text before presenting it. Replace unreadable UTF-8/Windows-1252 corruption with plain ASCII equivalents in the final output.
- Do not paste raw unified diff hunks or diff markers such as `@@ ... @@` into RCA or evidence sections. If a likely fix is mentioned during RCA, describe it in prose.
- After proposing or implementing a fix, run a bounded self-feedback validation loop instead of stopping at code inspection.
- Use failures from tests, build output, logs, and user-approved UI repro as feedback to refine the fix.
- Do not call the result "self-healing" unless the pipeline actually ran verification, observed failures or regressions, corrected them, and re-validated successfully.
- When UI execution is part of the repro or validation, prefer a visible local app/session so the user can observe it working on screen, but only after the user's current input explicitly says `UI automation`, `UI automation testing`, or another unmistakably equivalent UI-driving request.
- If the affected scope includes a UI component, do not perform UI automation by default. After the relevant build and automated verification steps, wait until the user's current input explicitly asks for `UI automation`, `UI automation testing`, or an unmistakably equivalent UI-driving step before launching or driving any UI flow.
- After proposing or implementing a fix, always attempt the relevant build, run, and verification flow for the affected component within environment constraints.
- Apply the same build, run, and recursive verification discipline to non-UI components, even when no UI execution step exists.
- Narrate major UI actions in commentary while the flow is running so the user knows what is being launched, clicked, or validated, but only after the user has explicitly authorized UI execution by asking for `UI automation`, `UI automation testing`, or equivalent wording in the current input.
- If sign-in, password, MFA, or another secret is required, ask the user for it only at the point of need and use it only for the active step.
- When implementing non-trivial code changes, add a developer intent comment near the changed logic using the user-requested format `JIRA-ID| guid| one line summary`, and list every changed file in the final verification summary.
- If screenshots are created during validation, delete them immediately after analysis unless the user explicitly asks to retain them.
- If the workflow is being shared through paired prompt files, keep the shared prompt copies aligned with newly proven workflow adaptations in the same pass.
- When preparing a shareable fix handoff, generate the source-code patch from the working-copy base/pristine content, and when XML deliverables are needed provide the changed XML files as raw files with repo-relative structure instead of forcing an XML patch.
- When preparing a developer-shareable bundle, include a README and manifest, keep bundled references and prompt copies aligned, and exclude secrets, stale screenshots, temporary logs, and other local-only artifacts.
- For `shared://` workspaces, use the shared-workspace helper as the only source-code evidence path. Do not inspect or rely on any local product checkout such as `C:\Simphony\trunk\Extensible2` for source evidence.
- In a `shared://` run, local packaged references are allowed only for workflow instructions such as `references/BUGINTWFLOW.md` and `references/.clinerules`; they are not a substitute for shared source reads.
- If shared-workspace `browse`, `search`, or `read` calls fail or hang, stop and report the shared-workspace blocker instead of falling back to a local checkout for code correlation.

## Investigation pipeline

1. Read the two source files above.
2. Classify the bug from title, description, version, exact symptom, and repro steps.
3. Start at Tier 1 from `.clinerules`; upgrade only when confidence requires it.
4. Gather bug evidence from the available non-BugDB-MCP sources:
   - bundled `BUGINTWFLOW.md` and `.clinerules`
   - operator-provided bug header/details
   - comments, history/audit, and attachments when supplied in the request, session, or local artifacts
   - relevant downloadable text/csv/log attachments when available
   - Jira link, SR metadata, related bugs, or other live non-BugDB sources when useful
5. Correlate log timestamps, thread IDs, and exact error strings with the code path.
6. Search only the mapped subsystem first, then expand according to `.clinerules`.
7. Read targeted code sections, verify the actual call chain, and identify the culprit logic.
8. Perform recursive self-correction:
   - Re-read the bug description
   - Confirm logs match code
   - Confirm the identified code path can really produce the symptom
   - Check adjacent code paths for the same defect pattern
   - Upgrade tier if confidence is not high
9. If a fix is required, implement the complete fix scope rather than a minimal patch.
10. Run the validation and healing loop:
   - identify the narrowest affected unit tests first
   - add or update regression tests if the bug is not covered
   - run targeted tests
   - if they fail, inspect the failure, patch the code or tests as needed, and rerun
   - attempt the relevant build for the changed or validated component
   - attempt to run the narrowest relevant executable, service, subsystem flow, or smoke path for the affected component
   - after targeted tests pass, run the next relevant regression ring for the subsystem
   - if a UI path exists for the affected scope and the user's current input after the fix explicitly asks for `UI automation`, `UI automation testing`, or an unmistakably equivalent UI-driving step, launch the relevant UI flow in a visible way, reproduce or validate the scenario, and verify the visible behavior matches the expected result; otherwise document that UI validation is pending an explicit UI automation request
   - use logs, screenshots, and observed runtime behavior as feedback
   - repeat until the repro is fixed and the affected regression ring is clean, or until blocked by environment constraints
11. Keep the loop bounded and explicit:
   - prefer up to 3 meaningful fix-and-verify iterations per bug unless the user asks for more
   - stop early only when the bug is fixed and no new regressions appear in the exercised scope
   - if blocked, document the exact blocker and the next command or test needed
12. Return the answer in the combined format below.

## Validation and healing rules

- Start with the smallest reliable test scope, then widen.
- Always attempt the relevant build before finalizing a fix unless the environment prevents it.
- Always attempt to run the narrowest relevant executable or subsystem path after the build when such a path exists.
- Favor existing unit tests first; add focused regression tests when coverage is missing.
- If the code path is not unit-testable by itself, use the best available automated layer in this order:
  - unit test
  - integration or component test
  - subsystem smoke test
  - UI or end-to-end repro, but only after the user's current input explicitly asks for `UI automation`, `UI automation testing`, or equivalent wording
- Treat every failing verification step as new evidence, not as noise.
- Distinguish:
  - pre-existing unrelated failures
  - failures caused by the new fix
  - flaky or environment-dependent failures
- Only auto-correct failures that are clearly in scope for the current bug or directly caused by the current fix.
- Never silently weaken or delete tests just to make the suite pass.
- If a narrowed build fails only because runtime output files are locked by an active visible session, stop the lock owner, rerun the build, and relaunch only after the copy step succeeds.
- If a legacy non-SDK .NET Framework PackageReference project fails restore because `win` is missing as a `RuntimeIdentifier`, prefer the smallest compatible project fix by adding `RuntimeIdentifiers` in the main property group and then retry the narrowed build.
- If `project.assets.json` and `.csproj.nuget.dgspec.json` already contain the expected runtime or package entries for a legacy non-SDK PackageReference project, do not keep rewriting project files to chase a stale `dotnet build` failure; confirm with native Visual Studio `MSBuild.exe` first.
- For legacy non-SDK .NET Framework WPF or PackageReference validation, prefer Visual Studio `MSBuild.exe` as the authoritative build engine and treat `dotnet build` only as secondary evidence.
- If native `MSBuild.exe` gets past the edited project and later fails with `NU1301` against authenticated Oracle artifact feeds, classify that as an external environment/authentication blocker unless the user explicitly asks for feed remediation.
- If `BuildProjectReferences=false` still traverses referenced restore or package-evaluation paths, separate that downstream dependency/feed noise from the compile signal for the edited project instead of assuming the fix failed.
- If the user provides an existing NuGet root such as `C:\nuget`, reuse that location and do not create `offline-nuget-packages` or another new offline cache folder.
- Before visible UI validation with companion tools such as EMC and ServiceHost, verify the launched executables come from the same branch/output tree and correct any branch mismatch before using the session as evidence.
- If the user provides an EMC application-server endpoint, validate basic network reachability to that host/port before classifying the validation failure as a product/code issue.
- If a build, run, EMC, sign-in, or UI-validation step needs user-supplied information, ask the user explicitly for the minimum missing input at the point of need instead of guessing or skipping the step.
- When credentials, PINs, server URLs, org/site/property values, or other secrets are required, request them only for the active step and do not persist them in files, notes, or final summaries.
- If UI input automation appears to succeed at the command layer but the user-visible app shows no actual input or click effect, classify that as a session/desktop delivery blocker and switch to the smallest user-assisted action needed to resume validation.
- If the UI can be navigated by semantic targets, prefer live UI Automation state and mouse-driven semantic navigation over raw coordinate assumptions before concluding which screen is active.
- If the EMC sign-in form includes a server field, treat server entry as mandatory and populate the form in the order `server`, `username`, `org/company`, `password`, then submit.
- If EMC or another visible desktop client depends on sidecar files in its install/output folder, launch it with its executable folder as the working directory instead of inheriting the shell working directory.
- If EMC launched from the correct binary still shows generic sign-in captions such as `ServerPage.FormName` or fails with missing local translation/text-binary files, inspect the working directory and relaunch from the executable folder before classifying the issue as a product/code bug.
- If EMC accepts credentials and then raises an explicit schema-version or database-version mismatch dialog, classify that as an environment/schema blocker after successful authentication rather than as a credential-entry failure.
- If the user manually dismisses an environment or schema dialog and the target window opens afterward, preserve that dialog as part of the verification record and continue from the opened app state instead of restarting the entire UI flow.
- If ServiceHost or another local host process reports missing modules or assemblies from the shell working directory instead of its output folder, relaunch it with the executable folder as the working directory before treating the failure as application logic or fix regression.
- If UI execution is available for the affected scope, treat it as an optional next verification layer after automated tests that requires the user's current input to explicitly ask for `UI automation`, `UI automation testing`, or equivalent wording.
- If UI execution requires approval, request it only after the user has explicitly asked for `UI automation`, `UI automation testing`, or an equivalent UI-driving step.
- If the UI requires authentication or operator sign-in, ask the user for the needed input at run time and continue after receiving it.
- Never persist secrets in repo files, skill files, notes, or final answers.
- If the UI is launched, prefer the real application window over a headless-only flow when the purpose is repro or user-visible confirmation.
- If the affected scope includes UI and the UI validation did not run, explicitly state whether it was deferred because the user has not yet explicitly requested `UI automation` or `UI automation testing`, plus the exact next step required.
- When a UI flow is exercised, capture what was observed:
  - repro steps run
  - expected UI result
  - actual UI result
  - whether logs corroborated the visible behavior
- If build or test commands fail because of environment or sandbox restrictions, state that clearly and do not pretend the verification happened.

## Final answer format

Always output these sections in this order:

1. `Plan`
2. `MCP Calls`
3. `Result Summary`
4. Full `.clinerules` RCA block:
   - `## RCA: JIRA-XXXXX` or `## RCA: BUG-<bugnumber>` if no Jira key is available
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
5. `Verification Loop`
   - tests added or updated
   - commands run
   - builds attempted
   - run flows attempted
   - failures observed
   - corrections made
   - final pass/fail state
6. `UI Validation` if a UI component exists in the affected scope
   - flow executed
   - whether the app/session was launched visibly for user observation
   - credential/sign-in prompts that were required
   - observed behavior
   - blocker if UI validation could not be completed
   - screenshots or runtime evidence if available
7. Add a final `Step-by-Step Solution` section that is practical for the engineer:
   - reproduce
   - inspect
   - patch
   - run targeted tests
   - widen regression coverage
   - run visible UI verification only when the user explicitly asks for `UI automation`, `UI automation testing`, or equivalent wording after the fix
   - regression-test
   - communicate or land the fix

## Scope note

This skill does not modify either source instruction file. It exists only to enforce the pipeline that chains them together for future Simphony bug investigations.
