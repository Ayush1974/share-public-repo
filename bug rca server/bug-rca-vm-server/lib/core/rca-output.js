const { normalizeIssueTitleValue, normalizeTicketIdValue } = require("./parsing");

const EVIDENCE_FIELDS = [
  "Comments",
  "Comment Evidence",
  "Audit History",
  "Attachment Evidence",
  "Attachments",
  "Reproducible Evidence",
  "Log Evidence"
];

const ROOT_CAUSE_FIELDS = [
  "Subsystem",
  "Culprit",
  "Call Chain",
  "Root Cause Code",
  "Why It Fails",
  "Complete Fix",
  "Fix Explanation"
];

const LOW_CONFIDENCE_MARKERS = [
  "low confidence",
  "confidence: low",
  "insufficient evidence",
  "not enough evidence",
  "unable to determine",
  "cannot determine",
  "unclear"
];

const GENERIC_RCA_MARKERS = [
  "generic to the selected oracle restaurants product",
  "keep the rca generic",
  "generic product guidance"
];

const JIRA_MCP_BLOCKER_MARKERS = [
  "jira mcp unavailable",
  "blocked on jira mcp",
  "status: blocked on jira mcp",
  "jira mcp is unavailable",
  "missing jira mcp connectivity"
];

const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "bug",
  "bugdb",
  "db",
  "error",
  "failure",
  "for",
  "from",
  "generic",
  "in",
  "into",
  "issue",
  "jira",
  "low",
  "not",
  "of",
  "on",
  "oracle",
  "product",
  "rca",
  "restaurants",
  "selected",
  "simphony",
  "symptom",
  "the",
  "ticket",
  "to",
  "with"
]);

function normalizeComparableText(value) {
  return ` ${String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function tokenizeIssueTitle(issueTitle) {
  return Array.from(new Set(
    normalizeIssueTitleValue(issueTitle)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !TITLE_STOP_WORDS.has(token))
  ));
}

function countMatchedTitleTokens(text, tokens) {
  const comparableText = normalizeComparableText(text);
  return tokens.filter((token) => comparableText.includes(` ${token} `)).length;
}

function hasAnyFieldContent(fields, fieldNames) {
  return fieldNames.some((fieldName) => String(fields?.[fieldName] || "").trim());
}

function looksLowConfidence(text) {
  const normalized = String(text || "").toLowerCase();
  return LOW_CONFIDENCE_MARKERS.some((marker) => normalized.includes(marker));
}

function evaluateRcaOutput({ request = {}, sections = {}, rcaFields = {}, finalMessage = "" } = {}) {
  const comparableFinalMessage = normalizeComparableText(finalMessage);
  const ticketId = normalizeTicketIdValue(request.ticketId || "");
  const comparableTicket = normalizeComparableText(ticketId);
  const issueTitleTokens = tokenizeIssueTitle(request.issueTitle || request.derivedIssueTitle || "");
  const matchedTitleTokens = countMatchedTitleTokens(finalMessage, issueTitleTokens);
  const requiredTitleTokenMatches = issueTitleTokens.length >= 4 ? 2 : issueTitleTokens.length >= 2 ? 1 : 0;
  const hasTicketAnchor = Boolean(ticketId) && comparableFinalMessage.includes(comparableTicket);
  const hasTitleAnchor = requiredTitleTokenMatches > 0 && matchedTitleTokens >= requiredTitleTokenMatches;
  const hasEvidence = hasAnyFieldContent(rcaFields, EVIDENCE_FIELDS);
  const hasRootCause = hasAnyFieldContent(rcaFields, ROOT_CAUSE_FIELDS);
  const hasStructuredReport = Boolean(
    String(sections["Result Summary"] || "").trim()
    || String(sections.RCA || "").trim()
    || String(sections["Step-by-Step Solution"] || "").trim()
  );
  const genericMarker = GENERIC_RCA_MARKERS.find((marker) => comparableFinalMessage.includes(normalizeComparableText(marker))) || "";
  const hasPrefetchedJiraEvidence = Boolean(
    ["jira", "description"].includes(String(request.ticketSource || "").trim().toLowerCase())
    && request.jiraEvidence
    && (
      String(request.jiraEvidence.summary || "").trim()
      || String(request.jiraEvidence.description || "").trim()
      || (Array.isArray(request.jiraEvidence.comments) && request.jiraEvidence.comments.length)
      || (Array.isArray(request.jiraEvidence.attachments) && request.jiraEvidence.attachments.length)
    )
  );
  const jiraMcpBlockerMarker = hasPrefetchedJiraEvidence
    ? (JIRA_MCP_BLOCKER_MARKERS.find((marker) => comparableFinalMessage.includes(normalizeComparableText(marker))) || "")
    : "";
  const confidenceText = [
    rcaFields.Confidence,
    sections["Result Summary"],
    sections.RCA,
    finalMessage
  ].filter(Boolean).join("\n");
  const lowConfidence = looksLowConfidence(confidenceText);
  const reasons = [];
  const guidanceMode = String(request.guidanceMode || "product-generic").trim().toLowerCase();

  if (!hasStructuredReport) {
    reasons.push("The run did not return the structured RCA sections required by the workflow.");
  }

  if (genericMarker) {
    reasons.push("The answer drifted into generic product guidance instead of staying tied to the requested bug.");
  }

  if (jiraMcpBlockerMarker) {
    reasons.push("The RCA still reported a Jira MCP blocker even though prefetched Jira REST evidence was already available for the run.");
  }

  if (!hasTicketAnchor && !hasTitleAnchor) {
    reasons.push("The final RCA does not visibly anchor itself to the requested ticket ID or issue title.");
  }

  if (!hasEvidence) {
    reasons.push("The RCA did not include bug-specific evidence from comments, audit history, attachments, logs, or repro data.");
  }

  if (guidanceMode !== "evidence-first" && !hasRootCause) {
    reasons.push("The RCA did not identify a concrete culprit, failure mechanism, or complete fix scope.");
  }

  if (lowConfidence && !hasEvidence) {
    reasons.push("The response stayed low confidence without enough ticket-specific evidence to justify the conclusion.");
  }

  const shouldReject = Boolean(
    !hasStructuredReport
    || genericMarker
    || jiraMcpBlockerMarker
    || ((!hasTicketAnchor && !hasTitleAnchor) && (!hasEvidence || lowConfidence))
    || (guidanceMode !== "evidence-first" && !hasRootCause && lowConfidence)
  );

  return {
    shouldReject,
    reasons,
    hasTicketAnchor,
    hasTitleAnchor,
    hasEvidence,
    hasRootCause,
    hasStructuredReport,
    lowConfidence,
    ticketId,
    issueTitleTokens,
    matchedTitleTokens
  };
}

function buildRejectedRcaMessage(request = {}, evaluation = {}) {
  const label = [
    normalizeTicketIdValue(request.ticketId || ""),
    normalizeIssueTitleValue(request.issueTitle || request.derivedIssueTitle || "")
  ].filter(Boolean).join(" | ") || "the requested bug";
  const reasons = Array.isArray(evaluation.reasons) ? evaluation.reasons.filter(Boolean) : [];

  return [
    `RCA output rejected for ${label}.`,
    "",
    "The completed run returned a generic or weakly anchored answer, so the server did not keep it as a valid RCA result.",
    "",
    "Why it was rejected:",
    ...(reasons.length ? reasons.map((reason) => `- ${reason}`) : ["- The answer did not meet the bug-specific RCA quality bar."]),
    "",
    "Next step:",
    "- Rerun RCA. The updated prompt now forces ticket-specific anchoring and strips placeholder issue titles.",
    "- If Jira/BugDB data or source evidence is missing, the run must report that blocker instead of guessing."
  ].join("\n");
}

module.exports = {
  buildRejectedRcaMessage,
  evaluateRcaOutput
};
