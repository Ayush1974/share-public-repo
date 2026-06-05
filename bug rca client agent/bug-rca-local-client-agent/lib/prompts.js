const { DEFAULT_MODEL, PRODUCT_OPTIONS, SKILL_NAME } = require("./config");
const { getDefaultPrompt } = require("./file-utils");
const { normalizeIssueTitleValue, normalizeTicketIdValue } = require("./parsing");
const { formatBugDbEvidence } = require("./bugdb-api");

const EVIDENCE_FIRST_GUIDANCE = "Focus on comments, audit history, attachments, logs, and reproducible evidence before concluding RCA.";
const LEGACY_PRODUCT_GENERIC_GUIDANCE = "Keep the RCA generic to the selected Oracle Restaurants product and highlight subsystem-specific evidence.";
const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA specific to the selected Jira/BugDB ticket, its exact symptom, and the selected Oracle Restaurants product. Do not drift into generic product guidance.";
const FIX_FROM_RCA_GUIDANCE = "If the RCA identifies concrete files, make the follow-up fix step update those exact files and report verification.";
const LEGACY_PRODUCT_GENERIC_GUIDANCE_PATTERN = /keep the rca generic to the selected\b[\s\S]*?highlight subsystem-specific evidence\./i;
const MAX_PROMPT_DESCRIPTION_LENGTH = 4000;
const MAX_PROMPT_COMMENT_LENGTH = 1200;
const MAX_PROMPT_ATTACHMENT_EXCERPT_LENGTH = 1200;

function normalizeTicketSource(value, ticketId = "") {
  const explicit = String(value || "").trim().toLowerCase();
  if (explicit === "jira" || explicit === "bugdb" || explicit === "description") {
    return explicit;
  }

  return /^[A-Z][A-Z0-9]+-\d+$/i.test(String(ticketId || "").trim()) ? "jira" : "bugdb";
}

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

  if (normalized.includes(PRODUCT_GENERIC_GUIDANCE) || normalized.includes(LEGACY_PRODUCT_GENERIC_GUIDANCE) || LEGACY_PRODUCT_GENERIC_GUIDANCE_PATTERN.test(normalized)) {
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

  if (request.ticketSource === "description") {
    return "Bug Description";
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
  const suppliedJiraEvidence = payload.jiraEvidence && typeof payload.jiraEvidence === "object" ? payload.jiraEvidence : null;
  const suppliedBugDbEvidence = payload.bugDbEvidence && typeof payload.bugDbEvidence === "object" ? payload.bugDbEvidence : null;
  const issueTitle = normalizeIssueTitleValue(
    payload.issueTitle
    || payload.ticketTitle
    || payload.title
    || suppliedJiraEvidence?.summary
    || suppliedBugDbEvidence?.synopsis
    || manualDescriptionTitle
    || ""
  );
  const customProductLabel = String(payload.productLabel || payload.productFamily || "").trim();
  const productFamily = customProductLabel || productConfig.family;
  const workspace = String(payload.workspace || productConfig.defaultWorkspace || "").trim();
  const version = String(payload.version || "").trim();
  const model = String(payload.model || DEFAULT_MODEL).trim();
  const extraInstructions = String(payload.extraInstructions || "").trim();
  const previousSessionId = String(payload.previousSessionId || "").trim();
  const continueSession = Boolean(payload.continueSession) && mode !== "fix";
  const guidanceMode = inferGuidanceMode(extraInstructions);
  const ticketSource = normalizeTicketSource(payload.ticketSource || payload.ticketType || "", ticketId);
  const isSharedWorkspace = workspace.toLowerCase().startsWith("shared://");
  const workspaceMode = isSharedWorkspace
    ? "shared-api"
    : String(payload.workspaceMode || "local").trim().toLowerCase() === "shared-api"
      ? "shared-api"
      : "local";
  const sharedWorkspaceApiBaseUrl = String(payload.sharedWorkspaceApiBaseUrl || "").trim();
  const sharedWorkspaceAccessToken = String(payload.sharedWorkspaceAccessToken || "").trim();
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
    bugDbEvidence: ticketSource === "bugdb" ? suppliedBugDbEvidence : null,
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
    jiraEvidence.project ? `Project: ${jiraEvidence.project}` : ""
  ].filter(Boolean);

  const description = truncatePromptText(jiraEvidence.description || "", MAX_PROMPT_DESCRIPTION_LENGTH);
  if (description) {
    lines.push("", "Description:", description);
  }

  const comments = Array.isArray(jiraEvidence.comments) ? jiraEvidence.comments : [];
  if (comments.length) {
    lines.push("", "Comments:");
    for (const comment of comments) {
      const author = String(comment?.author || "Unknown").trim();
      const created = String(comment?.created || "").trim();
      const body = truncatePromptText(comment?.body || "", MAX_PROMPT_COMMENT_LENGTH);
      if (body) {
        lines.push(`- ${author}${created ? ` at ${created}` : ""}: ${body}`);
      }
    }
  }

  const attachments = Array.isArray(jiraEvidence.attachments) ? jiraEvidence.attachments : [];
  if (attachments.length) {
    lines.push("", "Attachments:");
    for (const attachment of attachments) {
      const filename = String(attachment?.filename || "").trim();
      const excerpt = truncatePromptText(attachment?.excerpt || "", MAX_PROMPT_ATTACHMENT_EXCERPT_LENGTH);
      lines.push(`- ${filename || "attachment"}${excerpt ? `: ${excerpt}` : ""}`);
    }
  }

  return lines.join("\n").trim();
}

function buildAnalysisPrompt(request, previousSession) {
  const prefix = [
    `Product family: ${request.product.family}`,
    request.version ? `Product version: ${request.version}` : "",
    "Workflow:",
    "1. source code select for products",
    "2. jira ticket id/ bug db ID",
    "3. stdout RCA",
    "4. If a later dedicated fix step is explicitly requested on a writable local checkout, scope it from the RCA",
    "Analyze only: gather evidence, explain the root cause, and describe the most likely next fix step without implementing it.",
    "Reserve all code edits for the dedicated fix step.",
    "This RCA run is strictly analysis only.",
    "RCA-only output may include concise code snippets and a proposed git diff, but only inside dedicated RCA sections such as `Code Evidence` and `Proposed Diff`.",
    "Any diff shown in RCA must be clearly proposed only. Do not claim it was applied, verified, or committed in the RCA-only run.",
    "Do not run builds, tests, lint steps, validation commands, verification loops, or any other execution meant to prove a fix during analyze or continuation runs.",
    "Do not claim that a build, test, or validation step was executed in Evidence-first or Product-generic RCA runs.",
    "Do not launch any UI, browser, desktop app, or UI automation flow during analyze or continuation runs.",
    "UI driving is allowed only when the user's current input after the fix explicitly says `UI automation`, `UI automation testing`, or another unmistakably equivalent UI-driving request.",
    "If UI validation would normally be useful, describe the pending UI step in the output and wait for that explicit UI automation request in a later input.",
    "Do not include `Verification Loop` or `UI Validation` as completed work in RCA-only runs.",
    "Do not expect a BugDB MCP server in this package. Use the bundled BugDB workflow references before concluding.",
    "If another configured MCP such as Jira is unavailable, failing, or returns incomplete data, report that separately instead of treating it as BugDB evidence.",
    "Return the final answer using the exact section order required by the RCA workflow."
  ];

  if (request.product.usesSkill) {
    prefix.unshift(getDefaultPrompt(), `Use ${request.product.skillName || SKILL_NAME}.`);
    prefix.splice(prefix.length - 1, 0, "For skill-backed runs, use the bundled workflow references as the primary BugDB workflow path.");
    prefix.splice(
      prefix.length - 1,
      0,
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
      "Preferred commands:",
      "1. `node shared-workspace-client.js browse`",
      "2. `node shared-workspace-client.js search --pattern \"YourSymbol\" --path relative/folder --glob *.cs`",
      "3. `node shared-workspace-client.js read --path relative/file --start 120 --lines 80`",
      "Use those API-backed results as your evidence path instead of assuming local filesystem access to the product checkout."
    );
  }

  const ticketSourceLabel = request.ticketSource === "jira"
    ? "Jira"
    : request.ticketSource === "description"
      ? "Bug Description"
      : "BugDB";
  prefix.push(`Ticket source: ${ticketSourceLabel}`);

  if (request.ticketSource === "description") {
    prefix.push(
      "This ticket evidence was pasted directly by the operator as a bug description.",
      "Use the supplied bug description in this prompt as the required factual ticket source.",
      "If the supplied description lacks key facts, call that out explicitly instead of inventing missing ticket details."
    );
    const descriptionEvidence = formatJiraEvidenceForPrompt(request.jiraEvidence);
    if (descriptionEvidence) {
      prefix.push(`Bug Description Evidence:\n${descriptionEvidence}`);
    }
  } else if (request.ticketSource === "jira") {
    prefix.push(
      "Use the prefetched Jira evidence in this prompt as the required ticket facts source.",
      "If the Jira evidence is incomplete, call that out explicitly instead of inventing missing ticket details."
    );
    const jiraEvidenceBlock = formatJiraEvidenceForPrompt(request.jiraEvidence);
    if (jiraEvidenceBlock) {
      prefix.push(`Prefetched Jira Evidence:\n${jiraEvidenceBlock}`);
    }
  } else if (request.ticketId) {
    if (request.bugDbEvidence) {
      prefix.push(
        "This ticket is BugDB-backed. Use the prefetched BugDB REST API evidence in this prompt as the required factual source for this run.",
        "Do not try BugDB MCP or Jira MCP in this run. The local client agent already fetched the BugDB bug details directly before starting Codex.",
        "If the prefetched BugDB evidence is incomplete, call that out explicitly instead of inventing missing bug facts."
      );
      const bugDbEvidenceBlock = formatBugDbEvidence(request.bugDbEvidence);
      if (bugDbEvidenceBlock) {
        prefix.push(`Prefetched BugDB Evidence:\n${bugDbEvidenceBlock}`);
      }
    } else {
      prefix.push(`Jira Ticket ID / BugDB ID: ${request.ticketId}`);
    }
  } else {
    prefix.push("If the request is generic, ask for the Jira Ticket ID / BugDB ID first.");
  }

  if (request.issueTitle) {
    prefix.push(`Issue title: ${request.issueTitle}`);
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
      "Use this exact RCA block shape and keep the headings verbatim when evidence exists: `## RCA: ...`, `Comments`, `Comment Evidence`, `Audit History`, `Attachment Evidence`, `Attachments`, `Reproducible Evidence`, `Subsystem`, `Investigation Tier`, `Culprit`, `Call Chain`, `Root Cause Code`, `Code Evidence`, `Log Evidence`, `Why It Fails`, `Complete Fix`, `Fix Explanation`, `Proposed Diff`, `All Affected Files`, `Confidence`, `Remaining Uncertainty`.",
      "When `Code Evidence` is present, include short fenced code snippets with file paths or line anchors when available.",
      "When `Proposed Diff` is present, include a concise fenced `diff` block that shows only the most relevant proposed hunks for the RCA.",
      "Explain subsystem-specific evidence and product behavior clearly, but keep the run strictly RCA-only with no build or test execution.",
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
  const priorTicketSource = previousSession?.request?.ticketSource || request.ticketSource || normalizeTicketSource("", priorTicketId);
  const priorIssueTitle = previousSession?.request?.issueTitle || previousSession?.request?.derivedIssueTitle || request.issueTitle;
  const priorVersion = previousSession?.request?.version || request.version;
  const ticketFactGuidance = priorTicketSource === "description"
    ? "For bug-description-backed fixes, keep the pasted description captured in the RCA as the ticket facts source and do not substitute Jira or BugDB facts."
    : "Use the same ticket facts source as the prior RCA.";

  return [
    `Product family: ${request.product.family}`,
    priorVersion ? `Product version: ${priorVersion}` : "",
    "Step 4 only: Fix the files as in RCA step.",
    "Use the previous RCA output as the source of truth for the implementation scope.",
    "When bundled supporting references are present in `references/`, continue to use `BUGINTWFLOW.md`, `.clinerules`, and `generate-memory-bank-FINAL.md` as supporting guidance.",
    "Use `generate-memory-bank-FINAL.md` as the memory-bank guide to keep the implementation search focused, but do not let it override the established RCA evidence or required fix scope.",
    "Update the affected files in the selected source code and then report verification results.",
    "After making the fix, you may run the relevant build and targeted automated tests.",
    "Do not perform UI automation, launch UI validation flows, open browsers, or drive desktop UI after the fix unless the user's current input explicitly says `UI automation`, `UI automation testing`, or another unmistakably equivalent UI-driving request.",
    "If UI validation is still pending, state that it was intentionally deferred because no explicit UI automation request was given in the current input.",
    "Do not expect a BugDB MCP server in this package. Continue to use the bundled BugDB workflow references during the fix step.",
    "If another configured MCP such as Jira is unavailable, failing, or returns incomplete data, report that separately instead of treating it as BugDB evidence.",
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
  PRODUCT_GENERIC_GUIDANCE,
  buildAnalysisPrompt,
  buildFixPrompt,
  buildSessionDisplayName,
  buildSessionPrompt,
  getProductConfig,
  inferGuidanceMode,
  normalizeRequest
};
