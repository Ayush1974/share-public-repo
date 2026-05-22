const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  APP_ROOT,
  DATA_DIR,
  REMOTE_WORKSPACE_RUNS_DIR,
  SHARED_WORKSPACE_OPTIONS
} = require("../core/config");

const SHARED_WORKSPACE_PREFIX = "shared://";
const REMOTE_RUN_ROOT = REMOTE_WORKSPACE_RUNS_DIR;
const MAX_SEARCH_RESULTS = 200;
const SHARED_WORKSPACE_TOKEN_SECRET_FILE = path.join(DATA_DIR, "shared-workspace-token-secret.txt");
const SHARED_WORKSPACE_ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const PACKAGED_REFERENCE_DIR = path.join(APP_ROOT, "references");
const SHARE_ROOT_DIR = path.resolve(APP_ROOT, "..", "..");
const MEMORY_BANK_REFERENCE_FILE = "generate-memory-bank-FINAL.md";
const ROOT_MEMORY_BANK_REFERENCE = path.join(SHARE_ROOT_DIR, MEMORY_BANK_REFERENCE_FILE);
const PACKAGED_REFERENCE_FILES = [
  "BUGINTWFLOW.md",
  ".clinerules",
  "CLINE_BUGDB_SETUP_GUIDE.md",
  MEMORY_BANK_REFERENCE_FILE
];

let sharedWorkspaceTokenSecret = "";

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function copyPackagedReferences(runDir) {
  const targetReferenceDir = path.join(runDir, "references");
  fs.mkdirSync(targetReferenceDir, { recursive: true });

  let packagedMemoryBankCopied = false;
  if (fs.existsSync(PACKAGED_REFERENCE_DIR)) {
    for (const fileName of PACKAGED_REFERENCE_FILES) {
      const sourcePath = path.join(PACKAGED_REFERENCE_DIR, fileName);
      if (!fs.existsSync(sourcePath)) {
        continue;
      }
      fs.copyFileSync(sourcePath, path.join(targetReferenceDir, fileName));
      if (fileName === MEMORY_BANK_REFERENCE_FILE) {
        packagedMemoryBankCopied = true;
      }
    }
  }

  if (!packagedMemoryBankCopied && fs.existsSync(ROOT_MEMORY_BANK_REFERENCE)) {
    fs.copyFileSync(ROOT_MEMORY_BANK_REFERENCE, path.join(targetReferenceDir, MEMORY_BANK_REFERENCE_FILE));
  }
}

function getSharedWorkspaceTokenSecret() {
  if (sharedWorkspaceTokenSecret) {
    return sharedWorkspaceTokenSecret;
  }

  const fromEnv = String(process.env.SHARED_WORKSPACE_TOKEN_SECRET || "").trim();
  if (fromEnv) {
    sharedWorkspaceTokenSecret = fromEnv;
    return sharedWorkspaceTokenSecret;
  }

  try {
    if (fs.existsSync(SHARED_WORKSPACE_TOKEN_SECRET_FILE)) {
      const storedSecret = fs.readFileSync(SHARED_WORKSPACE_TOKEN_SECRET_FILE, "utf8").trim();
      if (storedSecret) {
        sharedWorkspaceTokenSecret = storedSecret;
        return sharedWorkspaceTokenSecret;
      }
    }
  } catch (error) {
    // Fall through and create a new secret.
  }

  sharedWorkspaceTokenSecret = crypto.randomBytes(32).toString("hex");
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SHARED_WORKSPACE_TOKEN_SECRET_FILE, `${sharedWorkspaceTokenSecret}\n`, "utf8");
  } catch (error) {
    // Keep the in-memory secret even if persistence fails.
  }
  return sharedWorkspaceTokenSecret;
}

function signTokenPayload(payload) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = encodeBase64Url(crypto.createHmac("sha256", getSharedWorkspaceTokenSecret()).update(body).digest());
  return `${body}.${signature}`;
}

function verifyTokenPayload(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = encodeBase64Url(crypto.createHmac("sha256", getSharedWorkspaceTokenSecret()).update(body).digest());
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(body).toString("utf8"));
  } catch (error) {
    return null;
  }
}

function buildSharedWorkspaceTokenSubject(user = {}) {
  const candidates = [
    user.email,
    user.loginId,
    user.username,
    user.upn,
    user.sub,
    user.id,
    user.name
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
  }

  return "unknown-user";
}

function issueSharedWorkspaceAccessToken(user, ttlMs = SHARED_WORKSPACE_ACCESS_TOKEN_TTL_MS) {
  const issuedAt = Date.now();
  return signTokenPayload({
    type: "shared-workspace-access",
    sub: buildSharedWorkspaceTokenSubject(user),
    iat: issuedAt,
    exp: issuedAt + Math.max(60 * 1000, Number(ttlMs) || SHARED_WORKSPACE_ACCESS_TOKEN_TTL_MS)
  });
}

function verifySharedWorkspaceAccessToken(token) {
  const payload = verifyTokenPayload(token);
  if (!payload || payload.type !== "shared-workspace-access") {
    return null;
  }

  const expiresAt = Number(payload.exp || 0);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

function getSharedWorkspaceAccessTokenFromRequest(req) {
  const bearerToken = String(req?.headers?.authorization || "").trim();
  if (/^bearer\s+/i.test(bearerToken)) {
    return bearerToken.replace(/^bearer\s+/i, "").trim();
  }

  const headerToken = String(req?.headers?.["x-shared-workspace-token"] || "").trim();
  if (headerToken) {
    return headerToken;
  }

  try {
    const url = new URL(req?.url || "/", "http://localhost");
    return String(url.searchParams.get("token") || "").trim();
  } catch (error) {
    return "";
  }
}

function normalizeSharedRootId(value, fallback = "shared-root") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function canonicalizeSharedRootId(value) {
  const normalizedRootId = normalizeSharedRootId(value, "");
  if (!normalizedRootId) {
    return normalizedRootId;
  }
  if (normalizedRootId === "simphony-temp") {
    return "simphony";
  }
  return SHARED_WORKSPACE_OPTIONS[normalizedRootId]?.id || normalizedRootId;
}

function normalizeRelativePath(value = "") {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");

  if (!normalized || normalized === ".") {
    return "";
  }

  const parts = normalized.split("/").filter(Boolean);
  const safeParts = [];
  for (const part of parts) {
    if (part === ".") {
      continue;
    }
    if (part === "..") {
      if (!safeParts.length) {
        throw new Error("Path escapes the shared workspace root.");
      }
      safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return safeParts.join("/");
}

function buildSharedWorkspaceDescriptor(rootId, relativePath = "") {
  const normalizedRootId = canonicalizeSharedRootId(rootId);
  if (!normalizedRootId) {
    throw new Error("Shared workspace root id is required.");
  }
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  return normalizedRelativePath
    ? `${SHARED_WORKSPACE_PREFIX}${normalizedRootId}/${normalizedRelativePath}`
    : `${SHARED_WORKSPACE_PREFIX}${normalizedRootId}`;
}

function parseSharedWorkspaceDescriptor(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue.toLowerCase().startsWith(SHARED_WORKSPACE_PREFIX)) {
    return null;
  }

  const remainder = rawValue.slice(SHARED_WORKSPACE_PREFIX.length);
  const slashIndex = remainder.indexOf("/");
  const rootId = slashIndex >= 0 ? remainder.slice(0, slashIndex) : remainder;
  const relativePath = slashIndex >= 0 ? remainder.slice(slashIndex + 1) : "";
  const normalizedRootId = normalizeSharedRootId(rootId, "");
  if (!normalizedRootId) {
    throw new Error("Shared workspace descriptor is missing the root id.");
  }
  const canonicalRootId = canonicalizeSharedRootId(normalizedRootId);

  return {
    descriptor: buildSharedWorkspaceDescriptor(canonicalRootId, relativePath),
    rootId: canonicalRootId,
    relativePath: normalizeRelativePath(relativePath)
  };
}

function getSharedWorkspaceList() {
  return Object.values(SHARED_WORKSPACE_OPTIONS);
}

function getSharedWorkspaceRoot(rootId) {
  const normalizedRootId = canonicalizeSharedRootId(rootId);
  if (!normalizedRootId || !SHARED_WORKSPACE_OPTIONS[normalizedRootId]) {
    throw new Error(`Unknown shared workspace root: ${rootId}`);
  }
  return SHARED_WORKSPACE_OPTIONS[normalizedRootId];
}

function resolveSharedWorkspacePath(rootId, relativePath = "") {
  const root = getSharedWorkspaceRoot(rootId);
  const absoluteRootPath = path.resolve(root.rootPath);
  const rootPrefix = absoluteRootPath.endsWith(path.sep) ? absoluteRootPath : `${absoluteRootPath}${path.sep}`;
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const absoluteTargetPath = normalizedRelativePath
    ? path.resolve(absoluteRootPath, normalizedRelativePath)
    : absoluteRootPath;

  if (absoluteTargetPath !== absoluteRootPath && !absoluteTargetPath.startsWith(rootPrefix)) {
    throw new Error("Shared workspace path escapes the configured root.");
  }

  return {
    root,
    absoluteRootPath,
    absoluteTargetPath,
    relativePath: normalizedRelativePath
  };
}

function toPosixPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function listSharedWorkspaceEntries(rootId, relativePath = "") {
  const { root, absoluteTargetPath, relativePath: normalizedRelativePath } = resolveSharedWorkspacePath(rootId, relativePath);
  if (!fs.existsSync(absoluteTargetPath)) {
    throw new Error("Shared workspace path does not exist on the server.");
  }

  const stat = fs.statSync(absoluteTargetPath);
  if (!stat.isDirectory()) {
    throw new Error("Shared workspace browse target must be a folder.");
  }

  const entries = fs.readdirSync(absoluteTargetPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith(".") || entry.name === ".svn")
    .map((entry) => {
      const entryRelativePath = normalizeRelativePath(path.posix.join(toPosixPath(normalizedRelativePath), entry.name));
      return {
        name: entry.name,
        kind: entry.isDirectory() ? "directory" : "file",
        relativePath: entryRelativePath,
        descriptor: buildSharedWorkspaceDescriptor(root.id, entryRelativePath)
      };
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "directory" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

  return {
    rootId: root.id,
    rootLabel: root.label,
    descriptor: buildSharedWorkspaceDescriptor(root.id, normalizedRelativePath),
    relativePath: normalizedRelativePath,
    parentPath: normalizedRelativePath.includes("/")
      ? normalizedRelativePath.slice(0, normalizedRelativePath.lastIndexOf("/"))
      : "",
    entries
  };
}

function readSharedWorkspaceFile(rootId, relativePath, startLine = 1, lineCount = 80) {
  const { root, absoluteTargetPath, relativePath: normalizedRelativePath } = resolveSharedWorkspacePath(rootId, relativePath);
  if (!fs.existsSync(absoluteTargetPath)) {
    throw new Error("Shared workspace file does not exist on the server.");
  }

  const stat = fs.statSync(absoluteTargetPath);
  if (!stat.isFile()) {
    throw new Error("Shared workspace read target must be a file.");
  }

  const content = fs.readFileSync(absoluteTargetPath, "utf8");
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const normalizedStart = Number.isFinite(Number(startLine)) ? Math.max(1, Number(startLine)) : 1;
  const normalizedCount = Number.isFinite(Number(lineCount)) ? Math.min(Math.max(1, Number(lineCount)), 400) : 80;
  const endLine = Math.min(lines.length, normalizedStart + normalizedCount - 1);
  const slice = lines.slice(normalizedStart - 1, endLine).map((line, index) => ({
    lineNumber: normalizedStart + index,
    text: line
  }));

  return {
    rootId: root.id,
    rootLabel: root.label,
    relativePath: normalizedRelativePath,
    descriptor: buildSharedWorkspaceDescriptor(root.id, normalizedRelativePath),
    totalLines: lines.length,
    startLine: normalizedStart,
    endLine,
    lines: slice
  };
}

function commandExists(command) {
  const candidate = String(command || "").trim();
  if (!candidate) {
    return false;
  }

  if (candidate.includes(path.sep) || (path.posix.sep && candidate.includes(path.posix.sep))) {
    return fs.existsSync(candidate);
  }

  const pathEntries = String(process.env.PATH || "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const windowsExtensions = process.platform === "win32"
    ? String(process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD")
      .split(";")
      .map((extension) => extension.trim().toLowerCase())
      .filter(Boolean)
    : [""];

  for (const pathEntry of pathEntries) {
    if (process.platform === "win32") {
      const hasExtension = Boolean(path.extname(candidate));
      const namesToTry = hasExtension
        ? [candidate]
        : windowsExtensions.map((extension) => `${candidate}${extension}`);

      for (const name of namesToTry) {
        if (fs.existsSync(path.join(pathEntry, name))) {
          return true;
        }
      }
      continue;
    }

    const resolvedPath = path.join(pathEntry, candidate);
    if (fs.existsSync(resolvedPath)) {
      return true;
    }
  }

  return false;
}

function globToRegExp(globPattern) {
  const normalized = String(globPattern || "").trim().replace(/\\/g, "/");
  if (!normalized) {
    return null;
  }

  let source = "^";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === "*") {
      if (next === "*") {
        source += ".*";
        index += 1;
      } else {
        source += "[^/]*";
      }
      continue;
    }

    if (char === "?") {
      source += ".";
      continue;
    }

    if ("/.+^${}()|[]\\".includes(char)) {
      source += `\\${char}`;
      continue;
    }

    source += char;
  }
  source += "$";
  return new RegExp(source, "i");
}

function listSearchCandidateFiles(absoluteTargetPath, baseRelativePath = "") {
  const entries = fs.readdirSync(absoluteTargetPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = normalizeRelativePath(path.posix.join(toPosixPath(baseRelativePath), entry.name));

    if (entry.isDirectory()) {
      if ([".svn", "bin", "obj"].includes(entry.name)) {
        continue;
      }
      files.push(...listSearchCandidateFiles(path.join(absoluteTargetPath, entry.name), relativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push({
        absolutePath: path.join(absoluteTargetPath, entry.name),
        relativePath
      });
    }
  }

  return files;
}

function searchSharedWorkspaceFallback(root, absoluteTargetPath, normalizedRelativePath, pattern, globPattern) {
  const globRegex = globToRegExp(globPattern);
  const globUsesPath = String(globPattern || "").replace(/\\/g, "/").includes("/");
  let searchRegex = null;
  try {
    searchRegex = new RegExp(pattern);
  } catch (error) {
    searchRegex = null;
  }

  const matches = [];
  const candidateFiles = listSearchCandidateFiles(absoluteTargetPath, normalizedRelativePath);
  for (const file of candidateFiles) {
    const globTarget = globUsesPath ? file.relativePath : path.posix.basename(file.relativePath);
    if (globRegex && !globRegex.test(globTarget)) {
      continue;
    }

    const content = fs.readFileSync(file.absolutePath, "utf8");
    const lines = content.replace(/\r\n/g, "\n").split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const lineText = lines[lineIndex];
      const matched = searchRegex ? searchRegex.test(lineText) : lineText.includes(pattern);
      if (!matched) {
        continue;
      }

      matches.push({
        relativePath: file.relativePath,
        descriptor: buildSharedWorkspaceDescriptor(root.id, file.relativePath),
        lineNumber: lineIndex + 1,
        preview: lineText.trimEnd()
      });

      if (matches.length >= MAX_SEARCH_RESULTS) {
        return {
          rootId: root.id,
          rootLabel: root.label,
          descriptor: buildSharedWorkspaceDescriptor(root.id, normalizedRelativePath),
          relativePath: normalizedRelativePath,
          pattern,
          glob: globPattern,
          matches
        };
      }
    }
  }

  return {
    rootId: root.id,
    rootLabel: root.label,
    descriptor: buildSharedWorkspaceDescriptor(root.id, normalizedRelativePath),
    relativePath: normalizedRelativePath,
    pattern,
    glob: globPattern,
    matches
  };
}

function searchSharedWorkspace(rootId, pattern, relativePath = "", glob = "") {
  const searchPattern = String(pattern || "").trim();
  if (!searchPattern) {
    throw new Error("Search pattern is required.");
  }

  const { root, absoluteTargetPath, relativePath: normalizedRelativePath } = resolveSharedWorkspacePath(rootId, relativePath);
  if (!fs.existsSync(absoluteTargetPath)) {
    throw new Error("Shared workspace search path does not exist on the server.");
  }

  const args = [
    "--json",
    "--line-number",
    "--max-count",
    String(MAX_SEARCH_RESULTS),
    "--glob",
    "!**/.svn/**",
    "--glob",
    "!**/bin/**",
    "--glob",
    "!**/obj/**"
  ];

  const globPattern = String(glob || "").trim();
  if (globPattern) {
    args.push("--glob", globPattern);
  }

  args.push(searchPattern, absoluteTargetPath);

  if (commandExists("rg")) {
    const result = spawnSync("rg", args, {
      encoding: "utf8",
      stdio: "pipe",
      windowsHide: true
    });

    if (!result.error && (result.status === 0 || result.status === 1)) {
      const matches = [];
      for (const line of String(result.stdout || "").split(/\r?\n/)) {
        if (!line.trim()) {
          continue;
        }

        try {
          const parsed = JSON.parse(line);
          if (parsed.type !== "match") {
            continue;
          }
          const absoluteMatchPath = parsed.data.path.text;
          const relativeMatchPath = normalizeRelativePath(path.relative(root.rootPath, absoluteMatchPath));
          matches.push({
            relativePath: relativeMatchPath,
            descriptor: buildSharedWorkspaceDescriptor(root.id, relativeMatchPath),
            lineNumber: parsed.data.line_number,
            preview: parsed.data.lines.text.trimEnd()
          });
        } catch (error) {
          // Ignore malformed rg lines.
        }
      }

      return {
        rootId: root.id,
        rootLabel: root.label,
        descriptor: buildSharedWorkspaceDescriptor(root.id, normalizedRelativePath),
        relativePath: normalizedRelativePath,
        pattern: searchPattern,
        glob: globPattern,
        matches
      };
    }
  }

  return searchSharedWorkspaceFallback(root, absoluteTargetPath, normalizedRelativePath, searchPattern, globPattern);
}

function escapeJsString(value) {
  return JSON.stringify(String(value));
}

function buildRemoteWorkspaceClientScript(metadata) {
  return `#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, "remote-workspace.json"), "utf8"));

function parseArgs(argv) {
  const result = {
    _: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }

    const key = value.slice(2);
    const nextValue = argv[index + 1];
    if (nextValue && !nextValue.startsWith("--")) {
      result[key] = nextValue;
      index += 1;
    } else {
      result[key] = "true";
    }
  }

  return result;
}

function normalizeRelativePath(value) {
  const rawValue = String(value || "").replace(/\\\\/g, "/").replace(/^\\/+/, "");
  if (!rawValue || rawValue === ".") {
    return "";
  }
  const parts = rawValue.split("/").filter(Boolean);
  const safeParts = [];
  for (const part of parts) {
    if (part === ".") {
      continue;
    }
    if (part === "..") {
      if (!safeParts.length) {
        throw new Error("Path escapes the shared workspace prefix.");
      }
      safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return safeParts.join("/");
}

function joinRelativePath(basePath, nextPath) {
  const normalizedBase = normalizeRelativePath(basePath);
  const normalizedNext = normalizeRelativePath(nextPath);
  return normalizeRelativePath([normalizedBase, normalizedNext].filter(Boolean).join("/"));
}

function buildUrl(pathname, params = {}) {
  const url = new URL(pathname, metadata.apiBaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson(pathname, params = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (metadata.accessToken) {
    headers["X-Shared-Workspace-Token"] = metadata.accessToken;
  }

  const response = await fetch(buildUrl(pathname, params), {
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || \`HTTP \${response.status}\`);
  }

  return response.json();
}

function printBrowse(payload) {
  const currentPath = payload.relativePath || ".";
  console.log(\`Root: \${payload.rootLabel} (\${payload.rootId})\`);
  console.log(\`Path: \${currentPath}\`);
  console.log("");
  if (!payload.entries.length) {
    console.log("No entries found.");
    return;
  }
  for (const entry of payload.entries) {
    console.log(\`\${entry.kind === "directory" ? "[dir]" : "[file]"} \${entry.relativePath || entry.name}\`);
  }
}

function printRead(payload) {
  console.log(\`File: \${payload.relativePath}\`);
  console.log(\`Lines: \${payload.startLine}-\${payload.endLine} of \${payload.totalLines}\`);
  console.log("");
  for (const line of payload.lines) {
    console.log(\`\${String(line.lineNumber).padStart(6, " ")}: \${line.text}\`);
  }
}

function printSearch(payload) {
  console.log(\`Pattern: \${payload.pattern}\`);
  console.log(\`Scope: \${payload.relativePath || "."}\`);
  console.log("");
  if (!payload.matches.length) {
    console.log("No matches found.");
    return;
  }
  for (const match of payload.matches) {
    console.log(\`\${match.relativePath}:\${match.lineNumber}: \${match.preview}\`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = String(args._[0] || "").trim().toLowerCase();

  switch (command) {
    case "info":
      console.log(JSON.stringify({
        ...metadata,
        accessToken: metadata.accessToken ? "[present]" : ""
      }, null, 2));
      return;
    case "browse": {
      const targetPath = joinRelativePath(metadata.relativePath, args.path || "");
      const payload = await fetchJson("/api/shared-workspaces/browse", {
        root: metadata.rootId,
        path: targetPath
      });
      printBrowse(payload);
      return;
    }
    case "read": {
      const targetPath = joinRelativePath(metadata.relativePath, args.path || "");
      if (!targetPath) {
        throw new Error("read requires --path relative to the shared workspace selection.");
      }
      const payload = await fetchJson("/api/shared-workspaces/read", {
        root: metadata.rootId,
        path: targetPath,
        start: args.start || "1",
        lines: args.lines || "80"
      });
      printRead(payload);
      return;
    }
    case "search": {
      const payload = await fetchJson("/api/shared-workspaces/search", {
        root: metadata.rootId,
        path: joinRelativePath(metadata.relativePath, args.path || ""),
        pattern: args.pattern || args._[1] || "",
        glob: args.glob || ""
      });
      printSearch(payload);
      return;
    }
    default:
      console.log("Commands:");
      console.log("  node shared-workspace-client.js info");
      console.log("  node shared-workspace-client.js browse [--path relative/folder]");
      console.log("  node shared-workspace-client.js read --path relative/file --start 120 --lines 60");
      console.log('  node shared-workspace-client.js search --pattern "PickUpCheck" [--path OPS] [--glob *.cs]');
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
`;
}

function createRemoteWorkspaceRunDirectory(sessionId, request) {
  const sharedWorkspace = request.sharedWorkspace;
  if (!sharedWorkspace) {
    throw new Error("Shared workspace metadata is required.");
  }

  const runDir = path.join(REMOTE_RUN_ROOT, String(sessionId || "remote-session"));
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(runDir, { recursive: true });

  const metadata = {
    apiBaseUrl: request.sharedWorkspaceApiBaseUrl,
    rootId: sharedWorkspace.rootId,
    rootLabel: sharedWorkspace.rootLabel || sharedWorkspace.root?.label || sharedWorkspace.rootId,
    relativePath: sharedWorkspace.relativePath,
    descriptor: request.workspace,
    product: request.product.family,
    accessToken: String(request.sharedWorkspaceAccessToken || "").trim()
  };

  fs.writeFileSync(path.join(runDir, "remote-workspace.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(runDir, "shared-workspace-client.js"), buildRemoteWorkspaceClientScript(metadata), "utf8");
  copyPackagedReferences(runDir);

  const guidance = [
    "# Remote Workspace",
    "",
    `Product: ${request.product.family}`,
    `Workspace: ${request.workspace}`,
    `API base URL: ${request.sharedWorkspaceApiBaseUrl}`,
    "",
    "Bundled local references for this shared RCA run are available under `./references`.",
    "Use `./references/BUGINTWFLOW.md` and `./references/.clinerules` as the primary local workflow guides.",
    "Use `./references/generate-memory-bank-FINAL.md` as the supporting memory-bank guide to focus searches and preserve high-signal evidence.",
    "The memory-bank guide supports `.clinerules`; it does not override BugDB facts, shared-workspace boundaries, or the required RCA output format.",
    "",
    "Use the local helper script to inspect the hosted workspace before concluding RCA:",
    "",
    "```text",
    "node shared-workspace-client.js browse",
    "node shared-workspace-client.js search --pattern \"YourSymbol\" --path OPS --glob *.cs",
    "node shared-workspace-client.js read --path OPS/Ops/OpsProcessor.cs --start 12760 --lines 80",
    "```",
    "",
    "Do not assume the actual product source tree exists in this local temp folder. The helper script is the source-of-truth path to the hosted VM workspace."
  ].join("\n");

  fs.writeFileSync(path.join(runDir, "AGENTS.md"), `${guidance}\n`, "utf8");
  fs.writeFileSync(path.join(runDir, "README.md"), `${guidance}\n`, "utf8");

  return {
    runDir,
    metadata
  };
}

module.exports = {
  SHARED_WORKSPACE_PREFIX,
  buildSharedWorkspaceDescriptor,
  createRemoteWorkspaceRunDirectory,
  getSharedWorkspaceAccessTokenFromRequest,
  getSharedWorkspaceList,
  getSharedWorkspaceRoot,
  issueSharedWorkspaceAccessToken,
  listSharedWorkspaceEntries,
  parseSharedWorkspaceDescriptor,
  readSharedWorkspaceFile,
  resolveSharedWorkspacePath,
  searchSharedWorkspace,
  verifySharedWorkspaceAccessToken
};
