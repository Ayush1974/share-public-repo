const fs = require("fs");
const path = require("path");

const { ARTIFACT_FILES, SESSIONS_DIR } = require("./config");
const {
  countListItems,
  parseAffectedFiles,
  parseNamedSections,
  parseRcaFields
} = require("./parsing");
const { buildSessionDisplayName, getProductConfig, inferGuidanceMode } = require("./prompts");
const {
  normalizeReportText,
  readFileIfPresent,
  readJsonIfPresent,
  sanitizePersistedOutputText,
  sanitizeLegacyPromptText,
  selectPreferredFinalMessage,
  writeJson
} = require("./file-utils");

function slugifySessionIdPart(value, maxLength = 48) {
  const compact = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!compact) {
    return "";
  }

  const trimmed = compact.slice(0, maxLength).replace(/-+$/g, "");
  return trimmed || "";
}

function buildRelevantTitleSlug(request) {
  const source = String(request?.issueTitle || request?.derivedIssueTitle || request?.ticketId || "session").trim();
  const tokens = (source
    .toLowerCase()
    .match(/[a-z]+-\d+|[a-z0-9]+/g) || [])
    .filter(Boolean);

  if (!tokens.length) {
    return "session";
  }

  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "for",
    "from",
    "of",
    "to",
    "in",
    "on",
    "at",
    "by",
    "with",
    "when",
    "while",
    "into",
    "onto",
    "that",
    "this",
    "there",
    "is",
    "are",
    "was",
    "were",
    "error",
    "displayed",
    "issue"
  ]);

  const preferredTokens = [];
  for (const token of tokens) {
    const isTicketLike = /^[a-z]+-\d+$/i.test(token);
    if (isTicketLike || !stopWords.has(token)) {
      preferredTokens.push(token);
    }

    if (preferredTokens.length >= 4) {
      break;
    }
  }

  const chosenTokens = preferredTokens.length ? preferredTokens : tokens.slice(0, 4);
  return slugifySessionIdPart(chosenTokens.join("-"), 32) || "session";
}

function createSessionId(request) {
  const ticketSlug = slugifySessionIdPart(request?.ticketId || "", 20);
  const titleTokens = buildRelevantTitleSlug(request)
    .split("-")
    .filter(Boolean)
    .slice(0, ticketSlug ? 4 : 5);

  const baseId = [ticketSlug, ...titleTokens]
    .filter(Boolean)
    .slice(0, 5)
    .join("-") || "session";

  let sessionId = baseId;
  let duplicateIndex = 2;
  while (fs.existsSync(sessionFilePath(sessionId))) {
    sessionId = `${baseId}-${duplicateIndex}`;
    duplicateIndex += 1;
  }

  return sessionId;
}

function sessionFilePath(sessionId) {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

function summarizeSession(session) {
  const sections = session?.parsed?.sections || {};
  const rcaFields = session?.parsed?.rcaFields || {};
  const affectedFiles = parseAffectedFiles(rcaFields["All Affected Files"]);
  const previewSource = String(sections["Result Summary"] || sections.RCA || session?.output?.finalMessage || "").trim();
  const preview = previewSource ? previewSource.split(/\r?\n/).find(Boolean) || previewSource : "";

  return {
    displayName: session?.request?.displayName || session?.summary?.displayName || session?.id || "",
    product: session?.request?.product || "",
    mode: session?.request?.mode || "",
    ticketId: session?.request?.ticketId || "",
    version: session?.request?.version || "",
    status: session?.status || "unknown",
    confidence: rcaFields.Confidence || "",
    subsystem: rcaFields.Subsystem || "",
    affectedFiles,
    affectedFileCount: affectedFiles.length,
    mcpCallCount: countListItems(sections["MCP Calls"]),
    sectionCount: Object.values(sections).filter(Boolean).length,
    preview: preview.slice(0, 220)
  };
}

function saveSession(session) {
  const nextSession = {
    ...session,
    summary: summarizeSession(session)
  };

  writeJson(sessionFilePath(nextSession.id), nextSession);
  return nextSession;
}

function normalizeStoredSession(session, activeSessionIds = new Set()) {
  if (!session) {
    return null;
  }

  let sessionChanged = false;

  const normalizedRequest = {
    ...(session.request || {}),
    prompt: sanitizeLegacyPromptText(session?.request?.prompt || ""),
    extraInstructions: sanitizeLegacyPromptText(session?.request?.extraInstructions || "")
  };

  if (!normalizedRequest.guidanceMode) {
    normalizedRequest.guidanceMode = inferGuidanceMode(normalizedRequest.extraInstructions || "");
  }

  if (normalizedRequest.prompt !== session?.request?.prompt || normalizedRequest.extraInstructions !== session?.request?.extraInstructions) {
    session = {
      ...session,
      request: normalizedRequest
    };
    sessionChanged = true;
  }

  const normalizedOutput = {
    ...(session.output || {}),
    liveText: sanitizePersistedOutputText(session?.output?.liveText || ""),
    stderr: normalizeReportText(session?.output?.stderr || "")
  };
  normalizedOutput.finalMessage = selectPreferredFinalMessage({
    finalMessage: session?.output?.finalMessage || "",
    liveText: normalizedOutput.liveText,
    stderrText: normalizedOutput.stderr,
    code: session?.process?.code
  });

  if (
    normalizedOutput.liveText !== (session?.output?.liveText || "")
    || normalizedOutput.stderr !== (session?.output?.stderr || "")
    || normalizedOutput.finalMessage !== (session?.output?.finalMessage || "")
  ) {
    const sections = parseNamedSections(normalizedOutput.finalMessage);
    const rcaFields = parseRcaFields(sections.RCA);
    session = {
      ...session,
      output: normalizedOutput,
      parsed: {
        sections,
        rcaFields
      }
    };
    sessionChanged = true;
  }

  const reparsedSections = parseNamedSections(session?.output?.finalMessage || "");
  const reparsedRcaFields = parseRcaFields(reparsedSections.RCA);
  if (
    JSON.stringify(reparsedSections) !== JSON.stringify(session?.parsed?.sections || {})
    || JSON.stringify(reparsedRcaFields) !== JSON.stringify(session?.parsed?.rcaFields || {})
  ) {
    session = {
      ...session,
      parsed: {
        sections: reparsedSections,
        rcaFields: reparsedRcaFields
      }
    };
    sessionChanged = true;
  }

  const displayName = buildSessionDisplayName({
    product: getProductConfig(session.request?.product),
    mode: session.request?.mode || "analyze",
    ticketId: session.request?.ticketId || "",
    issueTitle: session.request?.issueTitle || "",
    derivedIssueTitle: session.request?.derivedIssueTitle || "",
    version: session.request?.version || "",
    continueSession: Boolean(session.request?.continueSession)
  });

  if (!session?.request?.displayName || (session?.request?.issueTitle || session?.request?.derivedIssueTitle) && displayName !== session?.request?.displayName) {
    const normalized = {
      ...session,
      request: {
        ...(session.request || {}),
        displayName
      }
    };
    normalized.summary = summarizeSession(normalized);
    writeJson(sessionFilePath(normalized.id), normalized);
    session = normalized;
    sessionChanged = false;
  }

  if (session.status === "running" && !activeSessionIds.has(session.id)) {
    const normalized = {
      ...session,
      status: "interrupted",
      completedAt: session.completedAt || new Date().toISOString()
    };
    normalized.summary = summarizeSession(normalized);

    writeJson(sessionFilePath(normalized.id), normalized);
    return normalized;
  }

  if (session.summary?.status !== session.status) {
    const normalized = {
      ...session,
      summary: summarizeSession(session)
    };

    writeJson(sessionFilePath(normalized.id), normalized);
    return normalized;
  }

  if (sessionChanged) {
    const normalized = {
      ...session,
      summary: summarizeSession(session)
    };

    writeJson(sessionFilePath(normalized.id), normalized);
    return normalized;
  }

  return session;
}

function loadSession(sessionId, activeSessionIds = new Set()) {
  return normalizeStoredSession(readJsonIfPresent(sessionFilePath(sessionId)), activeSessionIds);
}

function listSessions(activeSessionIds = new Set()) {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => normalizeStoredSession(readJsonIfPresent(path.join(SESSIONS_DIR, fileName)), activeSessionIds))
    .filter(Boolean)
    .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
}

function deleteSession(sessionId, activeSessionIds = new Set()) {
  const session = loadSession(sessionId, activeSessionIds);
  if (!session) {
    return { deleted: false, reason: "not_found" };
  }

  if (activeSessionIds.has(sessionId) || session.status === "running") {
    return { deleted: false, reason: "running", session };
  }

  fs.unlinkSync(sessionFilePath(sessionId));
  return { deleted: true, session };
}

function deleteAllSessions(activeSessionIds = new Set()) {
  const sessions = listSessions(activeSessionIds);
  const deletedSessionIds = [];
  const skippedSessionIds = [];

  for (const session of sessions) {
    if (activeSessionIds.has(session.id) || session.status === "running") {
      skippedSessionIds.push(session.id);
      continue;
    }

    fs.unlinkSync(sessionFilePath(session.id));
    deletedSessionIds.push(session.id);
  }

  return {
    deletedCount: deletedSessionIds.length,
    deletedSessionIds,
    skippedCount: skippedSessionIds.length,
    skippedSessionIds
  };
}

function formatMarkdownReport(session) {
  const titleLabel = session?.request?.displayName || (session?.request?.ticketId ? `Investigation ${session.request.ticketId}` : `Investigation ${session.id}`);
  const metadata = [
    `# ${titleLabel}`,
    "",
    `- Session Name: ${session.request?.displayName || ""}`,
    `- Session ID: ${session.id}`,
    `- Product: ${session.request?.productLabel || ""}`,
    `- Mode: ${session.request?.mode || ""}`,
    `- Issue Title: ${session.request?.issueTitle || session.request?.derivedIssueTitle || ""}`,
    `- Status: ${session.status}`,
    `- Started: ${session.startedAt || ""}`,
    `- Completed: ${session.completedAt || ""}`,
    `- Workspace: ${session.request?.workspace || ""}`,
    `- Version: ${session.request?.version || ""}`,
    `- Model: ${session.request?.model || ""}`,
    ""
  ].join("\n");

  return `${metadata}${session.output?.finalMessage || ""}\n`;
}

function writeArtifacts(snapshot) {
  const aiToolContent = [
    "# aitoolinstruction.md",
    "",
    `- Product: ${snapshot.productLabel}`,
    `- Mode: ${snapshot.mode}`,
    `- Ticket: ${snapshot.ticketId || "Not provided"}`,
    `- Workspace: ${snapshot.workspace || "Not provided"}`,
    `- Version: ${snapshot.version || "Not provided"}`,
    "",
    "## Prompt",
    "",
    snapshot.prompt || "No prompt recorded.",
    "",
    "## Stdout",
    "",
    snapshot.liveText || "No stdout captured yet."
  ].join("\n");

  const newToolContent = [
    "# newtoolinstruction.md",
    "",
    `- Product: ${snapshot.productLabel}`,
    `- Mode: ${snapshot.mode}`,
    `- Ticket: ${snapshot.ticketId || "Not provided"}`,
    `- Version: ${snapshot.version || "Not provided"}`,
    "",
    "## Final Output",
    "",
    snapshot.finalMessage || "No final output captured yet."
  ].join("\n");

  const errorContent = [
    "# error.md",
    "",
    `- Product: ${snapshot.productLabel}`,
    `- Mode: ${snapshot.mode}`,
    `- Ticket: ${snapshot.ticketId || "Not provided"}`,
    `- Version: ${snapshot.version || "Not provided"}`,
    "",
    "## stderr / errors",
    "",
    snapshot.errorText || "No runtime errors recorded."
  ].join("\n");

  fs.writeFileSync(ARTIFACT_FILES.aiToolInstruction, sanitizeLegacyPromptText(aiToolContent));
  fs.writeFileSync(ARTIFACT_FILES.newToolInstruction, normalizeReportText(newToolContent));
  fs.writeFileSync(ARTIFACT_FILES.error, normalizeReportText(errorContent));
}

function currentArtifacts() {
  return {
    aiToolInstruction: sanitizeLegacyPromptText(readFileIfPresent(ARTIFACT_FILES.aiToolInstruction)),
    newToolInstruction: normalizeReportText(readFileIfPresent(ARTIFACT_FILES.newToolInstruction)),
    error: normalizeReportText(readFileIfPresent(ARTIFACT_FILES.error))
  };
}

module.exports = {
  createSessionId,
  currentArtifacts,
  deleteAllSessions,
  deleteSession,
  formatMarkdownReport,
  listSessions,
  loadSession,
  saveSession,
  summarizeSession,
  writeArtifacts
};
