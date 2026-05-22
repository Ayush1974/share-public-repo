const fs = require("fs");
const path = require("path");

const {
  AGENT_CONFIG,
  ARTIFACT_FILES,
  CODEX_OUTPUT_DIR,
  MCP_CONFIG_FILE,
  REMOTE_WORKSPACE_RUNS_DIR,
  RUNTIME_DIR,
  SESSIONS_DIR
} = require("./config");

function readFileIfPresent(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return "";
  }
}

function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function normalizeReportText(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/\uFFFD/g, "")
    .replaceAll("â†’", "->")
    .replaceAll("â€”", "-")
    .replaceAll("â€“", "-")
    .replaceAll("â‰¤", "<=")
    .replaceAll("â‰¥", ">=")
    .replaceAll("â€œ", "\"")
    .replaceAll("â€�", "\"")
    .replaceAll("â€˜", "'")
    .replaceAll("â€™", "'")
    .replaceAll("â€¦", "...")
    .replaceAll("Â ", " ")
    .replaceAll("Â", "");
}

const CODEX_PROTOCOL_NOISE_PATTERNS = [
  /^thread\.(started|completed|cancelled|failed)\S*/i,
  /^turn\.(started|completed|cancelled|failed)\S*/i,
  /^reading prompt from stdin\.\.\.$/i,
  /^reconnecting\.\.\.\s+\d+\/\d+\s+\(/i,
  /^unexpected status \d+\b/i,
  /^"error":\s*\{?$/i,
  /^"message":\s*".*$/i,
  /^"type":\s*".*$/i,
  /^[{}]+$/,
  /^\[rmcp::transport::worker::workertransport<.*$/i
];

const STRUCTURED_REPORT_SECTION_TITLES = [
  "Plan",
  "MCP Calls",
  "Result Summary",
  "Verification Loop",
  "UI Validation",
  "Step-by-Step Solution"
];

const STRUCTURED_RCA_FALLBACK_HEADINGS = new Set([
  "source code select for products",
  "jira ticket id/ bug db id",
  "jira ticket id / bugdb id",
  "jira ticket id / bug db id",
  "stdout rca",
  "deep rca",
  "root cause report",
  "product-generic rca report",
  "evidence-first rca report"
]);

function collapseReportWhitespace(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isCodexProtocolNoiseLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) {
    return false;
  }

  return CODEX_PROTOCOL_NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function sanitizePersistedOutputText(value) {
  const normalized = normalizeReportText(value);
  if (!normalized.trim()) {
    return "";
  }

  const filteredLines = normalized
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !isCodexProtocolNoiseLine(line));

  return collapseReportWhitespace(filteredLines.join("\n"));
}

function hasStructuredReportContent(value) {
  const normalized = collapseReportWhitespace(value);
  if (!normalized) {
    return false;
  }

  return [
    /\bPlan\b/,
    /\bMCP Calls\b/,
    /\bResult Summary\b/,
    /\bVerification Loop\b/,
    /\bUI Validation\b/,
    /\bStep-by-Step Solution\b/,
    /\bRCA\b/,
    /^\*\*1\)/m,
    /^#\s+/m
  ].some((pattern) => pattern.test(normalized));
}

function canonicalStructuredHeading(line) {
  return String(line || "")
    .trim()
    .replace(/^\*+/, "")
    .replace(/\*+$/, "")
    .replace(/^#+\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/^\d+\)\s*/, "")
    .trim()
    .toLowerCase();
}

function extractStructuredReportContent(value) {
  const normalized = collapseReportWhitespace(normalizeReportText(value));
  if (!normalized) {
    return "";
  }

  const lines = normalized.replace(/\r\n/g, "\n").split("\n");
  const startIndex = lines.findIndex((line) => {
    const heading = canonicalStructuredHeading(line);
    return (
      STRUCTURED_REPORT_SECTION_TITLES.some((title) => heading === title.toLowerCase())
      || /^rca:/i.test(heading)
      || STRUCTURED_RCA_FALLBACK_HEADINGS.has(heading)
    );
  });

  if (startIndex === -1) {
    return "";
  }

  // BUG-RCA| share-bundle-20260429| drop live-stream wrappers before persisting the final RCA body
  return collapseReportWhitespace(lines.slice(startIndex).join("\n"));
}

function selectPreferredFinalMessage(options = {}) {
  const {
    finalMessage = "",
    liveText = "",
    stderrText = "",
    maxSilenceMessage = "",
    fallbackFailureMessage = "",
    code = 0
  } = options;

  const normalizedStderr = sanitizePersistedOutputText(stderrText)
    || collapseReportWhitespace(normalizeReportText(stderrText));
  const cleanedFinal = sanitizePersistedOutputText(finalMessage);
  const cleanedLive = sanitizePersistedOutputText(liveText);
  const structuredFinal = extractStructuredReportContent(cleanedFinal);
  const structuredLive = extractStructuredReportContent(cleanedLive);
  const cleanedFailure = collapseReportWhitespace(
    normalizeReportText([maxSilenceMessage, fallbackFailureMessage].filter(Boolean).join("\n"))
  );

  if (structuredFinal) {
    return structuredFinal;
  }

  if (cleanedFinal) {
    return cleanedFinal;
  }

  if (structuredLive && (Number(code) === 0 || hasStructuredReportContent(structuredLive))) {
    return structuredLive;
  }

  if (cleanedLive && (Number(code) === 0 || hasStructuredReportContent(cleanedLive))) {
    return cleanedLive;
  }

  if (normalizedStderr) {
    return normalizedStderr;
  }

  if (cleanedLive) {
    return cleanedLive;
  }

  return cleanedFailure;
}

function sanitizeLegacyPromptText(value) {
  return normalizeReportText(String(value || ""))
    .replaceAll(
      "Keep the RCA generic to the selected Oracle Restaurants product and highlight subsystem-specific evidence. Do not make any code changes in this RCA run. If a likely fix is found, report it and wait for an explicit fix request.",
      "Keep the RCA generic to the selected Oracle Restaurants product and highlight subsystem-specific evidence."
    )
    .replaceAll(
      "Focus on comments, audit history, attachments, and logs before concluding RCA. Do not make any code changes in this RCA run. If a likely fix is found, report it and wait for an explicit fix request.",
      "Focus on comments, audit history, attachments, logs, and reproducible evidence before concluding RCA."
    )
    .replaceAll(
      "This request is RCA-only analysis. Do not modify code, edit files, or apply a fix during analyze or continuation runs.",
      "Analyze only: gather evidence, explain the root cause, and describe the most likely next fix step without implementing it."
    )
    .replaceAll(
      "If you identify a likely fix, describe it in the RCA and recommended next step, but wait for an explicit fix request before making any code changes.",
      "Describe the likely fix and recommended next step in the RCA."
    )
    .replaceAll(
      "Only perform file edits when the user explicitly starts the dedicated fix step.",
      "Reserve all code edits for the dedicated fix step."
    )
    .replaceAll(
      "Do not implement the proposed fix during this continuation unless the user explicitly switches to the fix step.",
      "Continuation runs stay in analysis mode until the dedicated fix step starts."
    )
    .replaceAll(
      "4. Fix the files as in RCA step",
      "4. If a later dedicated fix step is explicitly requested on a writable local checkout, scope it from the RCA"
    )
    .replaceAll("JIRA Ticket ID / BugDB ID:", "Jira Ticket ID / BugDB ID:")
    .replaceAll("ask for the JIRA Ticket ID / BugDB ID first.", "ask for the Jira Ticket ID / BugDB ID first.");
}

function defaultArtifactContent(key) {
  if (key === "aiToolInstruction") {
    return "# aitoolinstruction.md\n\nNo RCA run has been captured yet.\n";
  }

  if (key === "newToolInstruction") {
    return "# newtoolinstruction.md\n\nNo final RCA or fix output has been captured yet.\n";
  }

  return "# error.md\n\nNo runtime errors recorded.\n";
}

function defaultMcpConfigContent() {
  return `${JSON.stringify(
    {
      bugdb: "",
      jira: ""
    },
    null,
    2
  )}\n`;
}

function ensureRuntimeFiles() {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.mkdirSync(CODEX_OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(REMOTE_WORKSPACE_RUNS_DIR, { recursive: true });

  for (const [key, filePath] of Object.entries(ARTIFACT_FILES)) {
    if (fs.existsSync(filePath)) {
      continue;
    }

    fs.writeFileSync(filePath, defaultArtifactContent(key));
  }

  if (!fs.existsSync(MCP_CONFIG_FILE)) {
    fs.writeFileSync(MCP_CONFIG_FILE, defaultMcpConfigContent());
  }
}

function readMcpConfig() {
  const parsed = readJsonIfPresent(MCP_CONFIG_FILE);
  if (parsed && typeof parsed === "object") {
    return parsed;
  }

  return {};
}

function getConfiguredMcpServers() {
  const config = readMcpConfig();
  const usesNestedConfig = config?.mcpServers && typeof config.mcpServers === "object";
  const servers = usesNestedConfig ? config.mcpServers : config;

  return Object.entries(servers || {})
    .map(([name, entry]) => {
      if (!/^[A-Za-z0-9_-]+$/.test(name)) {
        return null;
      }

      const isStringEntry = typeof entry === "string";
      const url = String(isStringEntry ? entry : entry?.url || "").trim();
      const enabled = isStringEntry ? true : entry?.enabled !== false;
      if (!url || !enabled) {
        return null;
      }

      return { name, url };
    })
    .filter(Boolean);
}

function getDefaultPrompt() {
  const yaml = readFileIfPresent(AGENT_CONFIG);
  const match = yaml.match(/default_prompt:\s*"(.*)"/);
  return match ? match[1] : "Use $simphony-bug-rca-pipeline to analyze a Simphony bug end-to-end.";
}

module.exports = {
  ensureRuntimeFiles,
  getConfiguredMcpServers,
  getDefaultPrompt,
  normalizeReportText,
  readFileIfPresent,
  readJsonIfPresent,
  readMcpConfig,
  sanitizePersistedOutputText,
  sanitizeLegacyPromptText,
  selectPreferredFinalMessage,
  writeJson
};
