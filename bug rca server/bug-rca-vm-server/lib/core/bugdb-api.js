/**
 * bugdb-api.js
 * Oracle BugDB REST API client.
 * Fetches bug details, comments, and attachments directly from Oracle BugDB
 * using OAuth2 client-credentials (IDCS) auth, then formats the result for the AI prompt.
 *
 * Required env vars:
 *   BUGDB_CLIENT_ID     — OAuth2 client ID from Oracle IDCS
 *   BUGDB_CLIENT_SECRET — OAuth2 client secret from Oracle IDCS
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { spawnSync } = require("child_process");
const { normalizeReportText } = require("./file-utils");

// --- Oracle BugDB API endpoints (ORDS double-slash is intentional) ---
const DEFAULT_BUGDB_BASE_URL = "https://bug.oraclecorp.com/ords/bug//bugdb/bug/v1";
const DEFAULT_TOKEN_URL = "https://idcs-9dc693e80d9b469480d7afe00e743931.identity.oraclecloud.com/oauth2/v1/token";
const BUGDB_SCOPE = "bug.rest.idcs";

// --- Text size limits to keep AI prompts lean ---
const MAX_TEXT_LENGTH = 4000;
const MAX_COMMENT_LENGTH = 1200;
const REQUEST_TIMEOUT_MS = 20000;
const ATTACHMENT_DOWNLOAD_TIMEOUT_MS = 60000; // large files need more time
const DEFAULT_ATTACHMENT_ROOT_DIR = path.resolve(process.cwd(), "bugdb-attachments");

// --- Smart extraction limits: only pull error-relevant lines from large files ---
const SMART_EXTRACT_THRESHOLD = 8 * 1024;   // files bigger than 8 KB get smart-extracted
const SMART_EXTRACT_MAX_CHARS = 4 * 1024;   // max 4 KB per file after extraction
const SMART_EXTRACT_TOTAL_MAX = 12 * 1024;  // max 12 KB across all zip entries
const SMART_CONTEXT_LINES = 5;              // lines of context around each error line

// Patterns that indicate an error/exception line worth keeping
const ERROR_LINE_PATTERNS = [
  /\bERROR\b/i, /\bEXCEPTION\b/i, /\bFATAL\b/i, /\bFAILED\b/i,
  /ORA-\d+/,
  /SQLException/i, /NullPointerException/i, /StackOverflowError/i,
  /OutOfMemoryError/i, /ClassNotFoundException/i,
  /Caused by:/i, /\bat (com|oracle|java|sun|org|net)\./,
  /could not execute/i, /constraint violation/i, /unique constraint/i,
  /timeout/i, /connection refused/i, /access denied/i, /permission denied/i,
  /Traceback \(most recent/,
];

// File extensions we can read as plain text or extract from archives
const TEXT_EXTENSIONS = new Set([
  ".txt", ".log", ".csv", ".xml", ".json", ".md", ".sql", ".cfg",
  ".ini", ".properties", ".yaml", ".yml", ".html", ".htm",
  ".js", ".ts", ".py", ".java", ".cs", ".cpp", ".c", ".h"
]);

// File extensions we skip entirely — images, executables, Office docs, etc.
const BINARY_FILE_EXTS = new Set([
  ".bmp", ".png", ".jpg", ".jpeg", ".gif", ".tiff", ".ico", ".webp",
  ".exe", ".dll", ".so", ".bin", ".dat", ".pdf", ".doc", ".docx",
  ".xls", ".xlsx", ".ppt", ".pptx", ".mp4", ".mp3", ".avi", ".mov"
]);

const MAX_FILE_CONTENT_BYTES = 60 * 1024;
const MAX_TOTAL_CONTENT_BYTES = 250 * 1024;
const SEVEN_ZIP_CANDIDATES = [
  "7z",
  "C:\\Program Files\\7-Zip\\7z.exe",
  "C:\\Program Files (x86)\\7-Zip\\7z.exe"
];

// ─── Text helpers ────────────────────────────────────────────────────────────

function normalizeText(value) {
  return normalizeReportText(String(value || ""))
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(value, maxLength = MAX_TEXT_LENGTH) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

// ─── Config ──────────────────────────────────────────────────────────────────

/** Returns BugDB config from env vars, or null if credentials are missing. */
function resolveBugDbConfig() {
  const clientId = String(process.env.BUGDB_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.BUGDB_CLIENT_SECRET || "").trim();
  const baseUrl = String(process.env.BUGDB_API_BASE_URL || DEFAULT_BUGDB_BASE_URL).replace(/\/+$/, "");
  const tokenUrl = String(process.env.BUGDB_TOKEN_URL || DEFAULT_TOKEN_URL).trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, baseUrl, tokenUrl };
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

/** Low-level HTTP/HTTPS request — returns raw Buffer body + status + headers. */
function requestRaw(url, { method = "GET", headers = {}, body = null, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;
    const req = transport.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers,
        agent: isHttps ? new https.Agent({ rejectUnauthorized: true }) : undefined
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve({
          statusCode: res.statusCode,
          headers: res.headers || {},
          body: Buffer.concat(chunks)
        }));
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error("BugDB request timed out.")));
    if (body) req.write(body);
    req.end();
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Gets a short-lived OAuth2 bearer token from Oracle IDCS. */
async function fetchBugDbToken(clientId, clientSecret, tokenUrl) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = `grant_type=client_credentials&scope=${encodeURIComponent(BUGDB_SCOPE)}`;
  const response = await requestRaw(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
      "Content-Length": Buffer.byteLength(body)
    },
    body
  });
  const text = response.body.toString("utf8");
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`BugDB token fetch failed. HTTP ${response.statusCode}: ${truncateText(text, 400)}`);
  }
  const parsed = JSON.parse(text);
  const token = String(parsed.access_token || "").trim();
  if (!token) throw new Error("BugDB token response did not include access_token.");
  return token;
}

// ─── BugDB endpoint fetch ─────────────────────────────────────────────────────

/** Calls a BugDB REST endpoint with bearer auth and returns parsed JSON. */
async function fetchBugDbEndpoint(url, token) {
  const response = await requestRaw(url, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
  });
  const text = response.body.toString("utf8");
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`BugDB API call failed. HTTP ${response.statusCode}: ${truncateText(text, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("BugDB API returned invalid JSON.");
  }
}

// ─── Field extraction helpers ─────────────────────────────────────────────────

/** Walks a nested object by dot-separated key path, case-insensitively. */
function getField(obj, key) {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = String(key).split(".").filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    if (Object.prototype.hasOwnProperty.call(current, part)) { current = current[part]; continue; }
    const matchingKey = Object.keys(current).find((k) => k.toLowerCase() === part.toLowerCase());
    if (!matchingKey) return undefined;
    current = current[matchingKey];
  }
  return current;
}

/** Returns the first non-empty value found among the given key candidates. */
function pickRawField(obj, ...keys) {
  for (const key of keys) {
    const raw = getField(obj, key);
    if (raw === undefined || raw === null) continue;
    if (typeof raw === "string" && !raw.trim()) continue;
    return raw;
  }
  return undefined;
}

/** Like pickRawField but always returns a string (empty string if not found). */
function pickField(obj, ...keys) {
  const raw = pickRawField(obj, ...keys);
  if (raw === undefined || raw === null) return "";
  if (Buffer.isBuffer(raw)) return raw.toString("utf8").trim();
  if (typeof raw === "object") return "";
  return String(raw).trim();
}

/** Unwraps Oracle API response envelopes — handles items/data/rows wrappers. */
function unwrapItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const containerKeys = [
    "items", "rows", "data", "result", "results", "records", "bugs",
    "comments", "attachments", "files", "documents", "content"
  ];
  for (const key of containerKeys) {
    const value = getField(raw, key);
    if (Array.isArray(value)) return value;
  }
  const firstArray = Object.values(raw).find((value) => Array.isArray(value));
  if (Array.isArray(firstArray)) return firstArray;
  return [raw];
}

// ─── Comment normalizer ───────────────────────────────────────────────────────

/** Maps raw BugDB comment objects to a consistent shape. */
function normalizeComments(raw) {
  return unwrapItems(raw)
    .filter(Boolean)
    .map((c) => ({
      author: pickField(c,
        "author", "created_by", "createdBy", "user", "user_name", "username",
        "comment_by", "commentBy", "commenter", "employee_name", "employeeName"
      ),
      created: pickField(c,
        "date_created", "create_date", "created_date", "created", "creation_date",
        "timestamp", "comment_date", "commentDate", "last_updated"
      ),
      body: truncateText(pickField(c,
        "text", "body", "comment", "comment_text", "commentText", "comments",
        "description", "note", "notes", "remark", "remarks", "message", "value",
        "long_text", "longText"
      ), MAX_COMMENT_LENGTH)
    }))
    .filter((c) => c.body || c.author || c.created);
}

// ─── Attachment helpers ───────────────────────────────────────────────────────

/** Extracts a download URL from various link shapes in a raw attachment object. */
function findLink(rawAttachment) {
  const directLink = pickField(rawAttachment,
    "download_url", "downloadUrl", "downloadUri", "download_uri", "url", "uri", "href", "link"
  );
  if (directLink) return directLink;
  const links = pickRawField(rawAttachment, "links", "_links");
  if (Array.isArray(links)) {
    const preferred = links.find((l) => /download|content|self/i.test(String(l?.rel || l?.name || ""))) || links[0];
    return pickField(preferred, "href", "url", "uri");
  }
  if (links && typeof links === "object") {
    const preferred = links.download || links.content || links.self || Object.values(links)[0];
    return pickField(preferred, "href", "url", "uri") || (typeof preferred === "string" ? preferred : "");
  }
  return "";
}

/**
 * Maps raw Oracle BugDB attachment objects (ba_* fields) to a consistent shape.
 * Oracle attachment list endpoint returns fields prefixed with ba_.
 */
function normalizeAttachments(raw) {
  return unwrapItems(raw)
    .filter(Boolean)
    .map((a, index) => {
      const filename = pickField(a,
        "ba_file_name", "filename", "file_name", "fileName", "name",
        "attachment_name", "attachmentName", "title", "display_name", "displayName"
      );
      const id = pickField(a,
        "ba_file_md5sum", "id", "attachment_id", "attachmentId", "file_id", "fileId",
        "document_id", "documentId", "doc_id", "docId", "content_id", "contentId"
      );
      return {
        id,
        filename: filename || (id ? `attachment-${id}` : `attachment-${index + 1}`),
        mimeType: pickField(a, "mime_type", "mimeType", "content_type", "contentType", "type"),
        size: Number(pickField(a, "size", "file_size", "fileSize", "content_length", "contentLength") || 0),
        uploadedBy: pickField(a, "ba_created_by", "created_by", "createdBy", "uploaded_by", "uploadedBy"),
        uploadedDate: pickField(a, "ba_created_date", "created_date", "createdDate"),
        comments: pickField(a, "ba_comments", "comments", "description", "note"),
        downloadUrl: findLink(a),
        downloaded: false,
        localPath: "",
        downloadError: ""
      };
    })
    .filter((a) => a.filename || a.id || a.downloadUrl);
}

/** Makes a filename safe for the local filesystem. */
function sanitizeFilename(filename) {
  const sanitized = String(filename || "attachment")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized || "attachment";
}

/** Returns a unique file path — appends -2, -3 etc. if the name already exists. */
function uniqueFilePath(dir, filename) {
  const parsed = path.parse(sanitizeFilename(filename));
  const extension = parsed.ext || "";
  const basename = parsed.name || "attachment";
  let candidate = path.join(dir, `${basename}${extension}`);
  let counter = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${basename}-${counter}${extension}`);
    counter += 1;
  }
  return candidate;
}

function isTextFile(filename) {
  return TEXT_EXTENSIONS.has(path.extname(String(filename || "")).toLowerCase());
}

function isBinaryFile(filename) {
  return BINARY_FILE_EXTS.has(path.extname(String(filename || "")).toLowerCase());
}

// ─── Oracle PAR (Pre-Authenticated Request) download ─────────────────────────

/**
 * Step 1 of Oracle attachment download:
 * Ask BugDB for a time-limited PAR URL (valid ~5 min) for the given filename.
 * Oracle docs: GET /header/:rptno/attachments/:filename → { responseMsg: "https://..." }
 */
async function fetchOraclePar(base, token, bugNumber, filename) {
  const bugId = encodeURIComponent(bugNumber);
  const encodedFilename = encodeURIComponent(filename);
  const url = `${base}/header/${bugId}/attachments/${encodedFilename}`;
  const response = await requestRaw(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "header_filename": filename   // Oracle requirement for filenames with special chars
    }
  });
  const text = response.body.toString("utf8");
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`PAR fetch failed. HTTP ${response.statusCode}: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text);
  const parUrl = String(parsed.responseMsg || parsed.url || parsed.par_url || "").trim();
  if (!parUrl || !/^https?:\/\//i.test(parUrl)) {
    throw new Error(`Oracle BugDB did not return a valid PAR URL. Response: ${text.slice(0, 200)}`);
  }
  return parUrl;
}

// ─── Smart content extraction ─────────────────────────────────────────────────

/**
 * For large log/text files: instead of sending everything to the AI,
 * extract only lines that contain errors/exceptions + surrounding context.
 * Saves tokens and keeps the AI focused on relevant content.
 */
function smartExtractContent(text, maxChars = SMART_EXTRACT_MAX_CHARS) {
  if (!text) return "";
  if (text.length <= SMART_EXTRACT_THRESHOLD) return text;

  const lines = text.split("\n");
  const included = new Set();
  lines.forEach((line, i) => {
    if (ERROR_LINE_PATTERNS.some(p => p.test(line))) {
      for (let j = Math.max(0, i - SMART_CONTEXT_LINES); j <= Math.min(lines.length - 1, i + SMART_CONTEXT_LINES); j++) {
        included.add(j);
      }
    }
  });

  if (included.size === 0) {
    return text.slice(0, maxChars) +
      (text.length > maxChars ? `\n...[${text.length - maxChars} bytes omitted — no error/exception patterns detected in remaining content]` : "");
  }

  const sorted = [...included].sort((a, b) => a - b);
  const parts = [];
  let prev = -2;
  let chunk = [];
  for (const idx of sorted) {
    if (idx > prev + 1 && chunk.length) { parts.push(chunk.join("\n")); chunk = ["  ..."]; }
    chunk.push(lines[idx]);
    prev = idx;
  }
  if (chunk.length) parts.push(chunk.join("\n"));

  const result = parts.join("\n");
  const trimmed = result.length > maxChars ? result.slice(0, maxChars) + "\n...[truncated]" : result;
  return trimmed + `\n[Smart extract: ${included.size}/${lines.length} lines — error/exception/SQL patterns]`;
}

/** Reads a text file safely, capping at MAX_FILE_CONTENT_BYTES. */
function readTextSafe(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_CONTENT_BYTES) {
      const buf = Buffer.alloc(MAX_FILE_CONTENT_BYTES);
      const fd = fs.openSync(filePath, "r");
      fs.readSync(fd, buf, 0, MAX_FILE_CONTENT_BYTES, 0);
      fs.closeSync(fd);
      return buf.toString("utf8").replace(/�/g, "?");
    }
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/** Reads text entries from a .zip file and smart-extracts their content. */
function extractZipContent(zipPath) {
  try {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(zipPath);
    const parts = [];
    let total = 0;
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !isTextFile(entry.entryName)) continue;
      if (total >= SMART_EXTRACT_TOTAL_MAX) { parts.push("...[total content limit reached]"); break; }
      try {
        const raw = entry.getData().toString("utf8");
        const extracted = smartExtractContent(raw, SMART_EXTRACT_MAX_CHARS - total);
        parts.push(`--- ${entry.entryName} ---\n${extracted}`);
        total += extracted.length;
      } catch { /* skip unreadable entry */ }
    }
    return parts.length ? parts.join("\n\n") : null;
  } catch {
    return null;
  }
}

/** Finds the 7-Zip binary on this machine. */
function find7zBinary() {
  for (const bin of SEVEN_ZIP_CANDIDATES) {
    const result = spawnSync(bin, ["i"], { stdio: "ignore", timeout: 3000 });
    if (result.status === 0 || result.error == null) return bin;
  }
  return null;
}

/** Extracts text entries from a .7z archive using the local 7-Zip installation. */
function extract7zContent(archivePath) {
  const bin = find7zBinary();
  if (!bin) return null;
  const extractDir = archivePath + "_7z_extracted";
  try {
    fs.mkdirSync(extractDir, { recursive: true });
    const result = spawnSync(bin, ["e", archivePath, `-o${extractDir}`, "-y"], { timeout: 30000 });
    if (result.status !== 0) throw new Error("7z extraction failed");
    const parts = [];
    let total = 0;
    for (const file of fs.readdirSync(extractDir)) {
      if (!isTextFile(file) || total >= MAX_TOTAL_CONTENT_BYTES) break;
      const text = readTextSafe(path.join(extractDir, file));
      if (text) { parts.push(`--- ${file} ---\n${text}`); total += text.length; }
    }
    return parts.length ? parts.join("\n\n") : null;
  } catch {
    return null;
  } finally {
    try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/** Routes a downloaded attachment to the right reader (text, zip, or 7z). */
function readAttachmentContent(attachment) {
  if (!attachment.downloaded || !attachment.localPath) return "";
  const ext = path.extname(attachment.filename || "").toLowerCase();
  if (isTextFile(attachment.filename)) {
    const raw = readTextSafe(attachment.localPath);
    return raw ? smartExtractContent(raw) : "";
  }
  if (ext === ".zip") return extractZipContent(attachment.localPath) || "";
  if (ext === ".7z") return extract7zContent(attachment.localPath) || "";
  return "";
}

// ─── Attachment download ──────────────────────────────────────────────────────

/**
 * Downloads a single attachment using Oracle's two-step PAR flow:
 *   1. GET PAR URL from BugDB (authenticated, returns a time-limited storage URL)
 *   2. Download file from PAR URL (no auth required, expires in ~5 min)
 *
 * If textOnly=true, binary files (images, executables, etc.) are skipped entirely
 * to avoid wasting tokens on content the AI can't use.
 */
async function downloadAttachment({ attachment, token, base, bugNumber, attachmentsDir, textOnly }) {
  if (!attachment.filename) {
    return { ...attachment, downloaded: false, downloadError: "Attachment has no filename." };
  }
  // Skip binary files when textOnly mode is on — no point downloading what we can't read
  if (textOnly && isBinaryFile(attachment.filename)) {
    return { ...attachment, downloaded: false, downloadError: "", content: "",
      _skipped: "binary file skipped (textOnly mode)" };
  }

  try {
    // Step 1: Ask Oracle BugDB for a pre-authenticated download URL
    const parUrl = await fetchOraclePar(base, token, bugNumber, attachment.filename);

    // Step 2: Download the actual file from Oracle Object Storage (no auth needed)
    await fs.promises.mkdir(attachmentsDir, { recursive: true });
    const downloaded = await requestRaw(parUrl, { headers: { "Accept": "*/*" }, timeoutMs: ATTACHMENT_DOWNLOAD_TIMEOUT_MS });
    if (downloaded.statusCode < 200 || downloaded.statusCode >= 300) {
      throw new Error(`PAR download failed. HTTP ${downloaded.statusCode}`);
    }

    const localPath = uniqueFilePath(attachmentsDir, attachment.filename);
    await fs.promises.writeFile(localPath, downloaded.body);

    const withPath = {
      ...attachment,
      downloaded: true,
      localPath,
      downloadUrl: parUrl,
      size: attachment.size || Number(downloaded.headers["content-length"] || 0) || downloaded.body.length,
      downloadError: ""
    };
    // Read and smart-extract the file content for the AI prompt
    return { ...withPath, content: readAttachmentContent(withPath) };
  } catch (err) {
    return { ...attachment, downloaded: false, downloadError: err?.message || "Attachment download failed." };
  }
}

/** Downloads all attachments in parallel. */
async function downloadAttachments({ attachments, token, base, bugNumber, attachmentsDir, textOnly }) {
  return Promise.all(
    attachments.map((attachment) => downloadAttachment({ attachment, token, base, bugNumber, attachmentsDir, textOnly }))
  );
}

// ─── Endpoint discovery ───────────────────────────────────────────────────────

/**
 * Tries each candidate endpoint in order and returns the first successful response.
 * BugDB has inconsistent URL patterns across versions — this handles the variation.
 */
async function fetchEndpointCandidates(base, token, endpointCandidates, label) {
  let lastError = "";
  for (const endpoint of endpointCandidates) {
    const url = `${base}${endpoint}`;
    try {
      return { ok: true, endpoint, value: await fetchBugDbEndpoint(url, token), error: "" };
    } catch (err) {
      lastError = err?.message || String(err);
    }
  }
  return { ok: false, endpoint: "", value: null, error: `${label} fetch failed: ${lastError}` };
}

function endpointError(result) {
  return result?.ok ? "" : String(result?.error || "Unknown BugDB endpoint error");
}

function firstItem(raw) {
  return unwrapItems(raw)[0] || {};
}

/** Pulls problem statement and description from header or details endpoint data. */
function extractDescription(header, details) {
  const problemStatement = pickField(details,
    "problem_statement", "problemStatement", "problem", "problem_description", "problemDescription",
    "steps_to_reproduce", "stepsToReproduce", "str", "STR", "repro_steps", "reproSteps"
  ) || pickField(header,
    "problem_statement", "problemStatement", "problem", "problem_description", "problemDescription",
    "steps_to_reproduce", "stepsToReproduce", "str", "STR", "repro_steps", "reproSteps"
  );
  const description = pickField(header,
    "description", "text", "body", "detail_text", "detailText", "long_description", "longDescription"
  ) || pickField(details,
    "description", "text", "body", "detail_text", "detailText", "long_description", "longDescription"
  );
  return {
    problemStatement: normalizeText(problemStatement || description),
    description: normalizeText(description || problemStatement)
  };
}

// ─── Codex prompt formatter ───────────────────────────────────────────────────

/**
 * Converts raw BugDB evidence into a clean text block for the AI prompt.
 * Only includes attachments that have actual readable content —
 * binary files are listed in a single summary line to avoid token waste.
 */
function formatBugDbEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") return "";
  const lines = [];
  lines.push(`Bug Number: ${evidence.bugNumber || "(empty)"}`);
  if (evidence.synopsis) lines.push(`Synopsis: ${evidence.synopsis}`);
  lines.push("");

  lines.push("1) Problem statement / Description");
  lines.push(evidence.problemStatement || evidence.description || "(empty)");
  lines.push("");

  lines.push(`2) Comments (${(evidence.comments || []).length})`);
  if (!(evidence.comments || []).length) {
    lines.push("(none)");
  } else {
    evidence.comments.forEach((comment, index) => {
      const headingParts = [comment.created, comment.author].filter(Boolean);
      lines.push(`[${index + 1}] ${headingParts.join(" - ") || "Comment"}`);
      lines.push(comment.body || "(empty)");
      lines.push("");
    });
  }

  const allAttachments = evidence.attachments || [];
  const readable = allAttachments.filter(a => a.content);   // only files with actual text
  const skipped = allAttachments.filter(a => !a.content);   // images, binaries, failed downloads

  lines.push(`3) Attachments — ${readable.length} with readable content, ${skipped.length} binary/skipped`);
  if (!allAttachments.length) {
    lines.push("(none)");
  } else if (!readable.length) {
    lines.push("(no readable text content — all attachments are binary files or were not downloaded)");
    if (skipped.length) {
      skipped.forEach(a => lines.push(`  - ${a.filename}${a.comments ? `: ${a.comments}` : ""}`));
    }
  } else {
    readable.forEach((attachment, index) => {
      const sizeStr = attachment.size ? `${Math.ceil(attachment.size / 1024)} KB` : "unknown size";
      const meta = [
        attachment.uploadedBy ? `by ${attachment.uploadedBy}` : "",
        attachment.uploadedDate ? `on ${attachment.uploadedDate.slice(0, 10)}` : ""
      ].filter(Boolean).join(" ");
      lines.push(`[${index + 1}] ${attachment.filename}${meta ? ` (${meta})` : ""} — ${sizeStr}`);
      if (attachment.comments) lines.push(`    Note: ${attachment.comments}`);
      lines.push(attachment.content);
      lines.push("");
    });
    // One-liner for binaries — names only, no token waste
    if (skipped.length) {
      lines.push(`Binary attachments (content excluded): ${skipped.map(a => a.filename).join(", ")}`);
    }
  }

  // Include any API errors as a short warning block
  const errors = Object.entries(evidence.endpointErrors || {}).filter(([, value]) => value);
  if (errors.length) {
    lines.push("");
    lines.push("Endpoint warnings");
    errors.forEach(([name, error]) => {
      const clean = /HTTP 404/i.test(error)
        ? `${name}: not available (HTTP 404)`
        : `${name}: ${String(error).split("\n")[0].slice(0, 200)}`;
      lines.push(`- ${clean}`);
    });
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Main public API ──────────────────────────────────────────────────────────

/**
 * Fetches all available data for a BugDB bug number:
 * header (title, status, priority, severity, product, assignee),
 * comments, details, and attachments.
 *
 * Options:
 *   downloadAttachments: true  — download text/zip attachments to disk and read their content
 *   textOnly: true             — skip binary files (images, executables) entirely
 *   attachmentRootDir          — override local save directory (default: ./bugdb-attachments/)
 */
async function fetchDirectBugDbEvidence(bugNumber, options = {}) {
  const config = resolveBugDbConfig();
  if (!config) {
    throw new Error(
      "BugDB is not configured. Set BUGDB_CLIENT_ID and BUGDB_CLIENT_SECRET environment variables."
    );
  }
  const normalizedId = String(bugNumber || "").trim();
  if (!normalizedId) throw new Error("BugDB bug number is required.");

  const token = await fetchBugDbToken(config.clientId, config.clientSecret, config.tokenUrl);
  const base = config.baseUrl;
  const encodedId = encodeURIComponent(normalizedId);

  // Fire all endpoint requests in parallel for speed
  const [headerResult, commentsResult, detailsResult, attachmentsResult] = await Promise.all([
    fetchEndpointCandidates(base, token, [`/header/${encodedId}`, `/${encodedId}`, `/bug/${encodedId}`, `/bugs/${encodedId}`], "header"),
    fetchEndpointCandidates(base, token, [`/comments/${encodedId}`, `/comment/${encodedId}`], "comments"),
    fetchEndpointCandidates(base, token, [`/details/${encodedId}`, `/detail/${encodedId}`, `/description/${encodedId}`], "details"),
    fetchEndpointCandidates(base, token, [`/header/${encodedId}/attachments`, `/attachments/${encodedId}`, `/attachment/${encodedId}`], "attachments")
  ]);

  const header = firstItem(headerResult.value);
  const details = firstItem(detailsResult.value);
  const comments = normalizeComments(commentsResult.ok ? commentsResult.value : []);
  const normalizedAttachments = normalizeAttachments(attachmentsResult.ok ? attachmentsResult.value : []);

  const attachmentRootDir = options.attachmentRootDir || process.env.BUGDB_ATTACHMENT_DIR || DEFAULT_ATTACHMENT_ROOT_DIR;
  const attachmentsDir = path.resolve(attachmentRootDir, normalizedId);
  const shouldDownloadAttachments = options.downloadAttachments !== false;
  const textOnly = options.textOnly === true;
  const attachments = shouldDownloadAttachments && normalizedAttachments.length
    ? await downloadAttachments({ attachments: normalizedAttachments, token, base, bugNumber: normalizedId, attachmentsDir, textOnly })
    : normalizedAttachments;

  // Oracle BugDB uses non-standard field names — confirmed from live --raw API output
  const synopsis = pickField(header,
    "subject", "abstract", "synopsis", "summary", "title", "bug_title", "bugTitle",
    "bug_abstract", "bugAbstract", "short_desc", "shortDesc"
  );
  const statusCode = pickField(header, "status", "bug_status", "bugStatus", "status_code", "statusCode");
  const statusDesc = pickField(header,
    "st_description", "status_desc", "status_name", "status_text", "status_label",
    "statusDesc", "statusName", "statusText"
  );
  const status = statusDesc ? `${statusCode} - ${statusDesc}` : statusCode;
  const { problemStatement, description } = extractDescription(header, details);

  return {
    bugNumber: normalizedId,
    synopsis,
    status,
    priority: pickField(header,
      "dev_priority", "priority", "priority_code", "priorityCode", "priority_level",
      "priorityLevel", "priority_name", "priorityName"
    ),
    severity: pickField(header,
      "sv_description", "severity", "severity_code", "severityCode", "severity_level",
      "severityLevel", "severity_name", "severityName"
    ),
    product: pickField(header,
      "pr_description", "product_name", "productName", "product", "product_desc",
      "productDesc", "product_abbreviation", "productAbbreviation"
    ),
    component: pickField(header, "component", "sub_component", "subcomponent", "subComponent"),
    assignee: pickField(header, "assigned_to", "assignee", "assignedTo", "assigned_user", "assignedUser"),
    reporter: pickField(header,
      "reported_by", "reporter", "created_by", "reportedBy",
      "createdBy", "submitted_by", "submittedBy"
    ),
    created: pickField(header,
      "reported_date", "create_date", "date_created", "created_date", "creation_date",
      "submit_date", "date_submitted", "created", "createdDate", "submitDate"
    ),
    updated: pickField(header,
      "updated_date", "modify_date", "date_modified", "modified_date", "last_modified",
      "update_date", "date_updated", "last_updated", "updated", "updatedDate"
    ),
    problemStatement,
    description,
    comments,
    attachments,
    attachmentDirectory: attachmentsDir,  // server-internal path — stripped before browser response
    endpointSources: {
      header: headerResult.endpoint,
      comments: commentsResult.endpoint,
      details: detailsResult.endpoint,
      attachments: attachmentsResult.endpoint
    },
    endpointErrors: {
      header: endpointError(headerResult),
      comments: endpointError(commentsResult),
      details: endpointError(detailsResult),
      attachments: endpointError(attachmentsResult)
    }
  };
}

/**
 * Fetches the raw (unprocessed) BugDB header for a bug number.
 * Used by the --raw test flag to inspect actual Oracle API field names.
 */
async function fetchRawBugDbHeader(bugNumber) {
  const config = resolveBugDbConfig();
  if (!config) throw new Error("BugDB is not configured.");
  const token = await fetchBugDbToken(config.clientId, config.clientSecret, config.tokenUrl);
  const encodedId = encodeURIComponent(String(bugNumber || "").trim());
  const result = await fetchEndpointCandidates(
    config.baseUrl, token,
    [`/header/${encodedId}`, `/${encodedId}`, `/bug/${encodedId}`],
    "header"
  );
  return { raw: result.value, endpoint: result.endpoint, error: result.error };
}

module.exports = {
  fetchDirectBugDbEvidence,
  fetchRawBugDbHeader,
  resolveBugDbConfig,
  formatBugDbEvidence
};
