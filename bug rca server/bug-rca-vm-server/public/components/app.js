var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "preact/jsx-runtime", "ojs/ojvcomponent", "preact/hooks", "ojs/ojcontext"], function (require, exports, jsx_runtime_1, ojvcomponent_1, hooks_1, Context) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA specific to the selected Jira/BugDB ticket, its exact symptom, and the selected Oracle Restaurants product. Do not drift into generic product guidance.";
    const DEFAULT_LOCAL_AGENT_BASE_URL = "http://127.0.0.1:3210";
    const LOCAL_AGENT_RECONNECT_MS = 3000;
    const LOCAL_AGENT_DISCONNECTED_NOTICE = "Local client agent is not connected. Start the local client agent to use Developer mode.";
    const EMPTY_LOCAL_AGENT_STATUS = {
        connected: false,
        host: "",
        port: 0,
        serverMode: "",
        elevated: false,
        requireElevatedExecution: false,
        transport: "none"
    };
    const FALLBACK_PRODUCTS = [
        { key: "simphony", label: "Simphony", family: "Oracle Restaurants Simphony", defaultWorkspace: "C:\\Code\\simphony" },
        { key: "rna", label: "RNA", family: "Oracle Restaurants Reporting and Analytics", defaultWorkspace: "C:\\Code\\rna" },
        { key: "flm", label: "FLM", family: "Oracle Restaurants Front Line Manager", defaultWorkspace: "C:\\Code\\flm" },
        { key: "cnc", label: "C&C", family: "Oracle Restaurants C&C", defaultWorkspace: "C:\\Code\\cnc" }
    ];
    const DEFAULT_CHAT = [
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
    function normalizeText(value) {
        return String(value || "").trim();
    }
    function compactText(value, limit = 220) {
        const normalized = normalizeText(value).replace(/\s+/g, " ");
        return normalized.length > limit ? `${normalized.slice(0, limit - 1)}...` : normalized;
    }
    function formatErrorMessage(value) {
        const raw = value instanceof Error ? value.message : String(value || "");
        const normalized = raw.trim();
        if (!normalized) {
            return "The request failed. Please try again.";
        }
        try {
            const parsed = JSON.parse(normalized);
            const jiraMessages = [
                ...(Array.isArray(parsed.errorMessages) ? parsed.errorMessages : []),
                ...(parsed.errors && typeof parsed.errors === "object" ? Object.values(parsed.errors) : [])
            ].map((entry) => String(entry || "").trim()).filter(Boolean);
            if (jiraMessages.some((message) => /issue does not exist|issue not found/i.test(message))) {
                return "Jira issue was not found. Check the Jira number and confirm you have access to it.";
            }
            if (jiraMessages.length) {
                return jiraMessages.join(" ");
            }
            const message = parsed.error || parsed.message || parsed.detail || parsed.errorMessage;
            if (message) {
                return formatErrorMessage(message);
            }
        }
        catch (_a) {
        }
        const jsonStart = normalized.indexOf("{");
        if (jsonStart > 0 && normalized.endsWith("}")) {
            const prefix = normalized.slice(0, jsonStart).trimEnd();
            const formatted = formatErrorMessage(normalized.slice(jsonStart));
            if (formatted && formatted !== normalized.slice(jsonStart)) {
                if (/HTTP\s+404/i.test(prefix) && /jira issue was not found|issue does not exist|issue not found/i.test(formatted)) {
                    const issueMatch = prefix.match(/Jira issue\s+([A-Za-z0-9_-]+)/i);
                    const issueLabel = (issueMatch === null || issueMatch === void 0 ? void 0 : issueMatch[1]) ? ` ${issueMatch[1]}` : "";
                    return `Jira issue${issueLabel} was not found. Check the Jira number and confirm you have access to it.`;
                }
                return `${prefix} ${formatted}`.trim();
            }
        }
        return normalized
            .replace(/\s+/g, " ")
            .replace(/^Error:\s*/i, "")
            .trim();
    }
    function fetchJson(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, options = {}) {
            const response = yield fetch(url, Object.assign(Object.assign({}, options), { headers: Object.assign({ Accept: "application/json" }, (options.headers || {})) }));
            const body = yield response.text();
            if (!response.ok) {
                throw new Error(formatErrorMessage(body || `HTTP ${response.status}`));
            }
            return body ? JSON.parse(body) : {};
        });
    }
    function normalizeProducts(products) {
        const merged = [...products];
        for (const fallback of FALLBACK_PRODUCTS) {
            const existing = merged.find((product) => product.key === fallback.key || product.label.toLowerCase() === fallback.label.toLowerCase());
            if (!existing) {
                merged.push(fallback);
            }
        }
        return merged.map((product) => {
            const fallback = FALLBACK_PRODUCTS.find((item) => item.key === product.key || item.label.toLowerCase() === product.label.toLowerCase());
            if ((fallback === null || fallback === void 0 ? void 0 : fallback.defaultWorkspace) && (!product.defaultWorkspace || product.defaultWorkspace.toLowerCase().startsWith("shared://"))) {
                return Object.assign(Object.assign({}, product), { defaultWorkspace: fallback.defaultWorkspace });
            }
            return (fallback === null || fallback === void 0 ? void 0 : fallback.defaultWorkspace) && !product.defaultWorkspace
                ? Object.assign(Object.assign({}, product), { defaultWorkspace: fallback.defaultWorkspace }) : product;
        });
    }
    function parseSseBlock(block) {
        const lines = block.split(/\r?\n/);
        let eventName = "message";
        const dataLines = [];
        for (const line of lines) {
            if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
            }
            else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
            }
        }
        if (!dataLines.length) {
            return null;
        }
        try {
            return { eventName, payload: JSON.parse(dataLines.join("\n")) };
        }
        catch (error) {
            return { eventName, payload: { text: dataLines.join("\n") } };
        }
    }
    function firstPresent(...values) {
        for (const value of values) {
            const normalized = normalizeText(value);
            if (normalized) {
                return normalized;
            }
        }
        return "";
    }
    function normalizeSectionName(value) {
        return value
            .replace(/^#{1,6}\s+/, "")
            .replace(/^\*\*|\*\*$/g, "")
            .replace(/:$/, "")
            .replace(/\s*\(confidence:[^)]+\)\s*$/i, "")
            .trim()
            .toLowerCase();
    }
    function getMarkdownHeading(line) {
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
    function parseFinalMessageSections(value) {
        const sectionMap = {};
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        let activeHeading = "";
        let activeLines = [];
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
            if (heading && (/^#{1,6}\s+/.test(line.trim())
                || NON_RCA_FINAL_SECTION_NAMES.some((name) => normalizeSectionName(name) === normalizeSectionName(heading)))) {
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
    function pickFinalSection(sectionMap, ...names) {
        for (const name of names) {
            const exact = sectionMap[normalizeSectionName(name)];
            if (exact) {
                return exact;
            }
        }
        return "";
    }
    function cleanRcaField(value) {
        return String(value || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .filter((line) => line.trim() !== "---")
            .join("\n")
            .trim();
    }
    function cleanRcaContentLine(line) {
        return line
            .replace(/^\s*[-*]\s+/, "")
            .replace(/^\s*\d+[\).]\s+/, "")
            .trim();
    }
    function isKnownRcaHeading(value) {
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
    function meaningfulRcaLines(value, maxLines = 4) {
        const lines = [];
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
    function firstMeaningfulRcaLine(value) {
        return meaningfulRcaLines(value, 1)[0] || "";
    }
    function extractConfidenceLevel(value) {
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
    function isPositiveConfidenceLevel(value) {
        return /^(high|medium-high)$/i.test(String(value || "").trim());
    }
    function uniqueRcaLines(lines) {
        const seen = new Set();
        const result = [];
        for (const line of lines.map((item) => cleanRcaContentLine(item)).filter(Boolean)) {
            const key = line.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(line);
            }
        }
        return result;
    }
    function extractLabeledRcaValue(value, labelPattern) {
        for (const rawLine of String(value || "").replace(/\r\n/g, "\n").split("\n")) {
            const line = cleanRcaContentLine(rawLine);
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match && labelPattern.test(match[1].trim())) {
                return cleanRcaContentLine(match[2]);
            }
        }
        return "";
    }
    function extractRcaLinesAfterLabel(value, labelPattern, maxLines = 3) {
        const lines = [];
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
                if (inline === null || inline === void 0 ? void 0 : inline[2]) {
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
    function formatNumberedRcaLines(lines) {
        return uniqueRcaLines(lines)
            .map((line, index) => `${index + 1}) ${line}`)
            .join("\n");
    }
    function trimRcaBlock(value, maxLines = 70, maxChars = 6000) {
        const text = cleanRcaField(value);
        const lines = text.split("\n");
        const clippedByLines = lines.length > maxLines
            ? `${lines.slice(0, maxLines).join("\n")}\n... ${lines.length - maxLines} more lines in Advanced Analysis.`
            : text;
        return clippedByLines.length > maxChars
            ? `${clippedByLines.slice(0, maxChars - 4).trim()} ...`
            : clippedByLines;
    }
    function stripWrappingFence(value) {
        const text = cleanRcaField(value);
        const match = text.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
        return match ? match[1].trim() : text;
    }
    function buildSummaryBlock(resultSummary, whyItFails, culprit, completeFix, fixExplanation) {
        const symptom = firstPresent(extractLabeledRcaValue(resultSummary, /^symptom$/i), firstMeaningfulRcaLine(resultSummary), firstMeaningfulRcaLine(whyItFails), firstMeaningfulRcaLine(culprit));
        const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3);
        const rootCauseLines = summaryRootCauses.length
            ? summaryRootCauses
            : uniqueRcaLines([
                ...meaningfulRcaLines(whyItFails, 3),
                ...meaningfulRcaLines(culprit, 1)
            ]).slice(0, 3);
        const nextFix = firstPresent(extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i), firstMeaningfulRcaLine(completeFix), firstMeaningfulRcaLine(fixExplanation));
        return [
            symptom ? `- Symptom: ${compactText(symptom, 440)}` : "",
            rootCauseLines.length ? `- Root causes\n${formatNumberedRcaLines(rootCauseLines)}` : "",
            nextFix ? `- Most likely next fix step: ${compactText(nextFix, 380)}` : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildObservedExpected(summary, logEvidence, culprit, whyItFails) {
        const observed = firstPresent(extractLabeledRcaValue(summary, /^symptom$/i), firstMeaningfulRcaLine(summary), firstMeaningfulRcaLine(logEvidence), firstMeaningfulRcaLine(culprit), firstMeaningfulRcaLine(whyItFails));
        if (!observed) {
            return "";
        }
        return [
            `Observed: ${compactText(observed, 520)}`,
            "Expected: The ticket flow should complete without the reported failure; exact product expectation should match the Jira/BugDB acceptance context."
        ].join("\n");
    }
    function buildReproSufficiency(reproEvidence, logEvidence, rootCauseCode, confidence, uncertainty) {
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
    function buildEvidenceBlock(culprit, callChain, logEvidence, affectedFiles) {
        return [
            culprit ? `Issue location:\n${culprit}` : "",
            affectedFiles ? `Files involved:\n${affectedFiles}` : "",
            callChain ? `Call path:\n${callChain}` : "",
            `Log/source evidence:\n${logEvidence || "None provided in Jira/source output."}`
        ].filter(Boolean).join("\n\n");
    }
    function ensureFencedBlock(value, language = "") {
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
    function buildRootCauseBlock(whyItFails, culprit, resultSummary) {
        const rootCauseLines = uniqueRcaLines([
            ...meaningfulRcaLines(whyItFails, 5),
            ...extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 3),
            ...meaningfulRcaLines(culprit, 2)
        ]).slice(0, 6);
        return rootCauseLines.length
            ? rootCauseLines.map((line) => `- ${line}`).join("\n")
            : "";
    }
    function buildCodeEvidenceBlock(rootCauseCode, codeEvidence) {
        return [
            rootCauseCode ? `Code involved in the root cause\n${trimRcaBlock(rootCauseCode, 30, 2800)}` : "",
            codeEvidence ? trimRcaBlock(codeEvidence, 55, 5200) : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildRootCauseWithCodeBlock(rootCause, rootCauseCode, codeEvidence) {
        return [
            rootCause,
            buildCodeEvidenceBlock(rootCauseCode, codeEvidence)
        ].filter(Boolean).join("\n\n");
    }
    function buildAdvancedRootCauseBlock(whyItFails, rootCauseCode, codeEvidence) {
        return [
            cleanRcaField(whyItFails),
            rootCauseCode ? `Code involved in the root cause\n${cleanRcaField(rootCauseCode)}` : "",
            codeEvidence ? stripWrappingFence(codeEvidence) : ""
        ].filter(Boolean).join("\n\n");
    }
    function buildRecommendedFix(completeFix, fixExplanation) {
        return cleanRcaField(completeFix) || (firstMeaningfulRcaLine(fixExplanation) ? `- ${firstMeaningfulRcaLine(fixExplanation)}` : "");
    }
    function buildProposedDiffBlock(proposedDiff) {
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
    function buildAdvancedProposedDiffBlock(proposedDiff) {
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
            ensureFencedBlock(trimRcaBlock(text, 220, 14000), "diff")
        ].join("\n");
    }
    function filterAttachmentDisplayText(value) {
        return cleanRcaField(value)
            .split("\n")
            .map((line) => line.trimEnd())
            .filter((line) => {
            const normalized = line.trim();
            if (!normalized) {
                return true;
            }
            return !/\b[\w .()_-]+\.(?:bmp|gif|jpe?g|png|svg|webp)\b/i.test(normalized)
                && !/\b(?:content was not included|was not fetched|not fetched|not included in the prompt|not included in prompt)\b/i.test(normalized)
                && !/\b(?:ignored|skipped)\b.*\b(?:image|screenshot|video|media)\b/i.test(normalized)
                && !/\b(?:image-only|screenshot-only|video-only|media-only)\b/i.test(normalized)
                && !/\b(?:no|none|not)\b.*\b(?:attachment evidence|attachments?)\b.*\b(?:available|provided|included|fetched|present)\b/i.test(normalized);
        })
            .join("\n")
            .trim();
    }
    function normalizeDisplayedSectionBody(heading, body) {
        const normalizedHeading = normalizeSectionName(heading);
        if (normalizedHeading === "attachment evidence" || normalizedHeading === "attachments") {
            return filterAttachmentDisplayText(body);
        }
        return body.trim();
    }
    function pickAdvancedSection(sections, finalSections, name) {
        return cleanRcaField(firstPresent(sections[name], pickFinalSection(finalSections, name)));
    }
    function buildDefaultAdvancedPlan(payload) {
        var _a;
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const product = cleanRcaField(request.product || request.productLabel || (payload === null || payload === void 0 ? void 0 : payload.productLabel) || "selected product");
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || "");
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
    function buildAdvancedResultSummary(resultSummary, whyItFails, culprit, completeFix, fixExplanation) {
        const symptom = firstPresent(extractLabeledRcaValue(resultSummary, /^symptom$/i), firstMeaningfulRcaLine(resultSummary), firstMeaningfulRcaLine(whyItFails), firstMeaningfulRcaLine(culprit));
        const summaryRootCauses = extractRcaLinesAfterLabel(resultSummary, /^root causes?\b/i, 4);
        const rootCauses = summaryRootCauses.length
            ? summaryRootCauses
            : uniqueRcaLines([
                ...meaningfulRcaLines(whyItFails, 3),
                ...meaningfulRcaLines(culprit, 2)
            ]).slice(0, 4);
        const nextFix = firstPresent(extractLabeledRcaValue(resultSummary, /^(proposed next fix step|most likely next fix step)\b/i), firstMeaningfulRcaLine(completeFix), firstMeaningfulRcaLine(fixExplanation));
        return [
            symptom ? `- Symptom: ${symptom}` : "",
            rootCauses.length ? `- Root causes (from Jira evidence)\n${formatNumberedRcaLines(rootCauses)}` : "",
            nextFix ? `- Most likely next fix step: ${nextFix}` : ""
        ].filter(Boolean).join("\n\n");
    }
    function extractRcaHeading(finalMessage, payload) {
        var _a;
        const direct = String(finalMessage || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map((line) => line.trim().replace(/^#{1,6}\s+/, ""))
            .find((line) => /^RCA:\s*\S/i.test(line));
        if (direct) {
            return direct;
        }
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || "");
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
    function buildDefaultVerificationLoop(fields) {
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
    function buildDefaultStepByStepSolution(payload, fields) {
        var _a;
        const request = ((_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.request) || {};
        const ticket = cleanRcaField(request.ticketId || (payload === null || payload === void 0 ? void 0 : payload.ticketId) || (request.ticketSource === "description" ? "Problem Statement" : "requested issue"));
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
    function normalizeAdvancedFieldBody(field, value) {
        if (field === "Attachment Evidence" || field === "Attachments") {
            return filterAttachmentDisplayText(value);
        }
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
    function buildAdvancedAnalysis(payload) {
        var _a, _b, _c, _d, _e, _f;
        const fields = (payload === null || payload === void 0 ? void 0 : payload.rcaFields) || ((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.parsed) === null || _b === void 0 ? void 0 : _b.rcaFields) || {};
        const sections = (payload === null || payload === void 0 ? void 0 : payload.sections) || ((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.session) === null || _c === void 0 ? void 0 : _c.parsed) === null || _d === void 0 ? void 0 : _d.sections) || {};
        const finalMessage = (payload === null || payload === void 0 ? void 0 : payload.message) || ((_f = (_e = payload === null || payload === void 0 ? void 0 : payload.session) === null || _e === void 0 ? void 0 : _e.output) === null || _f === void 0 ? void 0 : _f.finalMessage) || "";
        const finalSections = parseFinalMessageSections(finalMessage);
        const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
        const whyItFails = cleanRcaField(firstPresent(fields["Why It Fails"], pickFinalSection(finalSections, "Why It Fails")));
        const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
        const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
        const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
        const normalizedFields = Object.assign({}, fields);
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
        parts.push(verificationLoop ? `Verification Loop\n${verificationLoop}` : "", uiValidation ? `UI Validation\n${uiValidation}` : "", stepByStepSolution ? `Step-by-Step Solution\n${stepByStepSolution}` : "");
        return parts.filter(Boolean).join("\n\n");
    }
    function buildCompressedRcaResult(payload) {
        var _a, _b, _c, _d, _e, _f;
        const fields = (payload === null || payload === void 0 ? void 0 : payload.rcaFields) || ((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.session) === null || _a === void 0 ? void 0 : _a.parsed) === null || _b === void 0 ? void 0 : _b.rcaFields) || {};
        const sections = (payload === null || payload === void 0 ? void 0 : payload.sections) || ((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.session) === null || _c === void 0 ? void 0 : _c.parsed) === null || _d === void 0 ? void 0 : _d.sections) || {};
        const finalMessage = (payload === null || payload === void 0 ? void 0 : payload.message) || ((_f = (_e = payload === null || payload === void 0 ? void 0 : payload.session) === null || _e === void 0 ? void 0 : _e.output) === null || _f === void 0 ? void 0 : _f.finalMessage) || "";
        const finalSections = parseFinalMessageSections(finalMessage);
        const resultSummary = cleanRcaField(firstPresent(sections["Result Summary"], pickFinalSection(finalSections, "Result Summary")));
        const culprit = cleanRcaField(firstPresent(fields.Culprit, pickFinalSection(finalSections, "Culprit")));
        const callChain = cleanRcaField(firstPresent(fields["Call Chain"], pickFinalSection(finalSections, "Call Chain")));
        const rootCauseCode = cleanRcaField(firstPresent(fields["Root Cause Code"], pickFinalSection(finalSections, "Root Cause Code")));
        const codeEvidence = cleanRcaField(firstPresent(fields["Code Evidence"], pickFinalSection(finalSections, "Code Evidence")));
        const logEvidence = cleanRcaField(firstPresent(fields["Log Evidence"], pickFinalSection(finalSections, "Log Evidence")));
        const reproEvidence = cleanRcaField(firstPresent(fields["Reproducible Evidence"], pickFinalSection(finalSections, "Reproducible Evidence")));
        const whyItFails = cleanRcaField(firstPresent(fields["Why It Fails"], pickFinalSection(finalSections, "Why It Fails")));
        const completeFix = cleanRcaField(firstPresent(fields["Complete Fix"], pickFinalSection(finalSections, "Complete Fix")));
        const fixExplanation = cleanRcaField(firstPresent(fields["Fix Explanation"], pickFinalSection(finalSections, "Fix Explanation")));
        const proposedDiff = cleanRcaField(firstPresent(fields["Proposed Diff"], pickFinalSection(finalSections, "Proposed Diff")));
        const affectedFiles = cleanRcaField(firstPresent(fields["All Affected Files"], pickFinalSection(finalSections, "All Affected Files")));
        const confidence = cleanRcaField(firstPresent(fields.Confidence, pickFinalSection(finalSections, "Confidence"), sections.Confidence));
        const confidenceLevel = confidence ? extractConfidenceLevel(confidence) : "";
        const remainingUncertainty = cleanRcaField(firstPresent(fields["Remaining Uncertainty"], pickFinalSection(finalSections, "Remaining Uncertainty")));
        const summary = buildSummaryBlock(resultSummary, whyItFails, culprit, completeFix, fixExplanation);
        const observedExpected = cleanRcaField(firstPresent(fields["Observed vs Expected"], pickFinalSection(finalSections, "Observed vs Expected"), buildObservedExpected(resultSummary, logEvidence, culprit, whyItFails)));
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
    function parseRcaResultSections(value) {
        const sections = [];
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        let activeHeading = "";
        let activeLines = [];
        let inFence = false;
        function flush() {
            if (activeHeading) {
                const body = normalizeDisplayedSectionBody(activeHeading, activeLines.join("\n"));
                const previous = sections[sections.length - 1];
                if (body && previous && normalizeSectionName(previous.heading) === normalizeSectionName(activeHeading)) {
                    previous.body = [previous.body, body].filter(Boolean).join("\n\n");
                }
                else if (body) {
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
    function stripMarkdownHeading(value) {
        return value.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
    }
    function getRcaToneClass(sectionName) {
        const normalized = normalizeSectionName(sectionName);
        if (normalized === "summary") {
            return "is-summary";
        }
        if (normalized === "recommended fix"
            || normalized === "fix explanation"
            || normalized === "files to update"
            || normalized === "proposed diff"
            || normalized === "proposed solution") {
            return "is-fix";
        }
        return "";
    }
    function getConfidenceToneClass(value) {
        const level = extractConfidenceLevel(value);
        return isPositiveConfidenceLevel(level) ? "is-confidence-high" : "is-confidence-other";
    }
    function getRcaSectionClass(sectionName, body = "") {
        const toneClass = getRcaToneClass(sectionName);
        if (normalizeSectionName(sectionName) === "confidence") {
            return [toneClass, getConfidenceToneClass(body)].filter(Boolean).join(" ");
        }
        return toneClass;
    }
    function isRichHeading(line) {
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
    function isStandaloneInlineCode(line) {
        return /^`[^`]+`[.;,:]?$/.test(line.trim());
    }
    function cleanStandaloneCode(line) {
        return line.trim().replace(/^`/, "").replace(/`[.;,:]?$/, "");
    }
    function renderInlineCode(text) {
        return text.split(/(`[^`]+`|[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/g).filter(Boolean).map((part, index) => {
            if (/^`[^`]+`$/.test(part)) {
                return (0, jsx_runtime_1.jsx)("code", { class: "inline-code", children: part.slice(1, -1) }, `code-${index}`);
            }
            if (/(?:[\\/]|\.)(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?$/i.test(part)) {
                return (0, jsx_runtime_1.jsx)("code", { class: "file-token", children: part }, `file-${index}`);
            }
            return (0, jsx_runtime_1.jsx)("span", { children: part }, `text-${index}`);
        });
    }
    function collapseRepeatedLiveFileRefs(text) {
        const filePattern = /(?:[A-Za-z]:\\[^\s,;:)]+|(?:[\w.-]+[\\/])+[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)|[\w.-]+\.(?:cs|js|tsx|ts|json|xml|md|config|toml|cmd|ps1|sh)(?::\d+)?)/gi;
        const matches = [...String(text || "").matchAll(filePattern)];
        const seen = new Map();
        for (const match of matches) {
            const token = match[0];
            const refMatch = token.match(/^(.*?)(?::(\d+))$/);
            const base = refMatch ? refMatch[1] : token;
            const key = base.toLowerCase();
            const entry = seen.get(key) || { first: base, refs: [], count: 0 };
            entry.count += 1;
            if ((refMatch === null || refMatch === void 0 ? void 0 : refMatch[2]) && !entry.refs.includes(refMatch[2])) {
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
    function isCommandLikeLine(value) {
        return /^\s*(npm|npx|node|git|rg|Get-ChildItem|Select-String|Invoke-WebRequest|powershell|cmd|codex|dotnet|msbuild|where|docker)\b/i.test(value)
            || /\b(exec|spawn|command|started|completed|failed)\b/i.test(value) && /\b(node|npm|git|rg|codex|dotnet|powershell|cmd)\b/i.test(value);
    }
    function isSearchCommand(value) {
        return /\b(rg|Select-String|Get-ChildItem|findstr)\b/i.test(String(value || ""));
    }
    function summarizeSearchCommand(value) {
        const command = String(value || "").replace(/\s+/g, " ").trim();
        if (!command) {
            return "targeted source search";
        }
        return compactText(command, 160);
    }
    function summarizeSearchOutput(value) {
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
    function renderLiveLine(text) {
        const displayText = collapseRepeatedLiveFileRefs(text);
        const isLocalAgentWarning = text.includes(LOCAL_AGENT_DISCONNECTED_NOTICE);
        const kind = isLocalAgentWarning
            ? "warning local-agent-warning"
            : /^RCA successful:/i.test(text)
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
        return ((0, jsx_runtime_1.jsx)("p", { class: `live-output-line ${kind}`, children: renderInlineCode(displayText) }));
    }
    function shouldSuppressLiveLine(text) {
        const normalized = String(text || "").trim();
        return /\bNo stdout or stderr has arrived for\b/i.test(normalized)
            || /^item\.complete/i.test(normalized);
    }
    function formatSessionHistoryTitle(session) {
        var _a, _b, _c, _d, _e, _f, _g;
        return compactText(((_a = session.request) === null || _a === void 0 ? void 0 : _a.displayName)
            || ((_b = session.summary) === null || _b === void 0 ? void 0 : _b.displayName)
            || [
                ((_c = session.request) === null || _c === void 0 ? void 0 : _c.ticketId) || ((_d = session.summary) === null || _d === void 0 ? void 0 : _d.ticketId),
                ((_e = session.request) === null || _e === void 0 ? void 0 : _e.issueTitle) || ((_f = session.request) === null || _f === void 0 ? void 0 : _f.derivedIssueTitle) || ((_g = session.summary) === null || _g === void 0 ? void 0 : _g.preview)
            ].filter(Boolean).join(" - ")
            || session.id, 88);
    }
    function normalizeRunState(value) {
        const normalized = String(value || "").toLowerCase();
        if (normalized === "completed") {
            return "completed";
        }
        if (normalized === "running") {
            return "running";
        }
        if (normalized === "cancelled" || normalized === "stopped" || normalized === "interrupted") {
            return "stopped";
        }
        if (normalized === "failed") {
            return "failed";
        }
        return "idle";
    }
    function renderCodeBlock(lines, key) {
        return ((0, jsx_runtime_1.jsx)("pre", { class: "rich-code-block", children: (0, jsx_runtime_1.jsx)("code", { children: lines.map((line, index) => {
                    const trimmed = line.trimStart();
                    const diffClass = trimmed.startsWith("+")
                        ? "diff-add"
                        : trimmed.startsWith("-")
                            ? "diff-remove"
                            : "";
                    return (0, jsx_runtime_1.jsx)("span", { class: diffClass, children: line || " " }, `${key}-line-${index}`);
                }) }) }, key));
    }
    function renderRichText(value, variant = "default") {
        const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
        const blocks = [];
        let paragraph = [];
        let code = [];
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
                blocks.push((0, jsx_runtime_1.jsx)("h3", { class: `rich-heading ${getRcaToneClass(headingText)}`.trim(), children: headingText }, `heading-${blocks.length}`));
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
            blocks.push((0, jsx_runtime_1.jsx)("p", { class: paragraphClass, children: displayLines.map((line, index) => ((0, jsx_runtime_1.jsxs)("span", { children: [renderInlineCode(line), index < displayLines.length - 1 ? (0, jsx_runtime_1.jsx)("br", {}) : null] }, `paragraph-line-${index}`))) }, `paragraph-${blocks.length}`));
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
                }
                else {
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
                blocks.push((0, jsx_runtime_1.jsx)("h3", { class: `rich-heading ${getRcaToneClass(headingText)}`.trim(), children: headingText }, `heading-${blocks.length}`));
                continue;
            }
            paragraph.push(line);
        }
        flushParagraph();
        flushCode();
        if (!blocks.length) {
            return (0, jsx_runtime_1.jsx)("p", { class: "rich-paragraph", children: value });
        }
        return (0, jsx_runtime_1.jsx)("div", { class: `rich-output ${variant}`, children: blocks });
    }
    exports.App = (0, ojvcomponent_1.registerCustomElement)("app-root", ({ appName = "Oracle Restaurants RCA", userLogin = "Signed in" }) => {
        const [runtime, setRuntime] = (0, hooks_1.useState)({
            connected: false,
            platform: "",
            serverMode: "",
            requireElevatedExecution: false,
            elevated: false,
            products: FALLBACK_PRODUCTS,
            defaultPrompt: ""
        });
        const [authUser, setAuthUser] = (0, hooks_1.useState)(null);
        const [localAgentStatus, setLocalAgentStatus] = (0, hooks_1.useState)(EMPTY_LOCAL_AGENT_STATUS);
        const [developerMode, setDeveloperMode] = (0, hooks_1.useState)(false);
        const [selectedProduct, setSelectedProduct] = (0, hooks_1.useState)("simphony");
        const [folderPath, setFolderPath] = (0, hooks_1.useState)("");
        const [ticketType, setTicketType] = (0, hooks_1.useState)("jira");
        const [ticketId, setTicketId] = (0, hooks_1.useState)("");
        const [bugDescription, setBugDescription] = (0, hooks_1.useState)("");
        const [isBrowsingWorkspace, setIsBrowsingWorkspace] = (0, hooks_1.useState)(false);
        const [chatHistory, setChatHistory] = (0, hooks_1.useState)(DEFAULT_CHAT);
        const [sessionHistory, setSessionHistory] = (0, hooks_1.useState)([]);
        const [selectedHistoryId, setSelectedHistoryId] = (0, hooks_1.useState)("");
        const [deletingSessionId, setDeletingSessionId] = (0, hooks_1.useState)("");
        const [liveOutput, setLiveOutput] = (0, hooks_1.useState)([]);
        const [rcaResult, setRcaResult] = (0, hooks_1.useState)("");
        const [advancedAnalysis, setAdvancedAnalysis] = (0, hooks_1.useState)("");
        const [activeView, setActiveView] = (0, hooks_1.useState)("workspace");
        const [runState, setRunState] = (0, hooks_1.useState)("idle");
        const [statusText, setStatusText] = (0, hooks_1.useState)("Ready");
        const [currentSessionId, setCurrentSessionId] = (0, hooks_1.useState)("");
        const [isLoadingConfig, setIsLoadingConfig] = (0, hooks_1.useState)(true);
        const [leftPanelCollapsed, setLeftPanelCollapsed] = (0, hooks_1.useState)(false);
        const [activeUsersData, setActiveUsersData] = (0, hooks_1.useState)({
            count: 0,
            users: [],
            open: false
        });
        const controllerRef = (0, hooks_1.useRef)(null);
        const liveOutputRef = (0, hooks_1.useRef)(null);
        const endNoticeShownRef = (0, hooks_1.useRef)(false);
        const lastFailureDetailRef = (0, hooks_1.useRef)("");
        const products = (0, hooks_1.useMemo)(() => normalizeProducts(runtime.products || []), [runtime.products]);
        const selectedProductConfig = products.find((product) => product.key === selectedProduct) || products[0];
        const workspace = developerMode
            ? folderPath.trim()
            : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.defaultWorkspace) || "";
        const isDescriptionTicket = ticketType === "description";
        const ticketSourceLabel = isDescriptionTicket ? "Problem Statement" : ticketType === "bugdb" ? "BugDB" : "Jira";
        const ticketInputLabel = isDescriptionTicket ? "Problem Statement" : ticketType === "bugdb" ? "BugDB Number" : "Jira Number";
        const ticketPlaceholder = ticketType === "bugdb" ? "38884123" : "FPS-137892";
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
        const runButtonLabel = selectedHistoryId && runState !== "running" ? "Re Run" : "Start RCA";
        const signedInLabel = (authUser === null || authUser === void 0 ? void 0 : authUser.displayName) || (authUser === null || authUser === void 0 ? void 0 : authUser.email) || (authUser === null || authUser === void 0 ? void 0 : authUser.username) || userLogin;
        const contextLines = (0, hooks_1.useMemo)(() => {
            const sourceMode = developerMode ? "Developer Mode" : "Product Mode";
            const sourceLabel = developerMode
                ? folderPath.trim() || "No developer workspace selected"
                : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.label) || selectedProduct || "No product selected";
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
        (0, hooks_1.useEffect)(() => {
            Context.getPageContext().getBusyContext().applicationBootstrapComplete();
            loadInitialState();
        }, []);
        (0, hooks_1.useEffect)(() => {
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
        (0, hooks_1.useEffect)(() => {
            setLiveOutput((lines) => {
                const withoutNotice = lines.filter((line) => line !== LOCAL_AGENT_DISCONNECTED_NOTICE);
                if (developerMode && !localAgentStatus.connected) {
                    return [...withoutNotice, LOCAL_AGENT_DISCONNECTED_NOTICE].slice(-500);
                }
                return withoutNotice;
            });
        }, [developerMode, localAgentStatus.connected]);
        (0, hooks_1.useEffect)(() => {
            if (liveOutputRef.current) {
                liveOutputRef.current.scrollTop = liveOutputRef.current.scrollHeight;
            }
        }, [liveOutput]);
        (0, hooks_1.useEffect)(() => {
            function sendHeartbeat() {
                fetchJson("/api/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                }).catch(() => { });
            }
            function fetchActiveUsers() {
                fetchJson("/api/active-users")
                    .then((data) => {
                    setActiveUsersData((previous) => (Object.assign(Object.assign({}, previous), { count: data.count || 0, users: Array.isArray(data.users) ? data.users : [] })));
                })
                    .catch(() => { });
            }
            sendHeartbeat();
            fetchActiveUsers();
            const heartbeatTimer = window.setInterval(sendHeartbeat, 30000);
            const usersTimer = window.setInterval(fetchActiveUsers, 30000);
            return () => {
                window.clearInterval(heartbeatTimer);
                window.clearInterval(usersTimer);
            };
        }, []);
        function loadInitialState() {
            return __awaiter(this, void 0, void 0, function* () {
                setIsLoadingConfig(true);
                yield Promise.all([loadConfig(), loadAuth(), loadLocalAgentStatus(), loadSessionHistory()]);
                setIsLoadingConfig(false);
            });
        }
        function loadConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const config = yield fetchJson("/api/config");
                    setRuntime({
                        connected: true,
                        platform: config.platform || "",
                        serverMode: config.serverMode || "",
                        requireElevatedExecution: Boolean(config.requireElevatedExecution),
                        elevated: Boolean(config.elevated),
                        products: normalizeProducts(config.products || []),
                        defaultPrompt: config.defaultPrompt || ""
                    });
                }
                catch (error) {
                    setRuntime((previous) => (Object.assign(Object.assign({}, previous), { connected: false })));
                }
            });
        }
        function loadAuth() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const auth = yield fetchJson("/auth/me");
                    setAuthUser(auth.user || null);
                }
                catch (error) {
                    setAuthUser(null);
                }
            });
        }
        function loadLocalAgentStatus() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const brokerStatus = yield fetchJson("/api/broker/status");
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
                }
                catch (error) {
                }
                try {
                    const status = yield fetchJson(`${DEFAULT_LOCAL_AGENT_BASE_URL}/api/health`);
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
                }
                catch (error) {
                    setLocalAgentStatus(EMPTY_LOCAL_AGENT_STATUS);
                }
            });
        }
        function loadSessionHistory() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield fetchJson("/api/sessions");
                    setSessionHistory(Array.isArray(result.sessions) ? result.sessions : []);
                }
                catch (error) {
                    setSessionHistory([]);
                }
            });
        }
        function openHistorySession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!sessionId) {
                    return;
                }
                try {
                    const session = yield fetchJson(`/api/sessions/${encodeURIComponent(sessionId)}`);
                    const output = (session === null || session === void 0 ? void 0 : session.output) || {};
                    const request = (session === null || session === void 0 ? void 0 : session.request) || {};
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
                    const nextTicketType = request.ticketSource === "bugdb"
                        ? "bugdb"
                        : request.ticketSource === "description"
                            ? "description"
                            : "jira";
                    setTicketType(nextTicketType);
                    if (nextTicketType === "description") {
                        setBugDescription(String(request.bugDescription || ""));
                        setTicketId("");
                    }
                    else {
                        setTicketId(String(request.ticketId || ""));
                        setBugDescription("");
                    }
                    if (request.product && products.some((product) => product.key === request.product)) {
                        setDeveloperMode(false);
                        setSelectedProduct(request.product);
                    }
                    else if (request.workspace) {
                        setDeveloperMode(true);
                        setFolderPath(String(request.workspace || ""));
                    }
                }
                catch (error) {
                    appendLive(`History load failed: ${compactText(error.message, 180)}`);
                }
            });
        }
        function deleteHistorySession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!sessionId || deletingSessionId) {
                    return;
                }
                setDeletingSessionId(sessionId);
                try {
                    yield fetchJson(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
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
                }
                catch (error) {
                    appendLive(`Delete failed: ${compactText(error.message, 180)}`);
                }
                finally {
                    setDeletingSessionId("");
                }
            });
        }
        function developerApiUrl(apiPath) {
            const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
            if (localAgentStatus.transport === "broker") {
                return normalizedPath.startsWith("/api/")
                    ? `/api/broker/${normalizedPath.slice("/api/".length)}`
                    : `/api/broker${normalizedPath}`;
            }
            return `${DEFAULT_LOCAL_AGENT_BASE_URL}${normalizedPath}`;
        }
        function addChat(role, text) {
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
        function appendLive(text) {
            if (shouldSuppressLiveLine(text)) {
                return;
            }
            setLiveOutput((lines) => [...lines, formatErrorMessage(text)].slice(-500));
        }
        function stopRun() {
            return __awaiter(this, void 0, void 0, function* () {
                if (controllerRef.current) {
                    controllerRef.current.abort();
                }
                if (currentSessionId) {
                    try {
                        const stopUrl = developerMode
                            ? developerApiUrl(`/api/sessions/${encodeURIComponent(currentSessionId)}/stop`)
                            : `/api/sessions/${encodeURIComponent(currentSessionId)}/stop`;
                        yield fetchJson(stopUrl, { method: "POST" });
                    }
                    catch (error) {
                        appendLive(`Stop request note: ${error.message}`);
                    }
                }
                setRunState("stopped");
                setStatusText("Stopped");
                appendLive("RCA stopped: the active run was cancelled before completion.");
                addChat("system", "The active RCA run was stopped.");
            });
        }
        function browseWorkspace() {
            return __awaiter(this, void 0, void 0, function* () {
                if (developerMode && !localAgentStatus.connected) {
                    yield loadLocalAgentStatus();
                    appendLive(`Browse failed: ${LOCAL_AGENT_DISCONNECTED_NOTICE}`);
                    return;
                }
                setIsBrowsingWorkspace(true);
                try {
                    const params = new URLSearchParams();
                    if (folderPath.trim()) {
                        params.set("current", folderPath.trim());
                    }
                    const browseUrl = developerMode ? developerApiUrl("/api/pick-workspace") : "/api/pick-workspace";
                    const result = yield fetchJson(`${browseUrl}?${params.toString()}`);
                    if (result.path) {
                        setFolderPath(result.path);
                        appendLive(`Workspace selected: ${result.path}`);
                        return;
                    }
                    appendLive(result.message || "No developer workspace was selected.");
                }
                catch (error) {
                    appendLive(`Browse failed: ${compactText(error.message, 150)}`);
                }
                finally {
                    setIsBrowsingWorkspace(false);
                }
            });
        }
        function startRun() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!canRun) {
                    addChat("system", "Add the required ticket and workspace details before starting RCA.");
                    return;
                }
                const productLabel = developerMode ? "Developer Workspace" : (selectedProductConfig === null || selectedProductConfig === void 0 ? void 0 : selectedProductConfig.label) || selectedProduct;
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
                    let prefetchedTicketEvidence = null;
                    if (ticketType === "jira" || ticketType === "bugdb") {
                        appendLive(`Fetching ${ticketType === "bugdb" ? "BugDB" : "Jira"} evidence for ${ticketId.trim()}`);
                        const evidenceUrl = "/api/ticket-evidence";
                        prefetchedTicketEvidence = yield fetchJson(evidenceUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                ticketSource: ticketType,
                                ticketId: ticketId.trim()
                            })
                        });
                    }
                    const runUrl = developerMode ? developerApiUrl("/api/run") : "/api/run";
                    const response = yield fetch(runUrl, {
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
                            issueTitle: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.issueTitle) || "",
                            jiraEvidence: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.jiraEvidence) || null,
                            bugDbEvidence: (prefetchedTicketEvidence === null || prefetchedTicketEvidence === void 0 ? void 0 : prefetchedTicketEvidence.bugDbEvidence) || null,
                            version: "",
                            model: "",
                            extraInstructions: PRODUCT_GENERIC_GUIDANCE
                        }),
                        signal: nextController.signal
                    });
                    if (!response.ok || !response.body) {
                        const body = yield response.text();
                        throw new Error(body || `Run failed with HTTP ${response.status}`);
                    }
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";
                    while (true) {
                        const { done, value } = yield reader.read();
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
                }
                catch (error) {
                    if (error.name === "AbortError") {
                        return;
                    }
                    setRunState("failed");
                    setStatusText("Failed");
                    appendLive(`RCA failed: ${formatErrorMessage(error)}`);
                    addChat("assistant", `The RCA run failed: ${compactText(formatErrorMessage(error), 180)}`);
                }
                finally {
                    controllerRef.current = null;
                }
            });
        }
        function handleStreamBlock(block) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
                    }
                    else {
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
                        : `Support lookup completed: ${tool || "MCP tool"}`);
                    return;
                }
                if (eventType === "item.completed") {
                    return;
                }
                if (eventType === "ticket.preflight") {
                    appendLive(payload.text || "Ticket preflight: fetching ticket details first.");
                    return;
                }
                if (eventType === "ticket.details") {
                    const detailLines = Array.isArray(payload.lines) ? payload.lines : [];
                    if (detailLines.length) {
                        detailLines.forEach((line) => appendLive(compactText(line, 320)));
                    }
                    else if (payload.text) {
                        appendLive(compactText(payload.text, 320));
                    }
                    return;
                }
                const message = ((_a = payload.message) === null || _a === void 0 ? void 0 : _a.content)
                    || ((_b = payload.item) === null || _b === void 0 ? void 0 : _b.text)
                    || ((_c = payload.item) === null || _c === void 0 ? void 0 : _c.message)
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
                const finalMessage = payload.message || ((_e = (_d = payload.session) === null || _d === void 0 ? void 0 : _d.output) === null || _e === void 0 ? void 0 : _e.finalMessage) || "";
                const failureDetail = payload.stderr || ((_g = (_f = payload.session) === null || _f === void 0 ? void 0 : _f.output) === null || _g === void 0 ? void 0 : _g.stderr) || payload.error || "";
                const completed = ((_h = payload.session) === null || _h === void 0 ? void 0 : _h.status) === "completed";
                const stopped = ["cancelled", "stopped", "interrupted"].includes(String(((_j = payload.session) === null || _j === void 0 ? void 0 : _j.status) || "").toLowerCase());
                const summary = buildCompressedRcaResult(payload);
                if (failureDetail) {
                    lastFailureDetailRef.current = String(failureDetail);
                }
                if (payload.sessionId || ((_k = payload.session) === null || _k === void 0 ? void 0 : _k.id)) {
                    setSelectedHistoryId(payload.sessionId || ((_l = payload.session) === null || _l === void 0 ? void 0 : _l.id) || "");
                }
                setAdvancedAnalysis(completed ? (buildAdvancedAnalysis(payload) || finalMessage) : finalMessage);
                setRcaResult(summary
                    || finalMessage
                    || failureDetail
                    || (completed
                        ? "RCA completed. Open Advanced Analysis for the full output."
                        : stopped
                            ? "RCA stopped: the active run was cancelled before completion."
                            : "RCA failed. Check Live Output for the failure detail."));
                setRunState(completed ? "completed" : stopped ? "stopped" : "failed");
                setStatusText(completed ? "Completed" : stopped ? "Stopped" : "Failed");
                if (!endNoticeShownRef.current) {
                    appendLive(completed
                        ? "RCA successful: check RCA Result for the summary."
                        : stopped
                            ? "RCA stopped: the active run was cancelled before completion."
                            : `RCA failed: ${compactText(failureDetail || finalMessage || "The run ended before a completed RCA was produced.", 320)}`);
                    endNoticeShownRef.current = true;
                }
                addChat("assistant", completed
                    ? "RCA completed. The summary is ready."
                    : stopped
                        ? "The RCA run was stopped."
                        : "The RCA run failed. Check Live Output for the failure detail.");
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
                            : `RCA failed: ${compactText(failureDetail || `Process exited with code ${(_m = payload.code) !== null && _m !== void 0 ? _m : "unknown"}.`, 320)}`);
                    endNoticeShownRef.current = true;
                }
            }
        }
        return ((0, jsx_runtime_1.jsxs)("div", { class: "rca-app-shell", children: [(0, jsx_runtime_1.jsxs)("header", { class: "rca-topbar", children: [(0, jsx_runtime_1.jsxs)("div", { class: "rca-brand", children: [(0, jsx_runtime_1.jsx)("img", { src: "styles/images/oracle_logo.svg", alt: "Oracle" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: appName }), (0, jsx_runtime_1.jsx)("p", { children: "Issue Investigation Tool" })] })] }), (0, jsx_runtime_1.jsxs)("div", { class: "rca-top-actions", children: [(0, jsx_runtime_1.jsxs)("div", { class: "status-chip user-chip", title: signedInLabel, children: [(0, jsx_runtime_1.jsx)("span", { children: "Signed in" }), (0, jsx_runtime_1.jsx)("strong", { children: signedInLabel })] }), (0, jsx_runtime_1.jsxs)("div", { class: `status-chip ${runtime.connected ? "is-ok" : "is-bad"}`, children: [(0, jsx_runtime_1.jsx)("span", { children: "Server Agent" }), (0, jsx_runtime_1.jsx)("strong", { children: isLoadingConfig ? "Checking" : runtime.connected ? "Connected" : "Offline" })] }), (0, jsx_runtime_1.jsxs)("div", { class: `status-chip active-users-chip ${activeUsersData.open ? "is-open" : ""}`, title: "Click to see who is online", onClick: () => setActiveUsersData((previous) => (Object.assign(Object.assign({}, previous), { open: !previous.open }))), children: [(0, jsx_runtime_1.jsx)("span", { children: "Live" }), (0, jsx_runtime_1.jsxs)("strong", { children: [activeUsersData.count, " online"] }), activeUsersData.open ? ((0, jsx_runtime_1.jsxs)("div", { class: "active-users-dropdown", onClick: (event) => event.stopPropagation(), children: [(0, jsx_runtime_1.jsx)("div", { class: "active-users-dropdown-title", children: "Users online now" }), activeUsersData.users.length ? activeUsersData.users.map((user) => ((0, jsx_runtime_1.jsxs)("div", { class: "active-users-item", children: [(0, jsx_runtime_1.jsx)("span", { class: "active-users-dot" }), (0, jsx_runtime_1.jsx)("span", { children: user.name || user.username || "Unknown" })] }))) : ((0, jsx_runtime_1.jsx)("div", { class: "active-users-empty", children: "No users detected yet" }))] })) : null] }), (0, jsx_runtime_1.jsxs)("a", { class: "status-chip signout-button", href: "/auth/logout", children: [(0, jsx_runtime_1.jsx)("span", { children: "Session" }), (0, jsx_runtime_1.jsx)("strong", { children: "Sign out" })] })] })] }), (0, jsx_runtime_1.jsxs)("main", { class: `rca-layout ${leftPanelCollapsed ? "left-collapsed" : ""}`, children: [leftPanelCollapsed ? ((0, jsx_runtime_1.jsx)("aside", { class: "collapsed-rail", "aria-label": "Open investigation panel", children: (0, jsx_runtime_1.jsxs)("button", { class: "rail-menu-button", type: "button", "aria-label": "Open investigation panel", title: "Open investigation panel", onClick: () => setLeftPanelCollapsed(false), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] }) })) : null, (0, jsx_runtime_1.jsxs)("aside", { class: "control-panel", "aria-label": "Investigation controls and chat", "aria-hidden": leftPanelCollapsed ? "true" : "false", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-command-bar", children: [(0, jsx_runtime_1.jsx)("div", { class: "panel-oracle-tile", "aria-label": "Oracle Restaurants RCA panel", children: (0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true" }) }), (0, jsx_runtime_1.jsxs)("button", { class: "panel-collapse-button", type: "button", "aria-label": "Collapse investigation panel", title: "Collapse investigation panel", onClick: () => setLeftPanelCollapsed(true), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card", children: [(0, jsx_runtime_1.jsxs)("div", { class: "section-heading", children: [(0, jsx_runtime_1.jsx)("span", { children: "Mode" }), (0, jsx_runtime_1.jsx)("strong", { children: "Source" })] }), (0, jsx_runtime_1.jsxs)("div", { class: "radio-row two-col", role: "radiogroup", "aria-label": "Developer mode", children: [(0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "developerMode", checked: !developerMode, onChange: () => setDeveloperMode(false) }), "Product"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "developerMode", checked: developerMode, onChange: () => setDeveloperMode(true) }), "Developer"] })] }), !developerMode ? ((0, jsx_runtime_1.jsxs)("label", { class: "field-block", children: [(0, jsx_runtime_1.jsx)("span", { children: "Product name" }), (0, jsx_runtime_1.jsx)("select", { value: selectedProduct, onChange: (event) => setSelectedProduct(event.currentTarget.value), children: products.map((product) => ((0, jsx_runtime_1.jsx)("option", { value: product.key, children: product.label }))) })] })) : ((0, jsx_runtime_1.jsxs)("div", { class: "browse-workspace-block", children: [(0, jsx_runtime_1.jsx)("button", { class: "browse-button", type: "button", disabled: isBrowsingWorkspace || !localAgentStatus.connected, onClick: browseWorkspace, children: isBrowsingWorkspace ? "Opening..." : "Browse Code Folder" }), (0, jsx_runtime_1.jsx)("p", { class: `selected-path ${folderPath ? "" : "needs-attention"}`, children: folderPath || "No folder selected" })] })), developerMode ? ((0, jsx_runtime_1.jsx)("p", { class: `workspace-note ${workspace && localAgentStatus.connected ? "" : "needs-attention"}`, children: !localAgentStatus.connected
                                                ? LOCAL_AGENT_DISCONNECTED_NOTICE
                                                : workspace
                                                    ? "Developer workspace ready on your machine."
                                                    : "Choose the local code folder before starting RCA." })) : null] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card", children: [(0, jsx_runtime_1.jsxs)("div", { class: "section-heading", children: [(0, jsx_runtime_1.jsx)("span", { children: "Ticket" }), (0, jsx_runtime_1.jsx)("strong", { children: "Bug Source" })] }), (0, jsx_runtime_1.jsxs)("div", { class: "radio-row", role: "radiogroup", "aria-label": "Ticket source", children: [(0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "jira", onChange: () => setTicketType("jira") }), "Jira Number"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "bugdb", onChange: () => setTicketType("bugdb") }), "BugDB Number"] }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "ticketType", checked: ticketType === "description", onChange: () => setTicketType("description") }), "Problem Statement"] })] }), (0, jsx_runtime_1.jsxs)("label", { class: "field-block", children: [(0, jsx_runtime_1.jsx)("span", { children: ticketInputLabel }), isDescriptionTicket ? ((0, jsx_runtime_1.jsx)("textarea", { class: "bug-description-input", rows: 5, placeholder: "Problem Statement", value: bugDescription, onInput: (event) => setBugDescription(event.currentTarget.value) })) : ((0, jsx_runtime_1.jsx)("input", { value: ticketId, onInput: (event) => {
                                                        const value = event.currentTarget.value;
                                                        setTicketId(ticketType === "jira" ? value.toUpperCase() : value);
                                                    }, placeholder: ticketPlaceholder }))] }), (0, jsx_runtime_1.jsxs)("div", { class: "button-row", children: [(0, jsx_runtime_1.jsx)("button", { class: "primary-button", type: "button", disabled: !canRun, title: !canRun ? runDisabledReason : runButtonLabel, onClick: startRun, children: runButtonLabel }), (0, jsx_runtime_1.jsx)("button", { class: "secondary-button", type: "button", disabled: runState !== "running", onClick: stopRun, children: "Stop" })] }), !canRun && runDisabledReason ? (0, jsx_runtime_1.jsx)("p", { class: "run-disabled-note", children: runDisabledReason }) : null] }), (0, jsx_runtime_1.jsxs)("section", { class: "control-card chat-card", children: [(0, jsx_runtime_1.jsx)("div", { class: "section-heading", children: (0, jsx_runtime_1.jsx)("span", { children: "Chat history" }) }), (0, jsx_runtime_1.jsx)("div", { class: "session-history-list", children: sessionHistory.length ? sessionHistory.map((session) => ((0, jsx_runtime_1.jsxs)("article", { class: `session-history-item ${selectedHistoryId === session.id ? "is-selected" : ""}`.trim(), role: "button", tabIndex: 0, title: formatSessionHistoryTitle(session), onClick: () => openHistorySession(session.id), onKeyDown: (event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        openHistorySession(session.id);
                                                    }
                                                }, children: [(0, jsx_runtime_1.jsx)("div", { class: "session-history-title", children: formatSessionHistoryTitle(session) }), (0, jsx_runtime_1.jsx)("button", { class: "session-delete-button", type: "button", "aria-label": `Delete ${formatSessionHistoryTitle(session)}`, title: "Delete", disabled: deletingSessionId === session.id || session.status === "running", onClick: (event) => {
                                                            event.stopPropagation();
                                                            deleteHistorySession(session.id);
                                                        } })] }))) : ((0, jsx_runtime_1.jsx)("p", { class: "muted", children: "No saved chats yet." })) })] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "work-panel", children: [(0, jsx_runtime_1.jsxs)("nav", { class: "view-tabs", "aria-label": "RCA workspace views", children: [(0, jsx_runtime_1.jsx)("button", { class: activeView === "workspace" ? "active" : "", type: "button", onClick: () => setActiveView("workspace"), children: "RCA Workspace" }), (0, jsx_runtime_1.jsx)("button", { class: activeView === "advanced" ? "active" : "", type: "button", disabled: !advancedEnabled, onClick: () => setActiveView("advanced"), children: "Advanced Analysis" })] }), activeView === "workspace" ? ((0, jsx_runtime_1.jsxs)("div", { class: "analysis-grid", children: [(0, jsx_runtime_1.jsxs)("section", { class: "live-output-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Live Output" }), (0, jsx_runtime_1.jsxs)("span", { children: [liveOutput.length, " lines"] })] }), (0, jsx_runtime_1.jsxs)("div", { class: "terminal-surface", ref: liveOutputRef, children: [(0, jsx_runtime_1.jsx)("div", { class: "run-context-block", children: contextLines.map((line) => (0, jsx_runtime_1.jsx)("p", { children: line })) }), liveOutput.length ? liveOutput.map((line) => renderLiveLine(line)) : ((0, jsx_runtime_1.jsxs)("div", { class: "empty-state", children: [(0, jsx_runtime_1.jsx)("strong", { children: "No run started" }), (0, jsx_runtime_1.jsx)("span", { children: "Choose source and start RCA to stream Codex output here." })] })), runState === "running" ? ((0, jsx_runtime_1.jsxs)("p", { class: "live-output-wait-cursor", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)("span", { children: "Processing" }), (0, jsx_runtime_1.jsxs)("span", { class: "wait-dots", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] })] })) : null] })] }), (0, jsx_runtime_1.jsxs)("section", { class: "rca-result-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "RCA Result" }), runState !== "idle" ? ((0, jsx_runtime_1.jsx)("span", { children: runState === "completed" ? "Ready" : runState === "failed" ? "Failed" : runState === "stopped" ? "Stopped" : "Waiting" })) : null] }), (0, jsx_runtime_1.jsx)("div", { class: "result-surface", children: rcaResult ? parseRcaResultSections(rcaResult).map((section) => ((0, jsx_runtime_1.jsxs)("article", { class: `rca-result-section ${getRcaSectionClass(section.heading, section.body)}`.trim(), children: [(0, jsx_runtime_1.jsx)("h3", { children: section.heading }), section.body ? renderRichText(section.body, "rca-result") : null] }))) : (0, jsx_runtime_1.jsx)("p", { class: "muted", children: "The RCA summary will appear here after Codex completes analysis." }) })] })] })) : ((0, jsx_runtime_1.jsxs)("section", { class: "advanced-panel", children: [(0, jsx_runtime_1.jsxs)("div", { class: "panel-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Advanced Analysis" }), (0, jsx_runtime_1.jsx)("span", { children: "Full output" })] }), (0, jsx_runtime_1.jsx)("div", { class: "advanced-output", children: renderRichText(advancedAnalysis || "Advanced Analysis unlocks after RCA completion.", "advanced") })] }))] })] })] }));
    }, "App", { "properties": { "appName": { "type": "string" }, "userLogin": { "type": "string" } } }, { "appName": "Oracle Restaurants RCA", "userLogin": "Signed in" });
});
