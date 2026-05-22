/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import Context = require("ojs/ojcontext");

type ProductOption = {
  key: string;
  label: string;
  family: string;
  defaultWorkspace?: string;
};

type RuntimeConfig = {
  connected: boolean;
  platform: string;
  serverMode: string;
  requireElevatedExecution: boolean;
  elevated: boolean;
  products: ProductOption[];
  defaultPrompt: string;
};

type LocalAgentStatus = {
  connected: boolean;
  host: string;
  port: number;
  serverMode: string;
  elevated: boolean;
  requireElevatedExecution: boolean;
  transport: "none" | "broker" | "direct";
};

type AuthUser = {
  displayName?: string;
  email?: string;
  username?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  time: string;
};

type SessionHistoryItem = {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  request?: {
    displayName?: string;
    ticketId?: string;
    issueTitle?: string;
    derivedIssueTitle?: string;
    product?: string;
    productLabel?: string;
  };
  summary?: {
    displayName?: string;
    preview?: string;
    ticketId?: string;
    status?: string;
  };
};

type RunState = "idle" | "running" | "completed" | "failed" | "stopped";

type Props = Readonly<{
  appName?: string;
  userLogin?: string;
}>;

const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA specific to the selected Jira/BugDB ticket, its exact symptom, and the selected Oracle Restaurants product. Do not drift into generic product guidance.";
const DEFAULT_LOCAL_AGENT_BASE_URL = "http://127.0.0.1:3210";
const LOCAL_AGENT_RECONNECT_MS = 3000;
const EMPTY_LOCAL_AGENT_STATUS: LocalAgentStatus = {
  connected: false,
  host: "",
  port: 0,
  serverMode: "",
  elevated: false,
  requireElevatedExecution: false,
  transport: "none"
};
const FALLBACK_PRODUCTS: ProductOption[] = [
  { key: "simphony", label: "Simphony", family: "Oracle Restaurants Simphony", defaultWorkspace: "C:\\Code\\simphony" },
  { key: "rna", label: "RNA", family: "Oracle Restaurants Reporting and Analytics", defaultWorkspace: "C:\\Code\\rna" },
  { key: "flm", label: "FLM", family: "Oracle Restaurants Front Line Manager", defaultWorkspace: "C:\\Code\\flm" },
  { key: "cnc", label: "C&C", family: "Oracle Restaurants C&C", defaultWorkspace: "C:\\Code\\cnc" }
];

const DEFAULT_CHAT: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Start with a Jira number or pasted problem statement. I will keep the run focused and put the full details in Advanced Analysis when the RCA is ready.",
    time: "Now"
  }
];

const RCA_RESULT_SECTION_NAMES = [
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
const NON_RCA_FINAL_SECTION_NAMES = [
  "Plan",
  "MCP Calls",
  "Result Summary",
  "Verification Loop",
  "UI Validation",
  "Step-by-Step Solution",
  "Comments",
  "Comment Evidence",
  "Audit History",
  "Attachment Evidence",
  "Attachments",
  "Reproducible Evidence"
];
const RCA_RESULT_DISPLAY_SECTION_NAMES = [
  "Summary",
  "Observed vs Expected",
  "Repro Sufficiency",
  "Evidence",
  "Root Cause",
  "Root Cause Code",
  "Code Evidence",
  "Proposed Diff",
  "Proposed Solution",
  "Confidence",
  "Remaining Uncertainty",
  "Recommended Fix",
  "Fix Explanation",
  "Files to update",
  ...RCA_RESULT_SECTION_NAMES
];
const ADVANCED_RCA_FIELD_ORDER = [
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
  "Log Evidence",
  "Complete Fix",
  "Fix Explanation",
  "Proposed Diff",
  "All Affected Files",
  "Confidence",
  "Remaining Uncertainty"
];

function formatClock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function compactText(value: unknown, limit = 220) {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}...` : normalized;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  if (!response.ok) {
    try {
      const parsed = JSON.parse(body);
      throw new Error(parsed.error || parsed.message || body || `HTTP ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message !== body) {
        throw error;
      }
      throw new Error(body || `HTTP ${response.status}`);
    }
  }
  return body ? JSON.parse(body) : {} as T;
}

function normalizeProducts(products: ProductOption[]) {
  const merged = [...products];
  for (const fallback of FALLBACK_PRODUCTS) {
    const existing = merged.find((product) => product.key === fallback.key || product.label.toLowerCase() === fallback.label.toLowerCase());
    if (!existing) {
      merged.push(fallback);
    }
  }
  return merged.map((product) => {
    const fallback = FALLBACK_PRODUCTS.find((item) => item.key === product.key || item.label.toLowerCase() === product.label.toLowerCase());
    if (fallback?.defaultWorkspace && (!product.defaultWorkspace || product.defaultWorkspace.toLowerCase().startsWith("shared://"))) {
      return { ...product, defaultWorkspace: fallback.defaultWorkspace };
    }
    return fallback?.defaultWorkspace && !product.defaultWorkspace
      ? { ...product, defaultWorkspace: fallback.defaultWorkspace }
      : product;
  });
}

function parseSseBlock(block: string) {
  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) {
    return null;
  }
  try {
    return { eventName, payload: JSON.parse(dataLines.join("\n")) };
  } catch (error) {
    return { eventName, payload: { text: dataLines.join("\n") } };
  }
}

function firstPresent(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function normalizeSectionName(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/:$/, "")
    .replace(/\s*\(confidence:[^)]+\)\s*$/i, "")
    .trim()
    .toLowerCase();
}

function getMarkdownHeading(line: string) {
  const normalized = line.trim();
  const markdown = normalized.match(/^#{1,6}\s+(.+?)\s*$/);
  if (markdown) {
    return stripMarkdownHeading(markdown[1]);
  }
  const bold = normalized.match(/^\*\*(.+?)\*\*:?\s*$/);
  if (bold) {
    return stripMarkdownHeading(bold[1]);
  }
  if (isRichHeading(normalized)) {
    return stripMarkdownHeading(normalized);
  }
  return "";
}

function parseFinalMessageSections(value: string) {
  const sectionMap: Record<string, string> = {};
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  let activeHeading = "";
  let activeLines: string[] = [];

  function flush() {
    if (!activeHeading) {
      activeLines = [];
      return;
    }
    const body = activeLines.join("\n").trim();
    if (body) {
      sectionMap[normalizeSectionName(activeHeading)] = body;
    }
    activeLines = [];
  }

  for (const line of lines) {
    const boldWithInlineValue = line.trim().match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (boldWithInlineValue && RCA_RESULT_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(boldWithInlineValue[1]))) {
      flush();
      activeHeading = boldWithInlineValue[1];
      activeLines = boldWithInlineValue[2] ? [boldWithInlineValue[2]] : [];
      continue;
    }

    const heading = getMarkdownHeading(line);
    if (heading && RCA_RESULT_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading))) {
      flush();
      activeHeading = heading;
      continue;
    }
    if (heading && (
      /^#{1,6}\s+/.test(line.trim())
      || NON_RCA_FINAL_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading))
    )) {
      flush();
      activeHeading = "";
      continue;
    }
    if (activeHeading) {
      activeLines.push(line);
    }
  }
  flush();
  return sectionMap;
}

function pickFinalSection(sectionMap: Record<string, string>, ...names: string[]) {
  for (const name of names) {
    const exact = sectionMap[normalizeSectionName(name)];
    if (exact) {
      return exact;
    }
  }
  return "";
}

function cleanRcaField(value: string) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "---")
    .join("\n")
    .trim();
}

function cleanRcaContentLine(line: string) {
  return line
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[\).]\s+/, "")
    .trim();
}

function isKnownRcaHeading(value: string) {
  const normalized = normalizeSectionName(value);
  return [
    "summary",
    "observed vs expected",
    "repro sufficiency",
    "evidence",
    "root cause",
    "recommended fix",
    "fix explanation",
    "files to update",
    "proposed solution",
    ...RCA_RESULT_SECTION_NAMES,
    ...NON_RCA_FINAL_SECTION_NAMES
  ].some((name) => normalizeSectionName(name) === normalized);
}

function meaningfulRcaLines(value: string, maxLines = 4) {
  const lines: string[] = [];
  for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
    const line = cleanRcaContentLine(rawLine);
    if (!line || /^```/.test(line) || isKnownRcaHeading(line.replace(/:$/, ""))) {
      continue;
    }
    if (/^(none|n\/a|not available|not provided)$/i.test(line)) {
      continue;
    }
    lines.push(line);
    if (lines.length >= maxLines) {
      break;
    }
  }
  return lines;
}

function firstMeaningfulRcaLine(value: string) {
  return meaningfulRcaLines(value, 1)[0] || "";
}

function extractConfidenceLevel(value: string) {
  const text = cleanRcaField(value);
  const normalized = text.toLowerCase();
  if (/\bmedium\s*[- ]\s*high\b/.test(normalized)) {
    return "Medium-high";
  }
  if (/\bhigh\b/.test(normalized)) {
    return "High";
  }
  if (/\bmedium\b/.test(normalized)) {
    return "Medium";
  }
  if (/\blow\b/.test(normalized)) {
    return "Low";
  }
  const fallback = firstMeaningfulRcaLine(text) || text;
  return fallback.replace(/[.:;,\s]+$/g, "");
}

function isPositiveConfidenceLevel(value: string) {
  return /^(high|medium-high)$/i.test(String(value || "").trim());
}

function uniqueRcaLines(lines: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines.map((item) => cleanRcaContentLine(item)).filter(Boolean)) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }
  return result;
}

function extractLabeledRcaValue(value: string, labelPattern: RegExp) {
  for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
    const line = cleanRcaContentLine(rawLine);
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match && labelPattern.test(match[1].trim())) {
      return cleanRcaContentLine(match[2]);
    }
  }
  return "";
}

function extractRcaLinesAfterLabel(value: string, labelPattern: RegExp, maxLines = 3) {
  const lines: string[] = [];
  let active = false;
  for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
    const line = cleanRcaContentLine(rawLine);
    if (!line || /^```/.test(line)) {
      if (active && lines.length) {
        break;
      }
      continue;
    }

    const inline = line.match(/^([^:]+):\s*(.*)$/);
    const label = inline ? inline[1].trim() : line.replace(/:$/, "").trim();
    if (labelPattern.test(label)) {
      active = true;
      if (inline?.[2]) {
        lines.push(cleanRcaContentLine(inline[2]));
      }
      continue;
    }

    if (!active) {
      continue;
    }

    if (/^(symptom|observed|expected|proposed|most likely|evidence|files involved|call path|confidence|remaining uncertainty|recommended fix|fix explanation)\b/i.test(line) || isKnownRcaHeading(line.replace(/:$/, ""))) {
      break;
    }
    lines.push(line);
    if (lines.length >= maxLines) {
      break;
    }
  }
  return uniqueRcaLines(lines).slice(0, maxLines);
}

function formatNumberedRcaLines(lines: string[]) {
  return uniqueRcaLines(lines)
    .map((line, index) => `${index + 1}) ${line}`)
    .join("\n");
}

function trimRcaBlock(value: string, maxLines = 70, maxChars = 6000) {
  const text = cleanRcaField(value);
  const lines = text.split("\n");
  const clippedByLines = lines.length > maxLines
    ? `${lines.slice(0, maxLines).join("\n")}\n... ${lines.length - maxLines} more lines in Advanced Analysis.`
    : text;
  return clippedByLines.length > maxChars
    ? `${clippedByLines.slice(0, maxChars - 4).trim()} ...`
    : clippedByLines;
}

function stripWrappingFence(value: string) {
  const text = cleanRcaField(value);
  const match = text.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : text;
}

function buildSummaryBlock(resultSummary: string, whyItFails: string, culprit: string, completeFix: string, fixExplanation: string) {
  const symptom = firstPresent(
    extractLabeledRcaValue(resultSummary, /^symptom$/i),
    firstMeaningfulRcaLine(resultSummary),
    firstMeaningfulRcaLine(whyItFails),
    firstMeaningfulRcaLine(culprit)
  );
  const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3);
  const rootCauseLines = summaryRootCauses.length
    ? summaryRootCauses
    : uniqueRcaLines([
      ...meaningfulRcaLines(whyItFails, 3),
      ...meaningfulRcaLines(culprit, 1)
    ]).slice(0, 3);
  const nextFix = firstPresent(
    extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i),
    firstMeaningfulRcaLine(completeFix),
    firstMeaningfulRcaLine(fixExplanation)
  );

  return [
    symptom ? `- Symptom: ${compactText(symptom, 440)}` : "",
    rootCauseLines.length ? `- Root causes\n${formatNumberedRcaLines(rootCauseLines)}` : "",
    nextFix ? `- Most likely next fix step: ${compactText(nextFix, 380)}` : ""
  ].filter(Boolean).join("\n\n");
}

function buildObservedExpected(summary: string, logEvidence: string, culprit: string, whyItFails: string) {
  const observed = firstPresent(
    extractLabeledRcaValue(summary, /^symptom$/i),
    firstMeaningfulRcaLine(summary),
    firstMeaningfulRcaLine(logEvidence),
    firstMeaningfulRcaLine(culprit),
    firstMeaningfulRcaLine(whyItFails)
  );
  if (!observed) {
    return "";
  }
  return [
    `Observed: ${compactText(observed, 520)}`,
    "Expected: The ticket flow should complete without the reported failure; exact product expectation should match the Jira/BugDB acceptance context."
  ].join("\n");
}

function buildReproSufficiency(reproEvidence: string, logEvidence: string, rootCauseCode: string, confidence: string, uncertainty: string) {
  if (reproEvidence) {
    return reproEvidence;
  }

  const hasDirectEvidence = Boolean(logEvidence || rootCauseCode);
  const isHighConfidence = /^high\b/i.test(confidence.trim());
  if (hasDirectEvidence && isHighConfidence && !uncertainty) {
    return "Sufficient. The available logs/code evidence identify a concrete failing path and support the RCA without needing more reproduction data.";
  }

  if (hasDirectEvidence) {
    return "Partially sufficient. The RCA has concrete evidence, but reproduction details should still be confirmed against the source ticket or attached logs.";
  }

  return uncertainty || "Not fully established from the available output. Add reproducible steps, logs, or a failing scenario to strengthen the RCA.";
}

function buildEvidenceBlock(culprit: string, callChain: string, logEvidence: string, affectedFiles: string) {
  return [
    culprit ? `Issue location:\n${culprit}` : "",
    affectedFiles ? `Files involved:\n${affectedFiles}` : "",
    callChain ? `Call path:\n${callChain}` : "",
    `Log/source evidence:\n${logEvidence || "None provided in Jira/source output."}`
  ].filter(Boolean).join("\n\n");
}

function ensureFencedBlock(value: string, language = "") {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  if (/^```/.test(text)) {
    return text;
  }

  const fence = language ? `\`\`\`${language}` : "```";
  return `${fence}\n${text}\n\`\`\``;
}

function buildRootCauseBlock(whyItFails: string, culprit: string, resultSummary: string) {
  const rootCauseLines = uniqueRcaLines([
    ...meaningfulRcaLines(whyItFails, 5),
    ...extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3),
    ...meaningfulRcaLines(culprit, 2)
  ]).slice(0, 6);

  return rootCauseLines.length
    ? rootCauseLines.map((line) => `- ${line}`).join("\n")
    : "";
}

function buildCodeEvidenceBlock(rootCauseCode: string, codeEvidence: string) {
  return [
    rootCauseCode ? `Code involved in the root cause\n${trimRcaBlock(rootCauseCode, 30, 2800)}` : "",
    codeEvidence ? trimRcaBlock(codeEvidence, 55, 5200) : ""
  ].filter(Boolean).join("\n\n");
}

function buildRootCauseWithCodeBlock(rootCause: string, rootCauseCode: string, codeEvidence: string) {
  return [
    rootCause,
    buildCodeEvidenceBlock(rootCauseCode, codeEvidence)
  ].filter(Boolean).join("\n\n");
}

function buildAdvancedRootCauseBlock(whyItFails: string, rootCauseCode: string, codeEvidence: string) {
  return [
    cleanRcaField(whyItFails),
    rootCauseCode ? `Code involved in the root cause\n${cleanRcaField(rootCauseCode)}` : "",
    codeEvidence ? stripWrappingFence(codeEvidence) : ""
  ].filter(Boolean).join("\n\n");
}

function buildRecommendedFix(completeFix: string, fixExplanation: string) {
  return cleanRcaField(completeFix) || (firstMeaningfulRcaLine(fixExplanation) ? `- ${firstMeaningfulRcaLine(fixExplanation)}` : "");
}

function buildProposedDiffBlock(proposedDiff: string) {
  const text = stripWrappingFence(proposedDiff)
    .replace(/^-?\s*Note:\s*Proposed only;.*$/gim, "")
    .trim();
  if (!text) {
    return "- Note: Proposed diff was not returned by Codex for this RCA. Re-run with more concrete source evidence if a code patch is required.";
  }
  const diffBody = trimRcaBlock(text, 140, 9000);
  return [
    "- Note: Proposed only; not applied or verified in this RCA-only run.",
    diffBody.includes("```") ? diffBody : ensureFencedBlock(diffBody, "diff")
  ].join("\n");
}

function buildAdvancedProposedDiffBlock(proposedDiff: string) {
  const text = stripWrappingFence(proposedDiff)
    .replace(/^-?\s*Note:\s*Proposed only;.*$/gim, "")
    .replace(/^```diff\s*$/gim, "")
    .replace(/^```\s*$/gim, "")
    .trim();
  if (!text) {
    return "- Note: Proposed diff was not returned by Codex for this RCA. Re-run with more concrete source evidence if a code patch is required.";
  }
  return [
    "- Note: Proposed only; not applied or verified in this RCA-only run.",
    "",
    trimRcaBlock(text, 220, 14000)
  ].join("\n");
}

function pickAdvancedSection(sections: Record<string, string>, finalSections: Record<string, string>, name: string) {
  return cleanRcaField(firstPresent(
    sections[name],
    pickFinalSection(finalSections, name)
  ));
}

function buildDefaultAdvancedPlan(payload: any) {
  const request = payload?.session?.request || {};
  const product = cleanRcaField(request.product || request.productLabel || payload?.productLabel || "selected product");
  const ticket = cleanRcaField(request.ticketId || payload?.ticketId || "");
  const ticketLabel = ticket ? `Jira ${ticket}` : request.ticketSource === "description" ? "provided problem statement" : "ticket evidence";
  return [
    `- Select ${product} relevant code paths`,
    `- Anchor analysis to ${ticketLabel} evidence only`,
    "- Map call chain and isolate root cause(s)",
    "- Propose next-step fix scope (no edits/builds in RCA-only)"
  ].join("\n");
}

function buildDefaultAdvancedMcpCalls() {
  return "- None. Used prefetched Jira/problem evidence; no live Jira/automation invoked.";
}

function buildAdvancedResultSummary(resultSummary: string, whyItFails: string, culprit: string, completeFix: string, fixExplanation: string) {
  const symptom = firstPresent(
    extractLabeledRcaValue(resultSummary, /^symptom$/i),
    firstMeaningfulRcaLine(resultSummary),
    firstMeaningfulRcaLine(whyItFails),
    firstMeaningfulRcaLine(culprit)
  );
  const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 4);
  const rootCauses = summaryRootCauses.length
    ? summaryRootCauses
    : uniqueRcaLines([
      ...meaningfulRcaLines(whyItFails, 3),
      ...meaningfulRcaLines(culprit, 2)
    ]).slice(0, 4);
  const nextFix = firstPresent(
    extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i),
    firstMeaningfulRcaLine(completeFix),
    firstMeaningfulRcaLine(fixExplanation)
  );

  return [
    symptom ? `- Symptom: ${symptom}` : "",
    rootCauses.length ? `- Root causes (from Jira evidence)\n${formatNumberedRcaLines(rootCauses)}` : "",
    nextFix ? `- Most likely next fix step: ${nextFix}` : ""
  ].filter(Boolean).join("\n\n");
}

function extractRcaHeading(finalMessage: string, payload: any) {
  const direct = String(finalMessage || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^#{1,6}\s+/, ""))
    .find((line) => /^RCA:\s*\S/i.test(line));
  if (direct) {
    return direct;
  }

  const request = payload?.session?.request || {};
  const ticket = cleanRcaField(request.ticketId || payload?.ticketId || "");
  const title = cleanRcaField(request.issueTitle || request.derivedIssueTitle || "");
  if (ticket && title) {
    return `RCA: ${ticket} - ${title}`;
  }
  if (ticket) {
    return `RCA: ${ticket}`;
  }
  if (title) {
    return `RCA: ${title}`;
  }
  if (request.ticketSource === "description") {
    return "RCA: Problem Statement";
  }
  return "RCA";
}

function buildDefaultVerificationLoop(fields: Record<string, string>) {
  const fix = firstMeaningfulRcaLine(fields["Complete Fix"] || "");
  return [
    "- Not executed in this RCA-only run.",
    "",
    "- Next steps",
    fix ? `- ${fix}` : "- Build the target branch and run focused regression tests for the affected flow.",
    "- Validate the reported scenario against the baseline and proposed fix build.",
    "- Confirm no adjacent product flows regress."
  ].join("\n");
}

function buildDefaultUiValidation() {
  return [
    "- Not executed in this RCA-only run.",
    "- Pending validation: reproduce the reported workflow in the target product UI/workstation and confirm the corrected output."
  ].join("\n");
}

function buildDefaultStepByStepSolution(payload: any, fields: Record<string, string>) {
  const request = payload?.session?.request || {};
  const ticket = cleanRcaField(request.ticketId || payload?.ticketId || (request.ticketSource === "description" ? "Problem Statement" : "requested issue"));
  const fixLines = meaningfulRcaLines(fields["Complete Fix"] || "", 4);
  const uncertainty = meaningfulRcaLines(fields["Remaining Uncertainty"] || "", 2);
  return [
    `- Scope: ${ticket}. No code changes were applied in this RCA-only run.`,
    "",
    "- Steps",
    ...(fixLines.length ? fixLines.map((line, index) => `${index + 1}) ${line}`) : [
      "1) Apply the proposed fix in the affected code path.",
      "2) Add targeted regression coverage for the reported scenario.",
      "3) Validate the fix on the product branch before handoff."
    ]),
    ...(uncertainty.length ? ["", "- Guardrails", ...uncertainty.map((line) => `- ${line}`)] : [])
  ].join("\n");
}

function normalizeAdvancedFieldBody(field: string, value: string) {
  if (field === "Proposed Diff") {
    return buildAdvancedProposedDiffBlock(value);
  }
  if (field === "Confidence") {
    return extractConfidenceLevel(value);
  }
  if (field === "Code Evidence") {
    return stripWrappingFence(value);
  }
  return cleanRcaField(value);
}

function buildAdvancedAnalysis(payload: any) {
  const fields = payload?.rcaFields || payload?.session?.parsed?.rcaFields || {};
  const sections = payload?.sections || payload?.session?.parsed?.sections || {};
  const finalMessage = payload?.message || payload?.session?.output?.finalMessage || "";
  const finalSections = parseFinalMessageSections(finalMessage);

  const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
  const whyItFails = cleanRcaField(firstPresent(fields["Why It Fails"], pickFinalSection(finalSections, "Why It Fails")));
  const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
  const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
  const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
  const normalizedFields: Record<string, string> = { ...fields };
  const rootCauseCode = cleanRcaField(firstPresent(fields["Root Cause Code"], pickFinalSection(finalSections, "Root Cause Code")));
  const codeEvidence = cleanRcaField(firstPresent(fields["Code Evidence"], pickFinalSection(finalSections, "Code Evidence")));
  const advancedRootCause = buildAdvancedRootCauseBlock(whyItFails, rootCauseCode, codeEvidence);

  const plan = pickAdvancedSection(sections, finalSections, "Plan") || buildDefaultAdvancedPlan(payload);
  const mcpCalls = pickAdvancedSection(sections, finalSections, "MCP Calls") || buildDefaultAdvancedMcpCalls();
  const summary = buildAdvancedResultSummary(resultSummary, whyItFails, culprit, completeFix, fixExplanation);
  const verificationLoop = pickAdvancedSection(sections, finalSections, "Verification Loop") || buildDefaultVerificationLoop(normalizedFields);
  const uiValidation = pickAdvancedSection(sections, finalSections, "UI Validation") || buildDefaultUiValidation();
  const stepByStepSolution = pickAdvancedSection(sections, finalSections, "Step-by-Step Solution") || buildDefaultStepByStepSolution(payload, normalizedFields);
  const rcaHeading = extractRcaHeading(finalMessage, payload);

  const parts = [
    plan ? `Plan\n${plan}` : "",
    mcpCalls ? `MCP Calls\n${mcpCalls}` : "",
    summary ? `Result Summary\n${summary}` : resultSummary ? `Result Summary\n${resultSummary}` : "",
    rcaHeading
  ];

  let advancedRootCauseInserted = false;
  let advancedProposedDiffInserted = false;
  for (const field of ADVANCED_RCA_FIELD_ORDER) {
    const body = normalizeAdvancedFieldBody(field, cleanRcaField(firstPresent(fields[field], pickFinalSection(finalSections, field))));
    if (body) {
      parts.push(`${field}\n${body}`);
      if (field === "Proposed Diff") {
        advancedProposedDiffInserted = true;
      }
    }
    if (field === "Call Chain" && advancedRootCause) {
      parts.push(`Root Cause\n${advancedRootCause}`);
      advancedRootCauseInserted = true;
    }
  }
  if (advancedRootCause && !advancedRootCauseInserted) {
    parts.push(`Root Cause\n${advancedRootCause}`);
  }
  if (!advancedProposedDiffInserted) {
    parts.push(`Proposed Diff\n${buildAdvancedProposedDiffBlock("")}`);
  }

  parts.push(
    verificationLoop ? `Verification Loop\n${verificationLoop}` : "",
    uiValidation ? `UI Validation\n${uiValidation}` : "",
    stepByStepSolution ? `Step-by-Step Solution\n${stepByStepSolution}` : ""
  );

  return parts.filter(Boolean).join("\n\n");
}

function buildCompressedRcaResult(payload: any) {
  const fields = payload?.rcaFields || payload?.session?.parsed?.rcaFields || {};
  const sections = payload?.sections || payload?.session?.parsed?.sections || {};
  const finalMessage = payload?.message || payload?.session?.output?.finalMessage || "";
  const finalSections = parseFinalMessageSections(finalMessage);

  const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
  const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
  const callChain = cleanRcaField(firstPresent(fields["Call Chain"], pickFinalSection(finalSections, "Call Chain")));
  const rootCauseCode = cleanRcaField(firstPresent(fields["Root Cause Code"], pickFinalSection(finalSections, "Root Cause Code")));
  const codeEvidence = cleanRcaField(firstPresent(fields["Code Evidence"], pickFinalSection(finalSections, "Code Evidence")));
  const logEvidence = cleanRcaField(firstPresent(fields["Log Evidence"], pickFinalSection(finalSections, "Log Evidence")));
  const reproEvidence = cleanRcaField(firstPresent(fields["Reproducible Evidence"], pickFinalSection(finalSections, "Reproducible Evidence")));
  const whyItFails = cleanRcaField(firstPresent(
    fields["Why It Fails"],
    pickFinalSection(finalSections, "Why It Fails")
  ));
  const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
  const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
  const proposedDiff = cleanRcaField(firstPresent(fields["Proposed Diff"], pickFinalSection(finalSections, "Proposed Diff")));
  const affectedFiles = cleanRcaField(firstPresent(fields["All Affected Files"], pickFinalSection(finalSections, "All Affected Files")));
  const confidence = cleanRcaField(firstPresent(
    fields.Confidence,
    pickFinalSection(finalSections, "Confidence"),
    sections.Confidence
  ));
  const confidenceLevel = confidence ? extractConfidenceLevel(confidence) : "";
  const remainingUncertainty = cleanRcaField(firstPresent(fields["Remaining Uncertainty"], pickFinalSection(finalSections, "Remaining Uncertainty")));
  const summary = buildSummaryBlock(resultSummary, whyItFails, culprit, completeFix, fixExplanation);
  const observedExpected = cleanRcaField(firstPresent(
    fields["Observed vs Expected"],
    pickFinalSection(finalSections, "Observed vs Expected"),
    buildObservedExpected(resultSummary, logEvidence, culprit, whyItFails)
  ));
  const reproSufficiency = buildReproSufficiency(reproEvidence, logEvidence, rootCauseCode, confidenceLevel, remainingUncertainty);
  const evidence = buildEvidenceBlock(culprit, callChain, logEvidence, affectedFiles);
  const rootCause = buildRootCauseBlock(whyItFails, culprit, resultSummary);
  const rootCauseWithCode = buildRootCauseWithCodeBlock(rootCause, rootCauseCode, codeEvidence);
  const recommendedFix = buildRecommendedFix(completeFix, fixExplanation);
  const proposedDiffBlock = buildProposedDiffBlock(proposedDiff);

  const parts = [
    summary ? `Summary\n${summary}` : "",
    observedExpected ? `Observed vs Expected\n${observedExpected}` : "",
    reproSufficiency ? `Repro Sufficiency\n${reproSufficiency}` : "",
    evidence ? `Evidence\n${evidence}` : "",
    rootCauseWithCode ? `Root Cause\n${rootCauseWithCode}` : "",
    confidenceLevel ? `Confidence\n${confidenceLevel}` : "",
    remainingUncertainty ? `Remaining Uncertainty\n${remainingUncertainty}` : "",
    recommendedFix ? `Recommended Fix\n${recommendedFix}` : "",
    fixExplanation ? `Fix Explanation\n${fixExplanation}` : "",
    affectedFiles ? `Files to update\n${affectedFiles}` : "",
    `Proposed Diff\n${proposedDiffBlock}`,
  ].filter(Boolean);

  return parts.join("\n\n");
}

function parseRcaResultSections(value: string) {
  const sections: { heading: string; body: string }[] = [];
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  let activeHeading = "";
  let activeLines: string[] = [];
  let inFence = false;

  function flush() {
    if (activeHeading) {
      const body = activeLines.join("\n").trim();
      const previous = sections[sections.length - 1];
      if (body && previous && normalizeSectionName(previous.heading) === normalizeSectionName(activeHeading)) {
        previous.body = [previous.body, body].filter(Boolean).join("\n\n");
      } else if (body) {
        sections.push({
          heading: activeHeading,
          body
        });
      }
    }
    activeHeading = "";
    activeLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      if (activeHeading) {
        activeLines.push(line);
      }
      continue;
    }

    const heading = stripMarkdownHeading(trimmed.replace(/\*\*/g, ""));
    const isSectionHeading = Boolean(heading) && RCA_RESULT_DISPLAY_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading));
    if (!inFence && isSectionHeading) {
      flush();
      activeHeading = heading;
      continue;
    }

    if (activeHeading) {
      activeLines.push(line);
    }
  }

  flush();
  return sections;
}

function stripMarkdownHeading(value: string) {
  return value.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
}

function getRcaToneClass(sectionName: string) {
  const normalized = normalizeSectionName(sectionName);
  if (normalized === "summary") {
    return "is-summary";
  }
  if (
    normalized === "recommended fix"
    || normalized === "fix explanation"
    || normalized === "files to update"
    || normalized === "proposed diff"
    || normalized === "proposed solution"
  ) {
    return "is-fix";
  }
  return "";
}

function getConfidenceToneClass(value: string) {
  const level = extractConfidenceLevel(value);
  return isPositiveConfidenceLevel(level) ? "is-confidence-high" : "is-confidence-other";
}

function getRcaSectionClass(sectionName: string, body = "") {
  const toneClass = getRcaToneClass(sectionName);
  if (normalizeSectionName(sectionName) === "confidence") {
    return [toneClass, getConfidenceToneClass(body)].filter(Boolean).join(" ");
  }
  return toneClass;
}

function isRichHeading(line: string) {
  const normalized = line.trim();
  if (!normalized) {
    return false;
  }
  if (/^#{1,6}\s+/.test(normalized)) {
    return true;
  }
  if (/^(Plan|MCP Calls|Result Summary|RCA|Comments|Comment Evidence|Audit History|Attachment Evidence|Attachments|Reproducible Evidence|Subsystem|Investigation Tier|Culprit|Call Chain|Root Cause Code|Code Evidence|Log Evidence|Why It Fails|Complete Fix|Fix Explanation|Files to update|Proposed Diff|Proposed Solution|All Affected Files|Confidence|Remaining Uncertainty|Verification Loop|UI Validation|Step-by-Step Solution|Summary|Observed vs Expected|Repro Sufficiency|Evidence|Root Cause|Recommended Fix)$/i.test(normalized.replace(/:$/, ""))) {
    return true;
  }
  return normalized.length <= 70 && /:$/.test(normalized) && !/^\d+\./.test(normalized);
}

function isStandaloneInlineCode(line: string) {
  return /^`[^`]+`[.;,:]?$/.test(line.trim());
}

function cleanStandaloneCode(line: string) {
  return line.trim().replace(/^`/, "").replace(/`[.;,:]?$/, "");
}

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`|[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/g).filter(Boolean).map((part, index) => {
    if (/^`[^`]+`$/.test(part)) {
      return <code class="inline-code" key={`code-${index}`}>{part.slice(1, -1)}</code>;
    }
    if (/(?:[\\/]|\.)(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?$/i.test(part)) {
      return <code class="file-token" key={`file-${index}`}>{part}</code>;
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

function collapseRepeatedLiveFileRefs(text: string) {
  const filePattern = /(?:[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/gi;
  const matches = [...String(text || "").matchAll(filePattern)];
  const seen = new Map<string, { first: string; refs: string[]; count: number }>();

  for (const match of matches) {
    const token = match[0];
    const refMatch = token.match(/^(.*?)(?::(\d+))$/);
    const base = refMatch ? refMatch[1] : token;
    const key = base.toLowerCase();
    const entry = seen.get(key) || { first: base, refs: [], count: 0 };
    entry.count += 1;
    if (refMatch?.[2] && !entry.refs.includes(refMatch[2])) {
      entry.refs.push(refMatch[2]);
    }
    seen.set(key, entry);
  }

  let result = String(text || "");
  for (const entry of seen.values()) {
    if (entry.count < 2) {
      continue;
    }
    let firstWritten = false;
    result = result.replace(filePattern, (token) => {
      const refMatch = token.match(/^(.*?)(?::(\d+))$/);
      const base = refMatch ? refMatch[1] : token;
      if (base.toLowerCase() !== entry.first.toLowerCase()) {
        return token;
      }
      if (firstWritten) {
        return "";
      }
      firstWritten = true;
      return entry.first;
    });
  }

  return result
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;:)])/g, "$1")
    .replace(/([,(;:])\s*([,);])/g, "$2")
    .trim();
}

function isCommandLikeLine(value: string) {
  return /^\s*(npm|npx|node|git|rg|Get-ChildItem|Select-String|Invoke-WebRequest|powershell|cmd|codex|dotnet|msbuild|where|docker)\b/i.test(value)
    || /\b(exec|spawn|command|started|completed|failed)\b/i.test(value) && /\b(node|npm|git|rg|codex|dotnet|powershell|cmd)\b/i.test(value);
}

function isSearchCommand(value: string) {
  return /\b(rg|Select-String|Get-ChildItem|findstr)\b/i.test(String(value || ""));
}

function summarizeSearchCommand(value: string) {
  const command = String(value || "").replace(/\s+/g, " ").trim();
  if (!command) {
    return "targeted source search";
  }
  return compactText(command, 160);
}

function summarizeSearchOutput(value: string) {
  const lines = String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return "";
  }
  const preview = lines.slice(0, 8).join("\n");
  const omitted = lines.length > 8 ? `\n... ${lines.length - 8} more result lines hidden in live view.` : "";
  return `Search result preview:\n${compactText(preview, 900)}${omitted}`;
}

function renderLiveLine(text: string) {
  const displayText = collapseRepeatedLiveFileRefs(text);
  const kind = /^RCA successful:/i.test(text)
    ? "success"
    : /^RCA failed:/i.test(text)
      ? "error"
      : /^RCA stopped:/i.test(text)
        ? "warning"
        : /^warning:|^stderr:/i.test(text)
          ? "warning"
          : isCommandLikeLine(text)
            ? "command"
            : "";
  return (
    <p class={`live-output-line ${kind}`}>
      {renderInlineCode(displayText)}
    </p>
  );
}

function shouldSuppressLiveLine(text: string) {
  return /\bNo stdout or stderr has arrived for\b/i.test(String(text || ""));
}

function formatSessionHistoryTitle(session: SessionHistoryItem) {
  return compactText(
    session.request?.displayName
    || session.summary?.displayName
    || [
      session.request?.ticketId || session.summary?.ticketId,
      session.request?.issueTitle || session.request?.derivedIssueTitle || session.summary?.preview
    ].filter(Boolean).join(" - ")
    || session.id,
    88
  );
}

function normalizeRunState(value: string): RunState {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "completed") {
    return "completed";
  }
  if (normalized === "running") {
    return "running";
  }
  if (normalized === "cancelled" || normalized === "stopped") {
    return "stopped";
  }
  if (normalized === "failed") {
    return "failed";
  }
  return "idle";
}

function renderCodeBlock(lines: string[], key: string) {
  return (
    <pre class="rich-code-block" key={key}>
      <code>
        {lines.map((line, index) => {
          const trimmed = line.trimStart();
          const diffClass = trimmed.startsWith("+")
            ? "diff-add"
            : trimmed.startsWith("-")
              ? "diff-remove"
              : "";
          return <span class={diffClass} key={`${key}-line-${index}`}>{line || " "}</span>;
        })}
      </code>
    </pre>
  );
}

function renderRichText(value: string, variant = "default") {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: any[] = [];
  let paragraph: string[] = [];
  let code: string[] = [];
  let inFence = false;
  let activeRichHeading = "";

  function flushParagraph() {
    const text = paragraph.join("\n").trim();
    paragraph = [];
    if (!text) {
      return;
    }
    const singleLine = !text.includes("\n");
    if (singleLine && isRichHeading(text)) {
      const headingText = stripMarkdownHeading(text);
      activeRichHeading = normalizeSectionName(headingText);
      blocks.push(<h3 class={`rich-heading ${getRcaToneClass(headingText)}`.trim()} key={`heading-${blocks.length}`}>{headingText}</h3>);
      return;
    }
    const isConfidenceParagraph = activeRichHeading === "confidence";
    const displayText = isConfidenceParagraph ? extractConfidenceLevel(text) : text;
    const displayLines = displayText.split("\n");
    const paragraphClass = [
      "rich-paragraph",
      isConfidenceParagraph ? "confidence-value" : "",
      isConfidenceParagraph ? (isPositiveConfidenceLevel(displayText) ? "is-confidence-high" : "is-confidence-other") : ""
    ].filter(Boolean).join(" ");
    blocks.push(
      <p class={paragraphClass} key={`paragraph-${blocks.length}`}>
        {displayLines.map((line, index) => (
          <span key={`paragraph-line-${index}`}>
            {renderInlineCode(line)}
            {index < displayLines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
    if (isConfidenceParagraph) {
      activeRichHeading = "";
    }
  }

  function flushCode() {
    if (!code.length) {
      return;
    }
    blocks.push(renderCodeBlock(code, `code-${blocks.length}`));
    code = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (/^```/.test(line.trim())) {
      if (inFence) {
        flushCode();
        inFence = false;
      } else {
        flushParagraph();
        inFence = true;
      }
      continue;
    }

    if (inFence) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    if (isStandaloneInlineCode(line)) {
      flushParagraph();
      blocks.push(renderCodeBlock([cleanStandaloneCode(line)], `inline-code-block-${blocks.length}`));
      continue;
    }

    if (isRichHeading(line)) {
      flushParagraph();
      const headingText = stripMarkdownHeading(line);
      activeRichHeading = normalizeSectionName(headingText);
      blocks.push(<h3 class={`rich-heading ${getRcaToneClass(headingText)}`.trim()} key={`heading-${blocks.length}`}>{headingText}</h3>);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushCode();

  if (!blocks.length) {
    return <p class="rich-paragraph">{value}</p>;
  }

  return <div class={`rich-output ${variant}`}>{blocks}</div>;
}

export const App = registerCustomElement(
  "app-root",
  ({ appName = "Oracle Restaurants RCA", userLogin = "Signed in" }: Props) => {
    const [runtime, setRuntime] = useState<RuntimeConfig>({
      connected: false,
      platform: "",
      serverMode: "",
      requireElevatedExecution: false,
      elevated: false,
      products: FALLBACK_PRODUCTS,
      defaultPrompt: ""
    });
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [localAgentStatus, setLocalAgentStatus] = useState<LocalAgentStatus>(EMPTY_LOCAL_AGENT_STATUS);
    const [developerMode, setDeveloperMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState("simphony");
    const [folderPath, setFolderPath] = useState("");
    const [ticketType, setTicketType] = useState<"bugdb" | "jira" | "description">("jira");
    const [ticketId, setTicketId] = useState("");
    const [bugDescription, setBugDescription] = useState("");
    const [isBrowsingWorkspace, setIsBrowsingWorkspace] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(DEFAULT_CHAT);
    const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState("");
    const [deletingSessionId, setDeletingSessionId] = useState("");
    const [liveOutput, setLiveOutput] = useState<string[]>([]);
    const [rcaResult, setRcaResult] = useState("");
    const [advancedAnalysis, setAdvancedAnalysis] = useState("");
    const [activeView, setActiveView] = useState<"workspace" | "advanced">("workspace");
    const [runState, setRunState] = useState<RunState>("idle");
    const [statusText, setStatusText] = useState("Ready");
    const [currentSessionId, setCurrentSessionId] = useState("");
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const controllerRef = useRef<AbortController | null>(null);
    const liveOutputRef = useRef<HTMLDivElement>(null);
    const endNoticeShownRef = useRef(false);
    const lastFailureDetailRef = useRef("");

    const products = useMemo(() => normalizeProducts(runtime.products || []), [runtime.products]);
    const selectedProductConfig = products.find((product) => product.key === selectedProduct) || products[0];
    const workspace = developerMode
      ? folderPath.trim()
      : selectedProductConfig?.defaultWorkspace || "";
    const isDescriptionTicket = ticketType === "description";
    const ticketSourceLabel = isDescriptionTicket ? "Problem Statement" : "Jira";
    const ticketInputLabel = isDescriptionTicket ? "Problem Statement" : "Jira Number";
    const ticketPlaceholder = "FPS-137892";
    const ticketReady = isDescriptionTicket ? Boolean(bugDescription.trim()) : Boolean(ticketId.trim());
    const developerAgentReady = !developerMode || localAgentStatus.connected;
    const canRun = ticketReady && Boolean(workspace) && developerAgentReady && runState !== "running";
    const runDisabledReason = runState === "running"
      ? "RCA is already running."
      : developerMode && !localAgentStatus.connected
        ? "Start the local client agent on your machine before starting RCA."
        : developerMode && !folderPath.trim()
          ? "Please select the code folder before starting RCA."
          : !ticketReady
            ? `Please enter the ${ticketInputLabel} before starting RCA.`
            : !workspace
              ? "Please select a source before starting RCA."
              : "";
    const advancedEnabled = runState === "completed" || Boolean(advancedAnalysis);
    const signedInLabel = authUser?.displayName || authUser?.email || authUser?.username || userLogin;
    const contextLines = useMemo(() => {
      const sourceMode = developerMode ? "Developer Mode" : "Product Mode";
      const sourceLabel = developerMode
        ? folderPath.trim() || "No developer workspace selected"
        : selectedProductConfig?.label || selectedProduct || "No product selected";
      const ticketLabel = isDescriptionTicket
        ? `Problem Statement: ${bugDescription.trim() ? "provided" : "waiting for input"}`
        : ticketId.trim()
          ? `${ticketSourceLabel}: ${ticketId.trim()}`
          : `${ticketSourceLabel}: waiting for input`;
      const lines = [
        `Mode: ${sourceMode}`,
        developerMode ? `Workspace: ${sourceLabel}` : `Product: ${sourceLabel}`,
        ticketLabel
      ];
      if (runState === "idle") {
        lines.push(canRun ? "Ready: start RCA when you are ready." : "Next: choose source details and enter the ticket number or problem statement.");
      }
      return lines;
    }, [bugDescription, canRun, developerMode, folderPath, isDescriptionTicket, runState, selectedProduct, selectedProductConfig, ticketId, ticketSourceLabel, ticketType]);

    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
      loadInitialState();
    }, []);

    useEffect(() => {
      if (developerMode) {
        loadLocalAgentStatus();
      }
      if (!developerMode || localAgentStatus.connected) {
        return undefined;
      }
      const timer = window.setInterval(() => {
        loadLocalAgentStatus();
      }, LOCAL_AGENT_RECONNECT_MS);
      return () => window.clearInterval(timer);
    }, [developerMode, localAgentStatus.connected]);

    useEffect(() => {
      if (liveOutputRef.current) {
        liveOutputRef.current.scrollTop = liveOutputRef.current.scrollHeight;
      }
    }, [liveOutput]);

    async function loadInitialState() {
      setIsLoadingConfig(true);
      await Promise.all([loadConfig(), loadAuth(), loadLocalAgentStatus(), loadSessionHistory()]);
      setIsLoadingConfig(false);
    }

    async function loadConfig() {
      try {
        const config = await fetchJson<any>("/api/config");
        setRuntime({
          connected: true,
          platform: config.platform || "",
          serverMode: config.serverMode || "",
          requireElevatedExecution: Boolean(config.requireElevatedExecution),
          elevated: Boolean(config.elevated),
          products: normalizeProducts(config.products || []),
          defaultPrompt: config.defaultPrompt || ""
        });
      } catch (error) {
        setRuntime((previous) => ({ ...previous, connected: false }));
      }
    }

    async function loadAuth() {
      try {
        const auth = await fetchJson<any>("/auth/me");
        setAuthUser(auth.user || null);
      } catch (error) {
        setAuthUser(null);
      }
    }

    async function loadLocalAgentStatus() {
      try {
        const brokerStatus = await fetchJson<any>("/api/broker/status");
        if (brokerStatus.connected) {
          setLocalAgentStatus({
            connected: true,
            host: brokerStatus.machineName || "user machine",
            port: Number(brokerStatus.localPort || 3210),
            serverMode: "broker",
            elevated: false,
            requireElevatedExecution: false,
            transport: "broker"
          });
          return;
        }
      } catch (error) {
        // The local-only agent package does not expose the hosted broker endpoints.
      }

      try {
        const status = await fetchJson<any>(`${DEFAULT_LOCAL_AGENT_BASE_URL}/api/health`);
        if (status.serverMode !== "agent") {
          setLocalAgentStatus(EMPTY_LOCAL_AGENT_STATUS);
          return;
        }
        setLocalAgentStatus({
          connected: Boolean(status.ok),
          host: status.host || "",
          port: Number(status.port || 3210),
          serverMode: status.serverMode || "",
          elevated: Boolean(status.elevated),
          requireElevatedExecution: Boolean(status.requireElevatedExecution),
          transport: "direct"
        });
      } catch (error) {
        setLocalAgentStatus(EMPTY_LOCAL_AGENT_STATUS);
      }
    }

    async function loadSessionHistory() {
      try {
        const result = await fetchJson<{ sessions?: SessionHistoryItem[] }>("/api/sessions");
        setSessionHistory(Array.isArray(result.sessions) ? result.sessions : []);
      } catch (error) {
        setSessionHistory([]);
      }
    }

    async function openHistorySession(sessionId: string) {
      if (!sessionId) {
        return;
      }
      try {
        const session = await fetchJson<any>(`/api/sessions/${encodeURIComponent(sessionId)}`);
        const output = session?.output || {};
        const liveLines = String(output.liveText || "")
          .replace(/\r\n/g, "\n")
          .split("\n")
          .map((line) => line.trimEnd())
          .filter((line) => line && !shouldSuppressLiveLine(line));
        setSelectedHistoryId(sessionId);
        setCurrentSessionId(sessionId);
        setLiveOutput(liveLines.slice(-500));
        setRcaResult(buildCompressedRcaResult({ session }) || output.finalMessage || "");
        setAdvancedAnalysis(buildAdvancedAnalysis({ session }) || output.finalMessage || "");
        setRunState(normalizeRunState(session.status));
        setStatusText(session.status ? String(session.status) : "Loaded");
        setActiveView("workspace");
      } catch (error) {
        appendLive(`History load failed: ${compactText((error as Error).message, 180)}`);
      }
    }

    async function deleteHistorySession(sessionId: string) {
      if (!sessionId || deletingSessionId) {
        return;
      }
      setDeletingSessionId(sessionId);
      try {
        await fetchJson(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
        setSessionHistory((sessions) => sessions.filter((session) => session.id !== sessionId));
        if (selectedHistoryId === sessionId) {
          setSelectedHistoryId("");
          setCurrentSessionId("");
          setLiveOutput([]);
          setRcaResult("");
          setAdvancedAnalysis("");
          setRunState("idle");
          setStatusText("Ready");
          setActiveView("workspace");
        }
      } catch (error) {
        appendLive(`Delete failed: ${compactText((error as Error).message, 180)}`);
      } finally {
        setDeletingSessionId("");
      }
    }

    function developerApiUrl(apiPath: string) {
      const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
      if (localAgentStatus.transport === "broker") {
        return normalizedPath.startsWith("/api/")
          ? `/api/broker/${normalizedPath.slice("/api/".length)}`
          : `/api/broker${normalizedPath}`;
      }
      return `${DEFAULT_LOCAL_AGENT_BASE_URL}${normalizedPath}`;
    }

    function addChat(role: ChatMessage["role"], text: string) {
      setChatHistory((messages) => [
        ...messages,
        {
          id: `${Date.now()}-${messages.length}`,
          role,
          text,
          time: formatClock()
        }
      ]);
    }

    function appendLive(text: string) {
      if (shouldSuppressLiveLine(text)) {
        return;
      }
      setLiveOutput((lines) => [...lines, text].slice(-500));
    }

    async function stopRun() {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (currentSessionId) {
        try {
          const stopUrl = developerMode
            ? developerApiUrl(`/api/sessions/${encodeURIComponent(currentSessionId)}/stop`)
            : `/api/sessions/${encodeURIComponent(currentSessionId)}/stop`;
          await fetchJson(stopUrl, { method: "POST" });
        } catch (error) {
          appendLive(`Stop request note: ${(error as Error).message}`);
        }
      }
      setRunState("stopped");
      setStatusText("Stopped");
      appendLive("RCA stopped: the active run was cancelled before completion.");
      addChat("system", "The active RCA run was stopped.");
    }

    async function browseWorkspace() {
      if (developerMode && !localAgentStatus.connected) {
        await loadLocalAgentStatus();
        appendLive("Browse failed: local client agent is not connected on your machine.");
        return;
      }
      setIsBrowsingWorkspace(true);
      try {
        const params = new URLSearchParams();
        if (folderPath.trim()) {
          params.set("current", folderPath.trim());
        }
        const browseUrl = developerMode ? developerApiUrl("/api/pick-workspace") : "/api/pick-workspace";
        const result = await fetchJson<{ path?: string; message?: string }>(`${browseUrl}?${params.toString()}`);
        if (result.path) {
          setFolderPath(result.path);
          appendLive(`Workspace selected: ${result.path}`);
          return;
        }
        appendLive(result.message || "No developer workspace was selected.");
      } catch (error) {
        appendLive(`Browse failed: ${compactText((error as Error).message, 150)}`);
      } finally {
        setIsBrowsingWorkspace(false);
      }
    }

    async function startRun() {
      if (!canRun) {
        addChat("system", "Add the required ticket and workspace details before starting RCA.");
        return;
      }

      const productLabel = developerMode ? "Developer Workspace" : selectedProductConfig?.label || selectedProduct;
      const descriptionText = bugDescription.trim();
      const ticketLabel = isDescriptionTicket ? "Problem Statement" : `${ticketSourceLabel} ${ticketId.trim()}`;
      const nextController = new AbortController();
      controllerRef.current = nextController;
      setRunState("running");
      setStatusText("Running");
      setCurrentSessionId("");
      setSelectedHistoryId("");
      endNoticeShownRef.current = false;
      lastFailureDetailRef.current = "";
      setLiveOutput([]);
      setRcaResult("");
      setAdvancedAnalysis("");
      setActiveView("workspace");
      addChat("user", `${ticketLabel} RCA for ${productLabel}`);

      try {
        let prefetchedTicketEvidence: any = null;
        if (developerMode && ticketType === "jira") {
          appendLive(`Fetching Jira evidence for ${ticketId.trim()}`);
          prefetchedTicketEvidence = await fetchJson<any>("/api/ticket-evidence", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ticketSource: "jira",
              ticketId: ticketId.trim()
            })
          });
        }
        const runUrl = developerMode ? developerApiUrl("/api/run") : "/api/run";
        const response = await fetch(runUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream"
          },
          body: JSON.stringify({
            mode: "analyze",
            continueSession: false,
            product: developerMode ? productLabel : selectedProduct,
            productLabel,
            workspace,
            workspaceMode: "local",
            ticketSource: ticketType,
            ticketId: isDescriptionTicket ? "" : ticketId.trim(),
            bugDescription: isDescriptionTicket ? descriptionText : "",
            issueTitle: prefetchedTicketEvidence?.issueTitle || "",
            jiraEvidence: prefetchedTicketEvidence?.jiraEvidence || null,
            version: "",
            model: "",
            extraInstructions: PRODUCT_GENERIC_GUIDANCE
          }),
          signal: nextController.signal
        });

        if (!response.ok || !response.body) {
          const body = await response.text();
          throw new Error(body || `Run failed with HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n");
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            handleStreamBlock(block);
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setRunState("failed");
        setStatusText("Failed");
        appendLive(`RCA failed: ${(error as Error).message}`);
        addChat("assistant", `The RCA run failed: ${compactText((error as Error).message, 180)}`);
      } finally {
        controllerRef.current = null;
      }
    }

    function handleStreamBlock(block: string) {
      const parsed = parseSseBlock(block);
      if (!parsed) {
        return;
      }
      const { eventName, payload } = parsed;

      if (eventName === "status") {
        setCurrentSessionId(payload.sessionId || "");
        appendLive(`Session started: ${payload.displayName || payload.sessionId || "RCA run"}`);
        return;
      }

      if (eventName === "codex_event") {
        const parsedEvent = payload.parsed || payload || {};
        const item = parsedEvent.item || payload.item || {};
        const eventType = parsedEvent.type || payload.type || "";
        if (["thread.started", "turn.started", "item.started", "item.end"].includes(eventType)) {
          return;
        }

        if (eventType === "item.completed" && item.type === "command_execution") {
          const command = item.command || "";
          const status = item.status === "failed" ? "failed" : "completed";
          const output = item.aggregated_output || item.error || "";
          if (isSearchCommand(command)) {
            appendLive(`Search ${status}: ${summarizeSearchCommand(command)}`);
            const summarizedOutput = summarizeSearchOutput(output);
            if (summarizedOutput) {
              appendLive(summarizedOutput);
            }
          } else {
            appendLive(command ? `Command ${status}: ${command}` : `Command ${status}`);
            if (output) {
              appendLive(output);
            }
          }
          return;
        }

        if (eventType === "item.completed" && item.type === "mcp_tool_call") {
          const tool = [item.server, item.tool].filter(Boolean).join(".");
          appendLive(item.status === "failed"
            ? `Support lookup failed: ${tool || "MCP tool"} ${item.error || ""}`.trim()
            : `Support lookup completed: ${tool || "MCP tool"}`
          );
          return;
        }

        if (eventType === "ticket.preflight") {
          appendLive(payload.text || "Ticket preflight: fetching ticket details first.");
          return;
        }

        if (eventType === "ticket.details") {
          const detailLines = Array.isArray(payload.lines) ? payload.lines : [];
          if (detailLines.length) {
            detailLines.forEach((line: unknown) => appendLive(compactText(line, 320)));
          } else if (payload.text) {
            appendLive(compactText(payload.text, 320));
          }
          return;
        }

        const message = payload.message?.content
          || payload.item?.text
          || payload.item?.message
          || payload.delta
          || payload.text
          || payload.type
          || "";
        if (message) {
          appendLive(compactText(message, 900));
        }
        return;
      }

      if (eventName === "stderr" || eventName === "warning") {
        const detail = payload.text || payload.message || payload.detail || "";
        if (eventName === "stderr" && detail) {
          lastFailureDetailRef.current = String(detail);
        }
        appendLive(`${eventName}: ${compactText(detail, 700)}`);
        return;
      }

      if (eventName === "error") {
        const detail = payload.error || payload.message || "The RCA run failed before Codex produced output.";
        lastFailureDetailRef.current = String(detail);
        setRunState("failed");
        setStatusText("Failed");
        setRcaResult(String(detail));
        if (!endNoticeShownRef.current) {
          appendLive(`RCA failed: ${compactText(detail, 320)}`);
          endNoticeShownRef.current = true;
        }
        addChat("assistant", `The RCA run failed: ${compactText(detail, 180)}`);
        loadSessionHistory();
        return;
      }

      if (eventName === "final") {
        const finalMessage = payload.message || payload.session?.output?.finalMessage || "";
        const failureDetail = payload.stderr || payload.session?.output?.stderr || payload.error || "";
        const completed = payload.session?.status === "completed";
        const summary = buildCompressedRcaResult(payload);
        if (failureDetail) {
          lastFailureDetailRef.current = String(failureDetail);
        }
        if (payload.sessionId || payload.session?.id) {
          setSelectedHistoryId(payload.sessionId || payload.session?.id || "");
        }
        setAdvancedAnalysis(completed ? (buildAdvancedAnalysis(payload) || finalMessage) : finalMessage);
        setRcaResult(
          summary
          || finalMessage
          || failureDetail
          || (completed ? "RCA completed. Open Advanced Analysis for the full output." : "RCA failed. Check Live Output for the failure detail.")
        );
        setRunState(completed ? "completed" : "failed");
        setStatusText(completed ? "Completed" : "Failed");
        if (!endNoticeShownRef.current) {
          appendLive(completed
            ? "RCA successful: check RCA Result for the summary."
            : `RCA failed: ${compactText(failureDetail || finalMessage || "The run ended before a completed RCA was produced.", 320)}`
          );
          endNoticeShownRef.current = true;
        }
        addChat("assistant", completed ? "RCA completed. The summary is ready." : "The RCA run failed. Check Live Output for the failure detail.");
        loadSessionHistory();
        return;
      }

      if (eventName === "done") {
        const ok = payload.status === "completed" || payload.code === 0;
        const stopped = payload.status === "cancelled";
        setRunState(ok ? "completed" : stopped ? "stopped" : "failed");
        setStatusText(ok ? "Completed" : stopped ? "Stopped" : "Failed");
        if (!endNoticeShownRef.current) {
          const failureDetail = payload.error || payload.message || lastFailureDetailRef.current || "";
          appendLive(ok
            ? "RCA successful: check RCA Result for the summary."
            : stopped
              ? "RCA stopped: the active run was cancelled before completion."
              : `RCA failed: ${compactText(failureDetail || `Process exited with code ${payload.code ?? "unknown"}.`, 320)}`
          );
          endNoticeShownRef.current = true;
        }
      }
    }

    return (
      <div class="rca-app-shell">
        <header class="rca-topbar">
          <div class="rca-brand">
            <img src="styles/images/oracle_logo.svg" alt="Oracle" />
            <div>
              <h1>{appName}</h1>
              <p>Issue Investigation Tool</p>
            </div>
          </div>
          <div class="rca-top-actions">
            <div class="status-chip user-chip" title={signedInLabel}>
              <span>Signed in</span>
              <strong>{signedInLabel}</strong>
            </div>
            <div class={`status-chip ${runtime.connected ? "is-ok" : "is-bad"}`}>
              <span>Agent</span>
              <strong>{isLoadingConfig ? "Checking" : runtime.connected ? "Connected" : "Offline"}</strong>
            </div>
            <a class="status-chip signout-button" href="/auth/logout">
              <span>Session</span>
              <strong>Sign out</strong>
            </a>
          </div>
        </header>

        <main class={`rca-layout ${leftPanelCollapsed ? "left-collapsed" : ""}`}>
          {leftPanelCollapsed ? (
            <aside class="collapsed-rail" aria-label="Open investigation panel">
              <button
                class="rail-menu-button"
                type="button"
                aria-label="Open investigation panel"
                title="Open investigation panel"
                onClick={() => setLeftPanelCollapsed(false)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </aside>
          ) : null}

          <aside class="control-panel" aria-label="Investigation controls and chat" aria-hidden={leftPanelCollapsed ? "true" : "false"}>
            <div class="panel-command-bar">
              <div class="panel-oracle-tile" aria-label="Oracle Restaurants RCA panel">
                <span aria-hidden="true"></span>
              </div>
              <button
                class="panel-collapse-button"
                type="button"
                aria-label="Collapse investigation panel"
                title="Collapse investigation panel"
                onClick={() => setLeftPanelCollapsed(true)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
            <section class="control-card">
              <div class="section-heading">
                <span>Mode</span>
                <strong>Source</strong>
              </div>
              <div class="radio-row two-col" role="radiogroup" aria-label="Developer mode">
                <label>
                  <input
                    type="radio"
                    name="developerMode"
                    checked={!developerMode}
                    onChange={() => setDeveloperMode(false)}
                  />
                  Product
                </label>
                <label>
                  <input
                    type="radio"
                    name="developerMode"
                    checked={developerMode}
                    onChange={() => setDeveloperMode(true)}
                  />
                  Developer
                </label>
              </div>

              {!developerMode ? (
                <label class="field-block">
                  <span>Product name</span>
                  <select value={selectedProduct} onChange={(event) => setSelectedProduct((event.currentTarget as HTMLSelectElement).value)}>
                    {products.map((product) => (
                      <option value={product.key}>{product.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div class="browse-workspace-block">
                  <button class="browse-button" type="button" disabled={isBrowsingWorkspace || !localAgentStatus.connected} onClick={browseWorkspace}>
                    {isBrowsingWorkspace ? "Opening..." : "Browse Code Folder"}
                  </button>
                  <p class={`selected-path ${folderPath ? "" : "needs-attention"}`}>
                    {folderPath || "No folder selected"}
                  </p>
                </div>
              )}

              {developerMode ? (
                <p class={`workspace-note ${workspace && localAgentStatus.connected ? "" : "needs-attention"}`}>
                  {!localAgentStatus.connected
                    ? "Local client agent is not connected on your machine."
                    : workspace
                      ? "Developer workspace ready on your machine."
                      : "Choose the local code folder before starting RCA."}
                </p>
              ) : null}
            </section>

            <section class="control-card">
              <div class="section-heading">
                <span>Ticket</span>
                <strong>Bug Source</strong>
              </div>
              <div class="radio-row" role="radiogroup" aria-label="Ticket source">
                <label>
                  <input
                    type="radio"
                    name="ticketType"
                    checked={ticketType === "jira"}
                    onChange={() => setTicketType("jira")}
                  />
                  Jira Number
                </label>
                <label>
                  <input
                    type="radio"
                    name="ticketType"
                    checked={ticketType === "description"}
                    onChange={() => setTicketType("description")}
                  />
                  Problem Statement
                </label>
              </div>

              <label class="field-block">
                <span>{ticketInputLabel}</span>
                {isDescriptionTicket ? (
                  <textarea
                    class="bug-description-input"
                    rows={5}
                    placeholder="Problem Statement"
                    value={bugDescription}
                    onInput={(event) => setBugDescription((event.currentTarget as HTMLTextAreaElement).value)}
                  />
                ) : (
                  <input
                    value={ticketId}
                    onInput={(event) => {
                      const value = (event.currentTarget as HTMLInputElement).value;
                      setTicketId(ticketType === "jira" ? value.toUpperCase() : value);
                    }}
                    placeholder={ticketPlaceholder}
                  />
                )}
              </label>

              <div class="button-row">
                <button class="primary-button" type="button" disabled={!canRun} title={!canRun ? runDisabledReason : "Start RCA"} onClick={startRun}>
                  Start RCA
                </button>
                <button class="secondary-button" type="button" disabled={runState !== "running"} onClick={stopRun}>
                  Stop
                </button>
              </div>
              {!canRun && runDisabledReason ? <p class="run-disabled-note">{runDisabledReason}</p> : null}
            </section>

            <section class="control-card chat-card">
              <div class="section-heading">
                <span>Chat history</span>
              </div>
              <div class="session-history-list">
                {sessionHistory.length ? sessionHistory.map((session) => (
                  <article
                    class={`session-history-item ${selectedHistoryId === session.id ? "is-selected" : ""}`.trim()}
                    role="button"
                    tabIndex={0}
                    title={formatSessionHistoryTitle(session)}
                    onClick={() => openHistorySession(session.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openHistorySession(session.id);
                      }
                    }}
                  >
                    <div class="session-history-title">{formatSessionHistoryTitle(session)}</div>
                    <button
                      class="session-delete-button"
                      type="button"
                      aria-label={`Delete ${formatSessionHistoryTitle(session)}`}
                      title="Delete"
                      disabled={deletingSessionId === session.id || session.status === "running"}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteHistorySession(session.id);
                      }}
                    />
                  </article>
                )) : (
                  <p class="muted">No saved chats yet.</p>
                )}
              </div>
            </section>
          </aside>

          <section class="work-panel">
            <nav class="view-tabs" aria-label="RCA workspace views">
              <button class={activeView === "workspace" ? "active" : ""} type="button" onClick={() => setActiveView("workspace")}>
                RCA Workspace
              </button>
              <button class={activeView === "advanced" ? "active" : ""} type="button" disabled={!advancedEnabled} onClick={() => setActiveView("advanced")}>
                Advanced Analysis
              </button>
            </nav>

            {activeView === "workspace" ? (
              <div class="analysis-grid">
                <section class="live-output-panel">
                  <div class="panel-title">
                    <h2>Live Output</h2>
                    <span>{liveOutput.length} lines</span>
                  </div>
                  <div class="terminal-surface" ref={liveOutputRef}>
                    <div class="run-context-block">
                      {contextLines.map((line) => <p>{line}</p>)}
                    </div>
                    {liveOutput.length ? liveOutput.map((line) => renderLiveLine(line)) : (
                      <div class="empty-state">
                        <strong>No run started</strong>
                        <span>Choose source and start RCA to stream Codex output here.</span>
                      </div>
                    )}
                    {runState === "running" ? (
                      <p class="live-output-wait-cursor" aria-live="polite">
                        <span>Processing</span>
                        <span class="wait-dots" aria-hidden="true">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      </p>
                    ) : null}
                  </div>
                </section>

                <section class="rca-result-panel">
                  <div class="panel-title">
                    <h2>RCA Result</h2>
                    {runState !== "idle" ? (
                      <span>{runState === "completed" ? "Ready" : runState === "failed" ? "Failed" : runState === "stopped" ? "Stopped" : "Waiting"}</span>
                    ) : null}
                  </div>
                  <div class="result-surface">
                    {rcaResult ? parseRcaResultSections(rcaResult).map((section) => (
                      <article class={`rca-result-section ${getRcaSectionClass(section.heading, section.body)}`.trim()}>
                        <h3>{section.heading}</h3>
                        {section.body ? renderRichText(section.body, "rca-result") : null}
                      </article>
                    )) : <p class="muted">The RCA summary will appear here after Codex completes analysis.</p>}
                  </div>
                </section>
              </div>
            ) : (
              <section class="advanced-panel">
                <div class="panel-title">
                  <h2>Advanced Analysis</h2>
                  <span>Full output</span>
                </div>
                <div class="advanced-output">
                  {renderRichText(advancedAnalysis || "Advanced Analysis unlocks after RCA completion.", "advanced")}
                </div>
              </section>
            )}
          </section>
        </main>
      </div>
    );
  }
);


