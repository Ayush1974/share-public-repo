const path = require("path");
const { APP_ROOT, DEFAULT_MODEL, PRODUCT_OPTIONS, SKILL_NAME } = require("./config");
const { getDefaultPrompt } = require("./file-utils");
const { isSyntheticIssueTitle, normalizeIssueTitleValue, normalizeTicketIdValue } = require("./parsing");
const { normalizeTicketSource } = require("./ticket-routing");

const EVIDENCE_FIRST_GUIDANCE = "Focus on comments, audit history, attachments, logs, and reproducible evidence before concluding RCA.";
const LEGACY_PRODUCT_GENERIC_GUIDANCE = "legacy-product-generic-guidance";
const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA specific to the selected Jira/BugDB ticket, its exact symptom, and the selected Oracle Restaurants product. Do not drift into generic product guidance.";
const FIX_FROM_RCA_GUIDANCE = "If the RCA identifies concrete files, make the follow-up fix step update those exact files and report verification.";
const LEGACY_PRODUCT_GENERIC_GUIDANCE_PATTERN = /keep the rca generic to the selected\b[\s\S]*?highlight subsystem-specific evidence\./i;
const PACKAGED_REFERENCES_ROOT = path.join(APP_ROOT, "references");
const MAX_PROMPT_DESCRIPTION_LENGTH = 4000;
const MAX_PROMPT_COMMENT_LENGTH = 1200;
const MAX_PROMPT_ATTACHMENT_EXCERPT_LENGTH = 1200;
const JIRA_HINT_FILE_PATTERN = /\b(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:cs|csproj|config|cpp|cmd|bat|ps1|java|js|json|md|sql|ts|tsx|txt|xml|xaml|yaml|yml)\b/g;

function slugifyProductKey(value, fallback = "product") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function buildCustomProduct(productLabel) {
  const family = String(productLabel || "").trim() || "Oracle Restaurants Product";
  return {
    key: "",
    label: family,
    family,
    defaultWorkspace: "",
    usesSkill: false,
    skillName: ""
  };
}

function findConfiguredProductByLabel(productLabel) {
  const normalizedLabel = String(productLabel || "").trim().toLowerCase();
  if (!normalizedLabel) {
    return null;
  }

  return Object.values(PRODUCT_OPTIONS).find((product) => (
    String(product.key || "").trim().toLowerCase() === normalizedLabel
    || String(product.label || "").trim().toLowerCase() === normalizedLabel
    || String(product.family || "").trim().toLowerCase() === normalizedLabel
  )) || null;
}

function getProductConfig(productKey, productLabel = "") {
  const normalizedKey = String(productKey || "").trim().toLowerCase();
  if (normalizedKey && PRODUCT_OPTIONS[normalizedKey]) {
    return PRODUCT_OPTIONS[normalizedKey];
  }

  const normalizedLabel = String(productLabel || productKey || "").trim();
  const configuredProduct = findConfiguredProductByLabel(normalizedLabel);
  if (configuredProduct) {
    return configuredProduct;
  }

  if (normalizedLabel) {
    return buildCustomProduct(normalizedLabel);
  }

  return Object.values(PRODUCT_OPTIONS)[0] || buildCustomProduct("Oracle Restaurants Product");
}

function inferGuidanceMode(extraInstructions) {
  const normalized = String(extraInstructions || "").trim();
  if (!normalized) {
    return "product-generic";
  }

  if (normalized.includes(EVIDENCE_FIRST_GUIDANCE)) {
    return "evidence-first";
  }

  if (normalized.includes(PRODUCT_GENERIC_GUIDANCE) || LEGACY_PRODUCT_GENERIC_GUIDANCE_PATTERN.test(normalized)) {
    return "product-generic";
  }

  if (normalized.includes(FIX_FROM_RCA_GUIDANCE)) {
    return "fix-from-rca";
  }

  return "custom";
}

function buildSessionDisplayName(request) {
  const ticketLabel = normalizeTicketIdValue(request.ticketId);
  const issueTitle = normalizeIssueTitleValue(request.issueTitle || request.derivedIssueTitle || "");
  if (issueTitle) {
    return ticketLabel ? `${ticketLabel} | ${issueTitle}` : issueTitle;
  }

  return ticketLabel || "Untitled";
}

function buildManualDescriptionTitle(description) {
  const firstContentLine = String(description || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "";
  return normalizeIssueTitleValue(firstContentLine.slice(0, 140));
}

function buildManualBugEvidence(description, issueTitle = "") {
  const normalizedDescription = String(description || "").trim();
  if (!normalizedDescription) {
    return null;
  }

  return {
    key: "User-provided bug description",
    summary: normalizeIssueTitleValue(issueTitle || buildManualDescriptionTitle(normalizedDescription)),
    issueType: "Bug",
    status: "User supplied",
    description: normalizedDescription,
    comments: [],
    attachments: []
  };
}

function normalizeRequest(payload) {
  const productConfig = getProductConfig(payload.product, payload.productLabel || payload.productFamily);
  const mode = String(payload.mode || "analyze").trim().toLowerCase() === "fix" ? "fix" : "analyze";
  const ticketId = normalizeTicketIdValue(payload.ticketId || payload.bugNumber || "");
  const bugDescription = String(payload.bugDescription || payload.description || "").trim();
  const manualDescriptionTitle = buildManualDescriptionTitle(bugDescription);
  const rawIssueTitle = payload.issueTitle || payload.ticketTitle || payload.title || manualDescriptionTitle || "";
  const issueTitle = isSyntheticIssueTitle(rawIssueTitle, ticketId)
    ? ""
    : normalizeIssueTitleValue(rawIssueTitle);
  const customProductLabel = String(payload.productLabel || payload.productFamily || "").trim();
  const productFamily = customProductLabel || productConfig.family;
  const requestedWorkspace = String(payload.workspace || productConfig.defaultWorkspace || "").trim();
  const version = String(payload.version || "").trim();
  const model = String(payload.model || DEFAULT_MODEL).trim();
  const extraInstructions = String(payload.extraInstructions || "").trim();
  const previousSessionId = String(payload.previousSessionId || "").trim();
  const continueSession = Boolean(payload.continueSession) && mode !== "fix";
  const guidanceMode = inferGuidanceMode(extraInstructions);
  const ticketSource = normalizeTicketSource(payload.ticketSource || payload.ticketType || "", ticketId);
  const requestedWorkspaceMode = String(payload.workspaceMode || "local").trim().toLowerCase();
  const workspaceMode = requestedWorkspaceMode === "shared-api" ? "shared-api" : "local";
  const isSharedWorkspace = requestedWorkspace.toLowerCase().startsWith("shared://");
  const workspace = workspaceMode === "shared-api"
    ? requestedWorkspace
    : isSharedWorkspace
      ? String(productConfig.defaultWorkspace || "").trim()
      : requestedWorkspace;
  const sharedWorkspaceApiBaseUrl = String(payload.sharedWorkspaceApiBaseUrl || "").trim();
  const sharedWorkspaceAccessToken = String(payload.sharedWorkspaceAccessToken || "").trim();
  const suppliedJiraEvidence = payload.jiraEvidence && typeof payload.jiraEvidence === "object"
    ? payload.jiraEvidence
    : null;
  const product = {
    ...productConfig,
    key: productConfig.key || slugifyProductKey(productFamily),
    label: customProductLabel || productConfig.label,
    family: productFamily
  };

  return {
    mode,
    product,
    ticketSource,
    ticketId,
    issueTitle,
    bugDescription,
    jiraEvidence: ticketSource === "description" ? buildManualBugEvidence(bugDescription, issueTitle) : suppliedJiraEvidence,
    workspace,
    version,
    model,
    extraInstructions,
    guidanceMode,
    workspaceMode,
    sharedWorkspaceApiBaseUrl,
    sharedWorkspaceAccessToken,
    previousSessionId,
    continueSession
  };
}

function truncatePromptText(value, maxLength) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function formatPromptList(title, values = []) {
  const normalizedValues = Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (!normalizedValues.length) {
    return "";
  }

  return `${title}: ${normalizedValues.join(", ")}`;
}

function formatJiraEvidenceForPrompt(jiraEvidence = null) {
  if (!jiraEvidence || typeof jiraEvidence !== "object") {
    return "";
  }

  const lines = [
    `Ticket key: ${jiraEvidence.key || ""}`,
    jiraEvidence.summary ? `Summary: ${jiraEvidence.summary}` : "",
    jiraEvidence.issueType ? `Issue type: ${jiraEvidence.issueType}` : "",
    jiraEvidence.status ? `Status: ${jiraEvidence.status}` : "",
    jiraEvidence.priority ? `Priority: ${jiraEvidence.priority}` : "",
    jiraEvidence.project ? `Project: ${jiraEvidence.project}` : "",
    jiraEvidence.assignee ? `Assignee: ${jiraEvidence.assignee}` : "",
    jiraEvidence.reporter ? `Reporter: ${jiraEvidence.reporter}` : "",
    jiraEvidence.created ? `Created: ${jiraEvidence.created}` : "",
    jiraEvidence.updated ? `Updated: ${jiraEvidence.updated}` : "",
    formatPromptList("Components", jiraEvidence.components),
    formatPromptList("Labels", jiraEvidence.labels),
    formatPromptList("Fix versions", jiraEvidence.fixVersions),
    formatPromptList("Affected versions", jiraEvidence.affectsVersions)
  ].filter(Boolean);

  const description = truncatePromptText(jiraEvidence.description || "", MAX_PROMPT_DESCRIPTION_LENGTH);
  if (description) {
    lines.push("", "Description:", description);
  }

  const comments = Array.isArray(jiraEvidence.comments) ? jiraEvidence.comments : [];
  if (comments.length) {
    lines.push("", "Comments:");
    for (const comment of comments) {
      const headerParts = [
        String(comment?.author || "").trim(),
        String(comment?.created || "").trim()
      ].filter(Boolean);
      const body = truncatePromptText(comment?.body || "", MAX_PROMPT_COMMENT_LENGTH);
      lines.push(`- ${headerParts.join(" | ") || "Comment"}`);
      if (body) {
        lines.push(body);
      }
    }
  }

  const attachments = Array.isArray(jiraEvidence.attachments) ? jiraEvidence.attachments : [];
  if (attachments.length) {
    lines.push("", "Attachments:");
    for (const attachment of attachments) {
      const parts = [
        String(attachment?.filename || "").trim(),
        String(attachment?.mimeType || "").trim(),
        Number(attachment?.size || 0) ? `${attachment.size} bytes` : ""
      ].filter(Boolean);
      lines.push(`- ${parts.join(" | ")}`);
      const excerpt = truncatePromptText(attachment?.excerpt || "", MAX_PROMPT_ATTACHMENT_EXCERPT_LENGTH);
      if (excerpt) {
        lines.push(excerpt);
      }
    }
  }

  return lines.join("\n");
}

function collectJiraEvidenceText(jiraEvidence = null) {
  if (!jiraEvidence || typeof jiraEvidence !== "object") {
    return "";
  }

  const parts = [
    jiraEvidence.summary,
    jiraEvidence.description,
    ...(Array.isArray(jiraEvidence.comments)
      ? jiraEvidence.comments.map((comment) => comment?.body || "")
      : []),
    ...(Array.isArray(jiraEvidence.attachments)
      ? jiraEvidence.attachments.flatMap((attachment) => [
        attachment?.filename || "",
        attachment?.excerpt || ""
      ])
      : [])
  ];

  return parts
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n");
}

function extractJiraEvidenceFileHints(jiraEvidence = null) {
  const matches = collectJiraEvidenceText(jiraEvidence).match(JIRA_HINT_FILE_PATTERN) || [];
  return Array.from(new Set(
    matches
      .map((value) => String(value || "").trim().replace(/\\/g, "/"))
      .filter(Boolean)
  )).slice(0, 8);
}

function buildJiraInvestigationHints(request) {
  const jiraEvidence = request?.jiraEvidence;
  if (!jiraEvidence || typeof jiraEvidence !== "object") {
    return [];
  }

  const workspace = String(request?.workspace || "").trim();
  const productFamily = String(request?.product?.family || "").trim();
  const evidenceText = collectJiraEvidenceText(jiraEvidence).toLowerCase();
  const fileHints = extractJiraEvidenceFileHints(jiraEvidence);
  const hasPriorInvestigation = Boolean(
    evidenceText.includes("rca analysis")
    || evidenceText.includes("index:")
    || fileHints.length
    || (Array.isArray(jiraEvidence.attachments)
      && jiraEvidence.attachments.some((attachment) => String(attachment?.filename || "").trim().toLowerCase().endsWith(".patch")))
  );
  const hints = [];

  if (productFamily) {
    hints.push(
      `The UI product label is \`${productFamily}\`, but that label may be broader than the actual failing subsystem. Do not start by searching the repo for the literal product label.`
    );
  }

  if (
    workspace.toLowerCase().includes("simphony")
    || /seat check|guest check|check journal|automatic discount|printing|tendermedia|guestcheck|ops\/ops|poscore/.test(evidenceText)
  ) {
    hints.push(
      "The Jira evidence points to a Simphony OPS printing and discount code path. Classify the subsystem from the Jira symptom and workspace tree, not from the generic launcher label."
    );
  }

  if (hasPriorInvestigation) {
    hints.push(
      "Jira already contains prior investigation evidence. Reconcile that evidence against the selected workspace before doing any broad top-level repo search."
    );
  }

  if (fileHints.length) {
    hints.push(`Start with these Jira-evidenced files before widening the search: ${fileHints.join(", ")}.`);
    hints.push("Only widen the search if those files are absent in the selected workspace or the verified call chain clearly leaves them.");
  }

  hints.push(
    "Do not begin with repo-wide searches for the ticket key, the literal UI product label, or generic workspace terms unless the Jira evidence explicitly requires it."
  );

  return hints;
}

function buildAnalysisPrompt(request, previousSession) {
  const ticketSourceLabel = request.ticketSource === "jira"
    ? "Jira"
    : request.ticketSource === "description"
      ? "Bug Description"
      : "BugDB";
  const prefix = [
    `Product family: ${request.product.family}`,
    request.version ? `Product version: ${request.version}` : "",
    `Ticket source: ${ticketSourceLabel}`,
    "Workflow:",
    "1. source code select for products",
    "2. jira ticket id/ bug db ID",
    "3. stdout RCA",
    "4. If a later dedicated fix step is explicitly requested on a writable local checkout, scope it from the RCA",
    "Analyze only: gather evidence, explain the root cause, and describe the most likely next fix step without implementing it.",
    "Reserve all code edits for the dedicated fix step.",
    "This RCA run is strictly analysis only.",
    "RCA-only output must include concise code snippets and a proposed git diff in the dedicated RCA sections `Code Evidence` and `Proposed Diff` whenever the source evidence is sufficient to identify a concrete fix location.",
    "The `Proposed Diff` section is mandatory for Jira-backed and bug-description-backed RCA runs. It must contain a fenced `diff` block with the most relevant proposed code changes, not just prose.",
    "If the source evidence is insufficient to propose a safe code diff, still include `Proposed Diff` and explicitly state the exact missing evidence/blocker instead of omitting the section.",
    "Any diff shown in RCA must be clearly proposed only. Do not claim it was applied, verified, or committed in the RCA-only run.",
    "Do not run builds, tests, lint steps, validation commands, verification loops, or any other execution meant to prove a fix during analyze or continuation runs.",
    "Do not claim that a build, test, or validation step was executed in Evidence-first or Product-generic RCA runs.",
    "Do not launch any UI, browser, desktop app, or UI automation flow during analyze or continuation runs.",
    "UI driving is allowed only when the user's current input after the fix explicitly says `UI automation`, `UI automation testing`, or another unmistakably equivalent UI-driving request.",
    "If UI validation would normally be useful, describe the pending UI step in the output and wait for that explicit UI automation request in a later input.",
    "Do not include `Verification Loop` or `UI Validation` as completed work in RCA-only runs.",
    "Do not mix Jira MCP evidence and BugDB reference guidance. Keep the ticket source path strict for the whole run.",
    "Stay anchored to the exact bug or Jira ticket. If you cannot tie the analysis back to that ticket's symptom and evidence, stop and report the missing evidence instead of giving generic product guidance.",
    "The UI product label can be broader than the actual subsystem. Do not choose the code path by searching for the literal product label; classify the subsystem from the ticket symptom, evidence, and selected workspace tree.",
    "Do not return a generic Oracle Restaurants overview or broad subsystem guess. The RCA must stay ticket-specific from start to finish.",
    "Return the final answer using the exact section order required by the RCA workflow."
  ];

  if (request.product.usesSkill) {
    prefix.unshift(getDefaultPrompt(), `Use ${request.product.skillName || SKILL_NAME}.`);
    prefix.splice(
      prefix.length - 1,
      0,
      "For skill-backed runs, use the bundled workflow references as the primary BugDB workflow path.",
      "Bundled supporting references are `references/BUGINTWFLOW.md`, `references/.clinerules`, and `references/generate-memory-bank-FINAL.md` when present in the run workspace.",
      "Use `generate-memory-bank-FINAL.md` as the supporting repo-intelligence guide to narrow searches, keep evidence focused, and avoid blind broad scans.",
      "Do not let the memory-bank guide override bundled BugDB workflow guidance, shared-workspace restrictions, Jira facts, or `.clinerules` fix-completeness checks."
    );
  } else {
    prefix.unshift(
      `Analyze an ${request.product.family} code issue end-to-end.`,
      "Use the selected source code as the basis for the RCA, the proposed fix scope, and the verification notes without changing files in this analyze run."
    );
  }

  if (request.workspaceMode === "shared-api") {
    prefix.push(
      "The selected source is hosted on a remote shared workspace server. The actual product tree is not mounted locally in this session.",
      "Treat the shared workspace as read-only RCA evidence.",
      "Do not create, stage, or write fix artifacts, patches, bundles, or handoff files in any `shared://` workspace during RCA.",
      "Do not inspect or use any local product checkout such as `C:\\Simphony\\trunk\\Extensible2` as fallback source evidence for a `shared://` run.",
      "The only allowed local files in a `shared://` run are the packaged workflow/reference documents that ship with this app.",
      "Those packaged references are expected under `./references`, including `BUGINTWFLOW.md`, `.clinerules`, and `generate-memory-bank-FINAL.md` when present.",
      "Use the helper script in the current working directory for all source inspection before concluding RCA.",
      "If the shared-workspace helper cannot browse, search, or read the needed source files, stop and report the shared-workspace blocker instead of switching to a local checkout.",
      "If the helper is blocked by policy, shell restrictions, or tool permissions, output only the blocker, the failed helper command, and the exact next operator action needed. Do not continue with a generic or reasoned RCA.",
      "Preferred commands:",
      "1. `node shared-workspace-client.js browse`",
      "2. `node shared-workspace-client.js search --pattern \"YourSymbol\" --path relative/folder --glob *.cs`",
      "3. `node shared-workspace-client.js read --path relative/file --start 120 --lines 80`",
      "Use those API-backed results as your evidence path instead of assuming local filesystem access to the product checkout."
    );
  }

  if (request.ticketSource === "jira") {
    prefix.push(
      "This ticket is Jira-backed. Use the prefetched Jira REST API evidence in this prompt as the required factual Jira source for this run.",
      "Do not try Jira MCP in this run. The server already fetched the Jira ticket details directly before starting Codex.",
      "For Jira runs, use packaged references only as workflow guidance. Do not use the references folder as a substitute for Jira ticket facts.",
      "If the prefetched Jira evidence is incomplete, call that out explicitly instead of inventing missing ticket facts."
    );

    const jiraEvidenceBlock = formatJiraEvidenceForPrompt(request.jiraEvidence);
    if (jiraEvidenceBlock) {
      prefix.push(`Prefetched Jira Evidence:\n${jiraEvidenceBlock}`);
    }

    const jiraHints = buildJiraInvestigationHints(request);
    if (jiraHints.length) {
      prefix.push(`Jira Investigation Hints:\n${jiraHints.map((hint) => `- ${hint}`).join("\n")}`);
    }
  } else if (request.ticketSource === "description") {
    prefix.push(
      "This ticket evidence was pasted directly by the operator as a bug description.",
      "Do not call Jira REST, Jira MCP, BugDB, or any external ticket lookup for ticket facts in this run.",
      "Use the supplied bug description in this prompt as the required factual ticket source.",
      "If the supplied description lacks key facts, call that out explicitly instead of inventing missing ticket details."
    );

    const suppliedEvidenceBlock = formatJiraEvidenceForPrompt(request.jiraEvidence);
    if (suppliedEvidenceBlock) {
      prefix.push(`Supplied Bug Description Evidence:\n${suppliedEvidenceBlock}`);
    }

    const descriptionHints = buildJiraInvestigationHints(request);
    if (descriptionHints.length) {
      prefix.push(`Bug Description Investigation Hints:\n${descriptionHints.map((hint) => `- ${hint}`).join("\n")}`);
    }
  } else {
    prefix.push(
      `This ticket is BugDB-backed. Use the packaged references folder as the BugDB workflow path: \`${PACKAGED_REFERENCES_ROOT}\`.`,
      "Within the run workspace, prefer `./references/BUGINTWFLOW.md`, `./references/.clinerules`, and `./references/generate-memory-bank-FINAL.md` when present.",
      "Do not use Jira MCP as BugDB evidence. If BugDB facts are unavailable beyond the packaged workflow references, say that explicitly instead of inventing Jira-backed details."
    );
  }

  if (request.ticketId) {
    prefix.push(`Jira Ticket ID / BugDB ID: ${request.ticketId}`);
  } else if (request.ticketSource === "description") {
    prefix.push("Jira Ticket ID / BugDB ID: not provided; use the supplied bug description as the ticket evidence.");
  } else {
    prefix.push("If the request is generic, ask for the Jira Ticket ID / BugDB ID first.");
  }

  if (request.issueTitle) {
    prefix.push(`Issue title: ${request.issueTitle}`);
  } else {
    prefix.push(
      "Operator issue title: not provided or placeholder-only.",
      "Fetch the exact bug title from Jira when available, or use the operator-provided title. If no live ticket system is available, state that the exact bug title was not retrievable and continue with the supplied identifier plus local evidence."
    );
  }

  if (request.continueSession && previousSession) {
    prefix.push(
      "Continue the previous investigation instead of restarting from zero.",
      "Incorporate the updated operator instructions, preserve the proven RCA evidence, and refine the next steps or proposed fix scope only where new information requires it.",
      "Continuation runs stay in analysis mode until the dedicated fix step starts.",
      `Previous session ID: ${previousSession.id}`,
      previousSession.output?.finalMessage
        ? `Previous final output:\n${previousSession.output.finalMessage}`
        : "No previous final output was available."
    );
  }

  if (request.guidanceMode === "evidence-first") {
    prefix.push(
      "Treat the main RCA block as an Evidence report.",
      "The Evidence report must only use these headings when evidence exists: Comments, Comment Evidence, Audit History, Attachments, Attachment Evidence, Log Evidence, Reproducible Evidence, Confidence, Remaining Uncertainty.",
      "Do not include Subsystem, Investigation Tier, Culprit, Call Chain, Root Cause Code, Code Evidence, Why It Fails, Complete Fix, Fix Explanation, Proposed Diff, All Affected Files, Verification Loop, UI Validation, or any file-change instructions in the Evidence report.",
      "Do not edit workspace files, do not propose patch application steps, and do not turn this run into a fix-validation pass."
    );
  }

  if (request.guidanceMode === "product-generic") {
    prefix.push(
      "Treat the main RCA block as the Root Cause Report driven by `.clinerules`.",
      "Do not stop after `Plan`, `MCP Calls`, or `Result Summary`. You must include the full `## RCA:` block before finishing.",
      "Return the full `.clinerules` final structure in this order: `Plan`, `MCP Calls`, `Result Summary`, `## RCA: ...`, `Verification Loop`, `UI Validation`, `Step-by-Step Solution`.",
      "For RCA-only runs, `Verification Loop` and `UI Validation` must still be present, but they must clearly say `Not executed in this RCA-only run` and list the exact blocker or next validation step instead of claiming verification already happened.",
      "Use this exact RCA block shape and keep the headings verbatim: `## RCA: ...`, `Comments`, `Comment Evidence`, `Audit History`, `Attachment Evidence`, `Attachments`, `Reproducible Evidence`, `Subsystem`, `Investigation Tier`, `Culprit`, `Call Chain`, `Root Cause Code`, `Code Evidence`, `Log Evidence`, `Why It Fails`, `Complete Fix`, `Fix Explanation`, `Proposed Diff`, `All Affected Files`, `Confidence`, `Remaining Uncertainty`.",
      "When `Code Evidence` is present, include short fenced code snippets with file paths or line anchors when available.",
      "`Proposed Diff` is required. Include a concise fenced `diff` block that shows only the most relevant proposed hunks for the RCA. If a safe diff cannot be proposed, keep the section and state the blocker.",
      "Explain subsystem-specific evidence and product behavior clearly, but keep the run strictly RCA-only with no build or test execution.",
      "Reference the ticket ID and the real bug title in the report so the RCA stays visibly tied to the requested bug.",
      "If the available data only supports LOW confidence, explicitly explain what evidence is missing and stop there instead of drifting into unrelated generic RCA text.",
      "Do not edit workspace files, do not apply fixes, and do not claim that any workspace fix was implemented in this Product-generic RCA run."
    );
  }

  if (request.extraInstructions) {
    prefix.push(`Additional instructions:\n${request.extraInstructions}`);
  }

  return prefix.join("\n\n");
}

function buildFixPrompt(request, previousSession) {
  if (request.workspaceMode === "shared-api") {
    return [
      `Product family: ${request.product.family}`,
      "Fix mode is not allowed for shared API workspaces.",
      "Stop and explain that a writable local checkout is required before implementing code changes."
    ].join("\n\n");
  }

  const previousMessage = previousSession?.output?.finalMessage || "";
  const previousFiles = previousSession?.parsed?.rcaFields?.["All Affected Files"] || "";
  const priorTicketId = previousSession?.request?.ticketId || request.ticketId;
  const priorIssueTitle = previousSession?.request?.issueTitle || previousSession?.request?.derivedIssueTitle || request.issueTitle;
  const priorVersion = previousSession?.request?.version || request.version;
  const ticketSource = previousSession?.request?.ticketSource || request.ticketSource || normalizeTicketSource("", priorTicketId);
  const ticketSourceLabel = ticketSource === "jira"
    ? "Jira"
    : ticketSource === "description"
      ? "Bug Description"
      : "BugDB";
  const ticketFactGuidance = ticketSource === "jira"
    ? "For Jira-backed fixes, keep the prefetched Jira REST API evidence from the RCA as the ticket facts source and use packaged references only as workflow guidance."
    : ticketSource === "description"
      ? "For bug-description-backed fixes, keep the pasted description captured in the RCA as the ticket facts source and do not substitute Jira or BugDB facts."
      : `For BugDB-backed fixes, keep the packaged workflow references under \`${PACKAGED_REFERENCES_ROOT}\` as the BugDB guidance path and do not substitute Jira MCP facts.`;

  return [
    `Product family: ${request.product.family}`,
    priorVersion ? `Product version: ${priorVersion}` : "",
    `Ticket source: ${ticketSourceLabel}`,
    "Step 4 only: Fix the files as in RCA step.",
    "Use the previous RCA output as the source of truth for the implementation scope.",
    "When bundled supporting references are present in `references/`, continue to use `BUGINTWFLOW.md`, `.clinerules`, and `generate-memory-bank-FINAL.md` as supporting guidance.",
    "Use `generate-memory-bank-FINAL.md` as the memory-bank guide to keep the implementation search focused, but do not let it override the established RCA evidence or required fix scope.",
    "Update the affected files in the selected source code and then report verification results.",
    "After making the fix, you may run the relevant build and targeted automated tests.",
    "Do not perform UI automation, launch UI validation flows, open browsers, or drive desktop UI after the fix unless the user's current input explicitly says `UI automation`, `UI automation testing`, or another unmistakably equivalent UI-driving request.",
    "If UI validation is still pending, state that it was intentionally deferred because no explicit UI automation request was given in the current input.",
    ticketFactGuidance,
    `Jira Ticket ID / BugDB ID: ${priorTicketId || "Not provided"}`,
    priorIssueTitle ? `Issue title: ${priorIssueTitle}` : "",
    previousFiles ? `RCA All Affected Files:\n${previousFiles}` : "",
    previousMessage ? `Previous RCA Output:\n${previousMessage}` : "If no previous RCA is available, stop and say that RCA must be generated first.",
    request.extraInstructions ? `Additional instructions:\n${request.extraInstructions}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildSessionPrompt(request, previousSession) {
  return request.mode === "fix" ? buildFixPrompt(request, previousSession) : buildAnalysisPrompt(request, previousSession);
}

module.exports = {
  EVIDENCE_FIRST_GUIDANCE,
  FIX_FROM_RCA_GUIDANCE,
  LEGACY_PRODUCT_GENERIC_GUIDANCE,
  PRODUCT_GENERIC_GUIDANCE,
  buildAnalysisPrompt,
  buildFixPrompt,
  buildSessionDisplayName,
  buildSessionPrompt,
  formatJiraEvidenceForPrompt,
  getProductConfig,
  inferGuidanceMode,
  normalizeRequest
};
