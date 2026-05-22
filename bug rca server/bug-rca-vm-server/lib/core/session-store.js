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

function resolveSessionOwnerKey(user = {}) {
  const safeUser = user && typeof user === "object" ? user : {};
  const candidates = [
    safeUser.subject,
    safeUser.email,
    safeUser.loginId,
    safeUser.username,
    safeUser.upn,
    safeUser.sub,
    safeUser.id
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function buildSessionOwner(user = {}) {
  const key = resolveSessionOwnerKey(user);
  if (!key) {
    return null;
  }

  return {
    key,
    email: String(user.email || "").trim(),
    loginId: String(user.loginId || "").trim(),
    username: String(user.username || "").trim(),
    displayName: String(user.displayName || user.name || user.fullName || user.email || user.loginId || "").trim()
  };
}

function sessionMatchesOwner(session, ownerUser = null) {
  const ownerKey = resolveSessionOwnerKey(ownerUser);
  if (!ownerKey) {
    return true;
  }

  const sessionOwnerKey = String(session?.owner?.key || "").trim().toLowerCase();
  return Boolean(sessionOwnerKey) && sessionOwnerKey === ownerKey;
}

function resolveOwnerArtifactDir(ownerUser = null) {
  const ownerKey = resolveSessionOwnerKey(ownerUser);
  if (!ownerKey) {
    return "";
  }

  const artifactSlug = slugifySessionIdPart(ownerKey, 96) || "user";
  return path.join(path.dirname(SESSIONS_DIR), "artifacts", artifactSlug);
}

function resolveArtifactFiles(ownerUser = null) {
  const artifactDir = resolveOwnerArtifactDir(ownerUser);
  if (!artifactDir) {
    return ARTIFACT_FILES;
  }

  return {
    aiToolInstruction: path.join(artifactDir, path.basename(ARTIFACT_FILES.aiToolInstruction)),
    newToolInstruction: path.join(artifactDir, path.basename(ARTIFACT_FILES.newToolInstruction)),
    error: path.join(artifactDir, path.basename(ARTIFACT_FILES.error))
  };
}

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
  const ownerDisplayName = String(
    session?.owner?.displayName
    || session?.owner?.email
    || session?.owner?.loginId
    || session?.owner?.username
    || ""
  ).trim();

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
    ownerDisplayName,
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

function loadSession(sessionId, activeSessionIds = new Set(), ownerUser = null) {
  const session = normalizeStoredSession(readJsonIfPresent(sessionFilePath(sessionId)), activeSessionIds);
  if (!sessionMatchesOwner(session, ownerUser)) {
    return null;
  }
  return session;
}

function listSessions(activeSessionIds = new Set(), ownerUser = null) {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => normalizeStoredSession(readJsonIfPresent(path.join(SESSIONS_DIR, fileName)), activeSessionIds))
    .filter(Boolean)
    .filter((session) => sessionMatchesOwner(session, ownerUser))
    .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
}

function deleteSession(sessionId, activeSessionIds = new Set(), ownerUser = null) {
  const session = loadSession(sessionId, activeSessionIds, ownerUser);
  if (!session) {
    return { deleted: false, reason: "not_found" };
  }

  if (activeSessionIds.has(sessionId) || session.status === "running") {
    return { deleted: false, reason: "running", session };
  }

  fs.unlinkSync(sessionFilePath(sessionId));
  return { deleted: true, session };
}

function deleteAllSessions(activeSessionIds = new Set(), ownerUser = null) {
  const sessions = listSessions(activeSessionIds, ownerUser);
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
  const ownerDisplayName = String(
    session?.owner?.displayName
    || session?.owner?.email
    || session?.owner?.loginId
    || session?.owner?.username
    || "Not recorded"
  ).trim();
  const metadata = [
    `# ${titleLabel}`,
    "",
    `- Session Name: ${session.request?.displayName || ""}`,
    `- Session ID: ${session.id}`,
    `- Owner: ${ownerDisplayName}`,
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

function writeArtifacts(snapshot, ownerUser = null) {
  const artifactFiles = resolveArtifactFiles(ownerUser);
  const artifactDir = path.dirname(artifactFiles.aiToolInstruction);
  const owner = buildSessionOwner(ownerUser);
  const ownerDisplayName = String(
    owner?.displayName
    || owner?.email
    || owner?.loginId
    || owner?.username
    || "Not recorded"
  ).trim();
  fs.mkdirSync(artifactDir, { recursive: true });

  const aiToolContent = [
    "# aitoolinstruction.md",
    "",
    `- Owner: ${ownerDisplayName}`,
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
    `- Owner: ${ownerDisplayName}`,
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
    `- Owner: ${ownerDisplayName}`,
    `- Product: ${snapshot.productLabel}`,
    `- Mode: ${snapshot.mode}`,
    `- Ticket: ${snapshot.ticketId || "Not provided"}`,
    `- Version: ${snapshot.version || "Not provided"}`,
    "",
    "## stderr / errors",
    "",
    snapshot.errorText || "No runtime errors recorded."
  ].join("\n");

  fs.writeFileSync(artifactFiles.aiToolInstruction, sanitizeLegacyPromptText(aiToolContent));
  fs.writeFileSync(artifactFiles.newToolInstruction, normalizeReportText(newToolContent));
  fs.writeFileSync(artifactFiles.error, normalizeReportText(errorContent));
}

function currentArtifacts(ownerUser = null) {
  const artifactFiles = resolveArtifactFiles(ownerUser);
  return {
    aiToolInstruction: sanitizeLegacyPromptText(readFileIfPresent(artifactFiles.aiToolInstruction)),
    newToolInstruction: normalizeReportText(readFileIfPresent(artifactFiles.newToolInstruction)),
    error: normalizeReportText(readFileIfPresent(artifactFiles.error))
  };
}

module.exports = {
  buildSessionOwner,
  createSessionId,
  currentArtifacts,
  deleteAllSessions,
  deleteSession,
  formatMarkdownReport,
  listSessions,
  loadSession,
  resolveSessionOwnerKey,
  saveSession,
  summarizeSession,
  writeArtifacts
};
