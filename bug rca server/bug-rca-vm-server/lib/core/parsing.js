const SECTION_TITLES = [
  "Plan",
  "MCP Calls",
  "Result Summary",
  "Verification Loop",
  "UI Validation",
  "Step-by-Step Solution"
];

const RCA_FIELDS = [
  "Comments",
  "Comment Evidence",
  "Audit History",
  "Attachment Evidence",
  "Attachments",
  "Reproducible Evidence",
  "Subsystem",
  "Investigation Tier",
  "Culprit",
  "Call Chain",
  "Root Cause Code",
  "Code Evidence",
  "Log Evidence",
  "Why It Fails",
  "Complete Fix",
  "Fix Explanation",
  "Proposed Diff",
  "All Affected Files",
  "Confidence",
  "Remaining Uncertainty"
];

function canonicalHeading(line) {
  return line
    .trim()
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "")
    .replace(/^#+\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/^\d+\)\s*/, "")
    .trim();
}

function findRcaFieldForHeading(heading) {
  const normalized = canonicalHeading(heading).toLowerCase();
  const exactField = RCA_FIELDS.find((field) => normalized === field.toLowerCase());
  if (exactField) {
    return exactField;
  }

  return RCA_FIELDS.find((field) => normalized.startsWith(`${field.toLowerCase()}:`)) || "";
}

function isStructuredRcaHeading(heading) {
  const normalized = canonicalHeading(heading).toLowerCase();
  return [
    "source code select for products",
    "jira ticket id/ bug db id",
    "jira ticket id / bugdb id",
    "jira ticket id / bug db id",
    "stdout rca",
    "deep rca",
    "root cause report",
    "product-generic rca report",
    "evidence-first rca report"
  ].includes(normalized);
}

function buildStructuredRcaFallback(text) {
  const lines = String(text || "").split(/\r?\n/);
  const startIndex = lines.findIndex((line) => isStructuredRcaHeading(line));
  if (startIndex === -1) {
    return "";
  }

  const fallback = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (
      trimmed
      && /^(live note|report ready|run state synced|single report preview)$/i.test(canonicalHeading(trimmed))
    ) {
      break;
    }

    fallback.push(line);
  }

  return fallback.join("\n").trim();
}

function parseNamedSections(text) {
  const sections = {};
  let currentSection = "";

  for (const title of SECTION_TITLES) {
    sections[title] = "";
  }

  sections.RCA = "";

  for (const line of text.split(/\r?\n/)) {
    const heading = canonicalHeading(line);
    const rcaField = findRcaFieldForHeading(heading);

    if (/^RCA:/i.test(heading)) {
      currentSection = "RCA";
      sections.RCA += `${line}\n`;
      continue;
    }

    const exactTitle = SECTION_TITLES.find((title) => heading.toLowerCase() === title.toLowerCase());
    if (exactTitle) {
      currentSection = exactTitle;
      continue;
    }

    if (rcaField) {
      currentSection = "RCA";
      sections.RCA += `${line}\n`;
      continue;
    }

    if (currentSection) {
      sections[currentSection] += `${line}\n`;
    }
  }

  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim();
  }

  if (!sections.RCA) {
    sections.RCA = buildStructuredRcaFallback(text);
  }

  return sections;
}

function parseRcaFields(rcaBlock) {
  const fields = {};
  let currentField = "";

  for (const field of RCA_FIELDS) {
    fields[field] = "";
  }

  for (const line of String(rcaBlock || "").split(/\r?\n/)) {
    const heading = canonicalHeading(line);
    const exactField = RCA_FIELDS.find((field) => heading.toLowerCase() === field.toLowerCase());

    if (exactField) {
      currentField = exactField;
      continue;
    }

    const inlineField = RCA_FIELDS.find((field) => heading.toLowerCase().startsWith(`${field.toLowerCase()}:`));
    if (inlineField) {
      currentField = inlineField;
      fields[currentField] += `${heading.slice(inlineField.length + 1).trim()}\n`;
      continue;
    }

    if (currentField) {
      fields[currentField] += `${line}\n`;
    }
  }

  for (const key of Object.keys(fields)) {
    fields[key] = fields[key].trim();
  }

  return fields;
}

function flattenText(value, depth = 0) {
  if (depth > 5 || value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => flattenText(item, depth + 1)).filter(Boolean).join("");
  }

  if (typeof value !== "object") {
    return "";
  }

  const priorityKeys = ["delta", "text", "message", "content", "output_text", "last_message", "summary"];

  for (const key of priorityKeys) {
    if (key in value) {
      const extracted = flattenText(value[key], depth + 1);
      if (extracted) {
        return extracted;
      }
    }
  }

  return Object.values(value)
    .map((item) => flattenText(item, depth + 1))
    .filter(Boolean)
    .join("");
}

function normalizeTicketIdValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s{2,}/g, " ");
}

function normalizeIssueTitleValue(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[-*#:\s]+/, "")
    .trim()
    .slice(0, 180);
}

function isSyntheticIssueTitle(value, ticketId = "") {
  const normalizedTitle = normalizeIssueTitleValue(value).toLowerCase();
  const normalizedTicket = normalizeTicketIdValue(ticketId).toLowerCase();
  if (!normalizedTitle || !normalizedTicket) {
    return false;
  }

  const compactTitle = normalizedTitle.replace(/[^a-z0-9]+/g, " ").trim();
  const compactTicket = normalizedTicket.replace(/[^a-z0-9]+/g, " ").trim();
  const placeholderCandidates = new Set([
    compactTicket,
    `${compactTicket} rca`,
    `jira ${compactTicket}`,
    `jira ${compactTicket} rca`,
    `bugdb ${compactTicket}`,
    `bugdb ${compactTicket} rca`,
    `bug db ${compactTicket}`,
    `bug db ${compactTicket} rca`
  ]);

  return placeholderCandidates.has(compactTitle);
}

function firstUsefulLine(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => canonicalHeading(line))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return (
    lines.find((line) => {
      const lowered = line.toLowerCase();
      if (SECTION_TITLES.some((title) => title.toLowerCase() === lowered)) {
        return false;
      }

      if (lowered === "rca:" || RCA_FIELDS.some((field) => field.toLowerCase() === lowered)) {
        return false;
      }

      return line.length >= 8;
    }) || ""
  );
}

function extractDerivedIssueTitle(sections, rcaFields, finalMessage, ticketId) {
  const candidates = [
    sections?.["Result Summary"],
    rcaFields?.Culprit,
    rcaFields?.["Why It Fails"],
    sections?.RCA,
    finalMessage
  ];

  for (const candidate of candidates) {
    const line = normalizeIssueTitleValue(firstUsefulLine(candidate));
    if (!line) {
      continue;
    }

    if (ticketId && line.toLowerCase() === String(ticketId).toLowerCase()) {
      continue;
    }

    return line;
  }

  return "";
}

function parseAffectedFiles(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n|,|;/)
        .map((item) => item.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
    )
  );
}

function countListItems(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return 0;
  }

  const listLike = lines.filter((line) => /^[-*]|\d+\./.test(line));
  return listLike.length || lines.length;
}

module.exports = {
  RCA_FIELDS,
  SECTION_TITLES,
  canonicalHeading,
  countListItems,
  extractDerivedIssueTitle,
  firstUsefulLine,
  flattenText,
  isSyntheticIssueTitle,
  normalizeIssueTitleValue,
  normalizeTicketIdValue,
  parseAffectedFiles,
  parseNamedSections,
  parseRcaFields
};
