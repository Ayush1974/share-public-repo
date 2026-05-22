const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const {
  APP_ROOT,
  CODEX_BIN,
  CODEX_FULL_ACCESS,
  CODEX_OUTPUT_DIR,
  CODEX_SKILLS_DIR,
  HOST,
  MIME_TYPES,
  PORT,
  PRODUCT_OPTIONS,
  PUBLIC_DIR,
  RCA_HEARTBEAT_INTERVAL_MS,
  RCA_MAX_SILENCE_MS,
  RCA_SILENCE_WARNING_MS,
  REQUIRE_ELEVATED_EXECUTION,
  SERVER_MODE,
  SERVE_AGENT_API,
  SERVE_UI,
  SKILL_NAME,
  SPA_ROUTES,
  MCP_CONFIG_FILE
} = require("./lib/config");
const {
  ensureRuntimeFiles,
  getConfiguredMcpServers,
  getDefaultPrompt,
  normalizeReportText,
  readFileIfPresent,
  sanitizePersistedOutputText,
  selectPreferredFinalMessage
} = require("./lib/file-utils");
const {
  ensureAuthConfigFile,
  getAuthState
} = require("./lib/auth-config");
const {
  applyCommonHeaders,
  parseRequestBody,
  safeSendSse,
  sendJson,
  sendText
} = require("./lib/http-utils");
const {
  extractDerivedIssueTitle,
  flattenText,
  parseNamedSections,
  parseRcaFields
} = require("./lib/parsing");
const {
  buildSessionDisplayName,
  buildSessionPrompt,
  normalizeRequest
} = require("./lib/prompts");
const {
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
} = require("./lib/session-store");
const {
  ensureRequiredElevationAtStartup,
  isProcessElevated
} = require("./lib/runtime");
const {
  createRemoteWorkspaceRunDirectory,
  getSharedWorkspaceAccessTokenFromRequest,
  getSharedWorkspaceList,
  issueSharedWorkspaceAccessToken,
  listSharedWorkspaceEntries,
  parseSharedWorkspaceDescriptor,
  readSharedWorkspaceFile,
  searchSharedWorkspace,
  verifySharedWorkspaceAccessToken
} = require("./lib/shared-workspace");
const {
  BROKER_INTERNAL_REQUEST_HEADER,
  getBrokerStatus,
  handleBrokerAgentChunk,
  handleBrokerAgentPoll,
  handleBrokerAgentRegister,
  handleBrokerAgentResult,
  handleBrokerConnectToken,
  isTrustedHostedUiRequest,
  proxyBrokerApiRequest,
  startBrokerClient
} = require("./lib/broker");
const {
  ensureAuthRuntimeFiles,
  handleClearStoredProfile,
  getCurrentUser,
  handleAuthMe,
  handleCallback,
  handleLogin,
  handleLocalLogin,
  handleLocalRegister,
  handleLogout,
  redirect,
  requireAuthenticatedUser
} = require("./lib/auth");

const ACTIVE_SESSION_IDS = new Set();
const RUNNING_SESSION_HANDLES = new Map();
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0"
};

function formatDurationLabel(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(Math.max(0, Number(milliseconds) || 0) / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function writeSsePrelude(res) {
  if (res.writableEnded || res.destroyed) {
    return;
  }

  // Force the browser to flush the streaming response instead of buffering tiny chunks.
  res.write(`:${" ".repeat(2048)}\n\n`);
}

ensureAuthConfigFile();

if (SERVE_UI && getAuthState().enabled) {
  ensureAuthRuntimeFiles();
}

if (SERVE_AGENT_API) {
  ensureRuntimeFiles();
  ensureRequiredElevationAtStartup();
}

function isLoopbackAddress(remoteAddress = "") {
  const normalized = String(remoteAddress || "").trim();
  return normalized === "127.0.0.1"
    || normalized === "::1"
    || normalized === "::ffff:127.0.0.1";
}

function isBrokerLocalRequest(req) {
  return String(req.headers[BROKER_INTERNAL_REQUEST_HEADER] || "").trim() === "1"
    && isLoopbackAddress(req.socket?.remoteAddress);
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

function isSharedWorkspaceApiPath(pathname) {
  return pathname === "/api/shared-workspaces"
    || pathname === "/api/shared-workspaces/token"
    || pathname === "/api/shared-workspaces/browse"
    || pathname === "/api/shared-workspaces/read"
    || pathname === "/api/shared-workspaces/search";
}

function resolveCodexLaunch(command, args) {
  if (process.platform !== "win32") {
    return {
      command,
      args,
      options: {
        shell: false
      }
    };
  }

  const normalized = String(command || "").trim().toLowerCase();
  if (normalized !== "codex.cmd" && !normalized.endsWith("\\codex.cmd")) {
    return {
      command,
      args,
      options: {
        shell: false
      }
    };
  }

  const directCommandPath = path.isAbsolute(command) && fs.existsSync(command) ? command : "";
  const lookup = directCommandPath
    ? { status: 0, stdout: `${directCommandPath}\n` }
    : spawnSync("where", [command], {
        encoding: "utf8",
        stdio: "pipe",
        windowsHide: true
      });
  const codexCmdPath = lookup.status === 0
    ? String(lookup.stdout || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean)
    : "";

  if (!codexCmdPath) {
    return {
      command,
      args,
      options: {
        shell: false
      }
    };
  }

  const codexJsPath = path.join(path.dirname(codexCmdPath), "node_modules", "@openai", "codex", "bin", "codex.js");
  if (!fs.existsSync(codexJsPath)) {
    return {
      command,
      args,
      options: {
        shell: false
      }
    };
  }

  return {
    command: process.execPath,
    args: [codexJsPath, ...args],
    options: {
      shell: false
    }
  };
}

function ensureIsolatedCodexHome() {
  const profileHome = path.join(APP_ROOT, "data", "codex-profile");
  const codexHome = path.join(profileHome, ".codex");
  const sourceCodexHome = path.join(os.homedir(), ".codex");

  fs.mkdirSync(codexHome, { recursive: true });

  ["auth.json", "config.toml", "installation_id", "version.json"].forEach((fileName) => {
    const sourcePath = path.join(sourceCodexHome, fileName);
    const targetPath = path.join(codexHome, fileName);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });

  return { profileHome, codexHome };
}

function buildCodexChildEnv() {
  const env = { ...process.env };
  const { profileHome, codexHome } = ensureIsolatedCodexHome();

  env.HOME = profileHome;
  env.USERPROFILE = profileHome;
  env.CODEX_HOME = codexHome;
  env.CODEX_SKILLS_DIR = CODEX_SKILLS_DIR;

  if (process.platform === "win32" && /^[A-Za-z]:/.test(profileHome)) {
    env.HOMEDRIVE = profileHome.slice(0, 2);
    env.HOMEPATH = profileHome.slice(2);
  }

  return env;
}

function runCommandForOutput(command, args, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 15000);
  const windowsHide = options.windowsHide !== undefined ? Boolean(options.windowsHide) : true;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error("Workspace picker timed out."));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      if (!stdout.trim() && !stderr.trim()) {
        resolve("");
        return;
      }

      reject(new Error(stderr.trim() || `Workspace picker exited with code ${code}.`));
    });
  });
}

function terminateChildProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    spawn("cmd.exe", ["/c", "taskkill", "/PID", String(child.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore"
    });
    return;
  }

  child.kill();
}

async function pickWorkspacePath(initialPath = "") {
  const safeInitialPath = String(initialPath || "").trim();

  if (process.platform === "win32") {
    const script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "$owner = New-Object System.Windows.Forms.Form",
      "$owner.ShowInTaskbar = $false",
      "$owner.StartPosition = 'CenterScreen'",
      "$owner.FormBorderStyle = 'FixedToolWindow'",
      "$owner.Size = New-Object System.Drawing.Size(1,1)",
      "$owner.Opacity = 0",
      "$owner.TopMost = $true",
      "$owner.Show()",
      "$owner.Activate()",
      "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
      '$dialog.Title = "Select the product source workspace"',
      '$dialog.Filter = "Folders|*.folder"',
      "$dialog.CheckFileExists = $false",
      "$dialog.CheckPathExists = $true",
      "$dialog.ValidateNames = $false",
      '$dialog.FileName = "Select Folder"',
      safeInitialPath && fs.existsSync(safeInitialPath) ? `$dialog.InitialDirectory = '${safeInitialPath.replace(/'/g, "''")}'` : "",
      "$result = $dialog.ShowDialog($owner)",
      "if ($result -eq [System.Windows.Forms.DialogResult]::OK) {",
      "  [Console]::Out.Write([System.IO.Path]::GetDirectoryName($dialog.FileName))",
      "}",
      "$dialog.Dispose()",
      "$owner.Close()",
      "$owner.Dispose()"
    ]
      .filter(Boolean)
      .join("; ");

    return runCommandForOutput("powershell.exe", ["-NoProfile", "-STA", "-Command", script], {
      timeoutMs: 120000,
      windowsHide: false
    });
  }

  if (process.platform === "darwin") {
    const args = [
      "-e",
      "try",
      "-e",
      safeInitialPath && fs.existsSync(safeInitialPath)
        ? `POSIX path of (choose folder with prompt "Select the product source workspace" default location POSIX file "${safeInitialPath.replace(/\\/g, "/").replace(/"/g, '\\"')}")`
        : 'POSIX path of (choose folder with prompt "Select the product source workspace")',
      "-e",
      "on error number -128",
      "-e",
      'return ""',
      "-e",
      "end try"
    ];

    return runCommandForOutput("osascript", args, {
      timeoutMs: 120000
    });
  }

  if (commandExists("zenity")) {
    return runCommandForOutput("zenity", [
      "--file-selection",
      "--directory",
      "--title=Select the product source workspace",
      ...(safeInitialPath && fs.existsSync(safeInitialPath) ? [safeInitialPath] : [])
    ], {
      timeoutMs: 120000
    });
  }

  if (commandExists("kdialog")) {
    return runCommandForOutput("kdialog", [
      "--getexistingdirectory",
      safeInitialPath && fs.existsSync(safeInitialPath) ? safeInitialPath : os.homedir(),
      "Select the product source workspace"
    ], {
      timeoutMs: 120000
    });
  }

  throw new Error("Folder browsing is not available on this OS without a supported picker.");
}

async function handleWorkspacePick(res, initialPath) {
  try {
    const selectedPath = await pickWorkspacePath(initialPath);
    sendJson(res, 200, {
      path: selectedPath,
      message: selectedPath ? "Workspace selected." : "No workspace selected."
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function handleSharedWorkspaceRoots(res) {
  sendJson(res, 200, {
    roots: getSharedWorkspaceList().map((root) => ({
      id: root.id,
      label: root.label,
      productKey: root.productKey || "",
      aliases: root.aliases || [],
      descriptor: `shared://${root.id}`
    }))
  });
}

function handleSharedWorkspaceToken(res, currentUser) {
  sendJson(res, 200, {
    token: issueSharedWorkspaceAccessToken(currentUser),
    expiresInMs: 8 * 60 * 60 * 1000
  });
}

function handleSharedWorkspaceBrowse(res, url) {
  try {
    const payload = listSharedWorkspaceEntries(
      url.searchParams.get("root") || "",
      url.searchParams.get("path") || ""
    );
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function authorizeSharedWorkspaceRequest(req, res, currentUser) {
  if (currentUser) {
    return true;
  }

  const token = getSharedWorkspaceAccessTokenFromRequest(req);
  if (token && verifySharedWorkspaceAccessToken(token)) {
    return true;
  }

  sendJson(res, 401, { error: "Authentication required for hosted shared workspace access." });
  return false;
}

function handleSharedWorkspaceRead(res, url) {
  try {
    const payload = readSharedWorkspaceFile(
      url.searchParams.get("root") || "",
      url.searchParams.get("path") || "",
      Number(url.searchParams.get("start") || "1"),
      Number(url.searchParams.get("lines") || "80")
    );
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function handleSharedWorkspaceSearch(res, url) {
  try {
    const payload = searchSharedWorkspace(
      url.searchParams.get("root") || "",
      url.searchParams.get("pattern") || "",
      url.searchParams.get("path") || "",
      url.searchParams.get("glob") || ""
    );
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function serveStatic(res, pathname) {
  if (pathname === "/favicon.ico") {
    const faviconPath = path.join(PUBLIC_DIR, "assets", "oracle-logo.png");
    fs.readFile(faviconPath, (error, data) => {
      if (error) {
        sendJson(res, 404, { error: "Not found" });
        return;
      }

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600"
      });
      res.end(data);
    });
    return;
  }

  const reqPath = pathname === "/"
    ? "/index.html"
    : pathname === "/login" || pathname === "/welcome"
      ? "/login.html"
      : pathname;
  const normalizedPath = path.normalize(reqPath).replace(/^([/\\])+/, "");
  const filePath = path.resolve(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(path.resolve(PUBLIC_DIR))) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      ...NO_CACHE_HEADERS
    });
    res.end(data);
  });
}

function serveSpaShell(res) {
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  fs.readFile(indexPath, (error, data) => {
    if (error) {
      sendJson(res, 500, { error: "Unable to load application shell" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[".html"],
      ...NO_CACHE_HEADERS
    });
    res.end(data);
  });
}

function validateRunRequest(request) {
  if (!request.workspace) {
    return "Workspace is required for the selected product.";
  }

  if (String(request.workspace).trim().toLowerCase().startsWith("shared://")) {
    request.workspaceMode = "shared-api";
  }

  if (request.workspaceMode === "shared-api") {
    if (!request.sharedWorkspaceApiBaseUrl) {
      return "Shared workspace runs require the hosted workspace API base URL.";
    }
    try {
      request.sharedWorkspace = parseSharedWorkspaceDescriptor(request.workspace);
      request.workspace = request.sharedWorkspace.descriptor;
      request.sharedWorkspace.rootLabel = request.sharedWorkspace.rootId === "simphony"
        ? "Simphony Shared Workspace"
        : request.sharedWorkspace.rootId;
    } catch (error) {
      return error.message;
    }
    if (request.mode === "fix") {
      return "Fix mode is not allowed for shared API workspaces. Use a writable local checkout for code changes.";
    }
  } else {
    if (!fs.existsSync(request.workspace)) {
      return "Workspace path does not exist on this machine.";
    }

    try {
      if (!fs.statSync(request.workspace).isDirectory()) {
        return "Workspace must point to a folder.";
      }
    } catch (error) {
      return "Workspace path could not be verified.";
    }
  }

  if (request.ticketSource === "description") {
    if (!String(request.bugDescription || "").trim()) {
      return "Bug Description is required.";
    }
  } else if (!request.ticketId) {
    return "Jira Ticket ID / BugDB ID is required.";
  }

  if (!request.extraInstructions) {
    return "RCA Guidance is required and cannot be empty.";
  }

  return "";
}

function handleRun(req, res) {
  parseRequestBody(req, (parseError, payload) => {
    if (parseError) {
      sendJson(res, parseError.message === "Request body too large" ? 413 : 400, { error: parseError.message || "Invalid JSON body" });
      return;
    }

    const request = normalizeRequest(payload);
    const previousSession = request.previousSessionId ? loadSession(request.previousSessionId, ACTIVE_SESSION_IDS) : null;
    const displayName = buildSessionDisplayName(request);
    const elevated = isProcessElevated();

    if (REQUIRE_ELEVATED_EXECUTION && !elevated) {
      sendJson(res, 409, {
        error:
          process.platform === "win32"
            ? "Local Codex runs are configured for administrator mode. Restart this app with start-agent.cmd or another elevated launcher, then run again."
            : "Local Codex runs are configured for elevated mode. Restart this app with sudo using start-agent.sh or another elevated launcher, then run again."
      });
      return;
    }

    const validationError = validateRunRequest(request);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    if (request.mode === "fix" && !previousSession) {
      sendJson(res, 400, { error: "Fix mode requires a previous RCA session." });
      return;
    }

    if (
      request.mode === "fix"
      && previousSession
      && ["evidence-first", "product-generic"].includes(previousSession?.request?.guidanceMode || "")
    ) {
      sendJson(res, 400, {
        error: "Fix mode is blocked for Evidence-first and Product-generic RCA sessions. Start a dedicated Fix from RCA run after a fix-eligible RCA."
      });
      return;
    }

    if (request.continueSession && !previousSession) {
      sendJson(res, 400, { error: "Continue mode requires a previous saved session." });
      return;
    }

    const prompt = buildSessionPrompt(request, previousSession);
    const sessionId = createSessionId(request);
    const startedAt = new Date().toISOString();
    const tempFile = path.join(CODEX_OUTPUT_DIR, `codex-last-message-${sessionId}.txt`);
    let executionWorkspace = request.workspace;

    if (request.workspaceMode === "shared-api") {
      const preparedWorkspace = createRemoteWorkspaceRunDirectory(sessionId, request);
      executionWorkspace = preparedWorkspace.runDir;
    }

    const args = [
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--ephemeral",
      "--color",
      "never",
      "-C",
      executionWorkspace,
      "--add-dir",
      CODEX_SKILLS_DIR,
      "-o",
      tempFile
    ];

    for (const server of getConfiguredMcpServers()) {
      args.push("-c", `mcp_servers.${server.name}.url=${JSON.stringify(server.url)}`);
    }

    if (CODEX_FULL_ACCESS) {
      args.splice(4, 0, "--dangerously-bypass-approvals-and-sandbox");
    }

    if (request.model) {
      args.push("-m", request.model);
    }

    let session = saveSession({
      id: sessionId,
      status: "running",
      startedAt,
      completedAt: "",
      durationMs: 0,
      request: {
        product: request.product.key,
        productLabel: request.product.family,
        mode: request.mode,
        ticketSource: request.ticketSource,
        ticketId: request.ticketId,
        issueTitle: request.issueTitle,
        bugDescription: request.bugDescription,
        derivedIssueTitle: "",
        workspace: request.workspace,
        workspaceMode: request.workspaceMode,
        sharedWorkspaceApiBaseUrl: request.sharedWorkspaceApiBaseUrl,
        version: request.version,
        displayName,
        model: request.model,
        extraInstructions: request.extraInstructions,
        guidanceMode: request.guidanceMode,
        previousSessionId: request.previousSessionId,
        continueSession: request.continueSession,
        jiraEvidence: request.jiraEvidence,
        prompt
      },
      command: {
        bin: CODEX_BIN,
        args
      },
      output: {
        liveText: "",
        finalMessage: "",
        stderr: ""
      },
      parsed: {
        sections: {},
        rcaFields: {}
      }
    });
    ACTIVE_SESSION_IDS.add(sessionId);

    writeArtifacts({
      productLabel: request.product.family,
      mode: request.mode,
      ticketId: request.ticketId,
      workspace: request.workspace,
      version: request.version,
      prompt,
      liveText: "",
      finalMessage: "",
      errorText: ""
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    if (res.socket && typeof res.socket.setNoDelay === "function") {
      res.socket.setNoDelay(true);
    }
    writeSsePrelude(res);

    let stdoutBuffer = "";
    let stderrBuffer = "";
    let liveText = "";
    let clientClosed = false;
    let stopRequested = false;
    let child = null;
    let finalized = false;
    let lastActivityAt = Date.now();
    let silenceWarningSentAt = 0;
    let maxSilenceReached = false;
    let maxSilenceMessage = "";

    function markActivity() {
      lastActivityAt = Date.now();
      silenceWarningSentAt = 0;
    }

    function clearHeartbeatTimer() {
      finalized = true;
      clearInterval(heartbeatTimer);
    }

    safeSendSse(res, "status", {
      sessionId,
      displayName,
      product: request.product.key,
      mode: request.mode,
      continueSession: request.continueSession,
      guidanceMode: request.guidanceMode,
      command: CODEX_BIN,
      args,
      workspace: request.workspace
    });

    const codexSpawn = resolveCodexLaunch(CODEX_BIN, args);
    child = spawn(codexSpawn.command, codexSpawn.args, {
      cwd: APP_ROOT,
      env: buildCodexChildEnv(),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      ...codexSpawn.options
    });
    session = saveSession({
      ...session,
      process: {
        ...(session.process || {}),
        pid: child.pid || 0
      }
    });
    RUNNING_SESSION_HANDLES.set(sessionId, {
      stop() {
        stopRequested = true;
        terminateChildProcess(child);
      }
    });

    const heartbeatTimer = setInterval(() => {
      if (finalized) {
        return;
      }

      const now = Date.now();
      const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
      const silenceMs = Math.max(0, now - lastActivityAt);
      const progress = {
        lastHeartbeatAt: new Date(now).toISOString(),
        elapsedMs,
        silenceMs,
        hasVisibleOutput: Boolean(liveText.trim() || stderrBuffer.trim())
      };
      session = saveSession({
        ...session,
        progress
      });

      safeSendSse(res, "heartbeat", {
        sessionId,
        elapsedMs,
        silenceMs,
        padding: " ".repeat(2048)
      });

      if (silenceMs >= RCA_SILENCE_WARNING_MS && now - silenceWarningSentAt >= RCA_SILENCE_WARNING_MS) {
        silenceWarningSentAt = now;
        session = saveSession({
          ...session,
          progress: {
            ...(session.progress || progress),
            lastWarningAt: new Date(now).toISOString(),
            elapsedMs,
            silenceMs,
            hasVisibleOutput: Boolean(liveText.trim() || stderrBuffer.trim())
          }
        });
        safeSendSse(res, "warning", {
          sessionId,
          label: "Runner waiting",
          headline: "The RCA run is still active but Codex has not produced output yet.",
          message: `No stdout or stderr has arrived for ${formatDurationLabel(silenceMs)}.`,
          detail: "This usually means Codex is still starting tools or is blocked on an external dependency. If this continues for several minutes, stop the run and retry."
        });
      }

      if (!maxSilenceReached && silenceMs >= RCA_MAX_SILENCE_MS) {
        maxSilenceReached = true;
        maxSilenceMessage = `The RCA run was stopped after ${formatDurationLabel(silenceMs)} without any visible output from Codex.`;
        stderrBuffer = [stderrBuffer.trim(), maxSilenceMessage].filter(Boolean).join("\n");
        session = saveSession({
          ...session,
          progress: {
            ...(session.progress || progress),
            lastWarningAt: new Date(now).toISOString(),
            elapsedMs,
            silenceMs,
            hasVisibleOutput: Boolean(liveText.trim() || stderrBuffer.trim()),
            maxSilenceReached: true
          }
        });
        safeSendSse(res, "warning", {
          sessionId,
          label: "Runner timeout",
          headline: "The RCA run was stopped because Codex stayed silent for too long.",
          message: maxSilenceMessage,
          detail: "Check Codex tool startup, MCP connectivity, or workspace access, then rerun the RCA."
        });
        terminateChildProcess(child);
      }
    }, RCA_HEARTBEAT_INTERVAL_MS);
    if (typeof heartbeatTimer.unref === "function") {
      heartbeatTimer.unref();
    }

    if (child.stdin) {
      child.stdin.end(prompt);
    }

    function stopChildFromDisconnect() {
      clientClosed = true;
      terminateChildProcess(child);
    }

    req.on("aborted", stopChildFromDisconnect);
    res.on("close", () => {
      if (!res.writableEnded) {
        stopChildFromDisconnect();
      }
    });

    child.stdout.on("data", (chunk) => {
      markActivity();
      stdoutBuffer += chunk.toString("utf8");

      let newlineIndex;
      while ((newlineIndex = stdoutBuffer.indexOf("\n")) !== -1) {
        const rawLine = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

        if (!rawLine) {
          continue;
        }

        let parsed = null;
        let extractedText = "";

        try {
          parsed = JSON.parse(rawLine);
          extractedText = flattenText(parsed).trim();
        } catch (error) {
          extractedText = rawLine;
        }

        if (extractedText) {
          liveText += `${extractedText}\n`;
        }

        safeSendSse(res, "codex_event", {
          sessionId,
          raw: rawLine,
          parsed,
          text: extractedText
        });
      }
    });

    child.stderr.on("data", (chunk) => {
      markActivity();
      const text = chunk.toString("utf8");
      stderrBuffer += text;
      safeSendSse(res, "stderr", { sessionId, text });
    });

    child.on("error", (error) => {
      clearHeartbeatTimer();
      ACTIVE_SESSION_IDS.delete(sessionId);
      RUNNING_SESSION_HANDLES.delete(sessionId);
      session = saveSession({
        ...session,
        status: "failed",
        completedAt: new Date().toISOString(),
        output: {
          ...session.output,
          liveText: liveText.trim(),
          stderr: stderrBuffer.trim()
        },
        error: error.message
      });

      writeArtifacts({
        productLabel: request.product.family,
        mode: request.mode,
        ticketId: request.ticketId,
        workspace: request.workspace,
        version: request.version,
        prompt,
        liveText: liveText.trim(),
        finalMessage: "",
        errorText: `${stderrBuffer.trim()}\n${error.message}`.trim()
      });

      safeSendSse(res, "error", { sessionId, message: error.message });
      if (!res.writableEnded) {
        res.end();
      }
    });

    child.on("close", (code, signal) => {
      clearHeartbeatTimer();
      ACTIVE_SESSION_IDS.delete(sessionId);
      RUNNING_SESSION_HANDLES.delete(sessionId);

      if (stdoutBuffer.trim()) {
        safeSendSse(res, "codex_event", {
          sessionId,
          raw: stdoutBuffer.trim(),
          parsed: null,
          text: stdoutBuffer.trim()
        });
        liveText += `${stdoutBuffer.trim()}\n`;
      }

      const normalizedLiveText = sanitizePersistedOutputText(liveText.trim());
      const normalizedStderr = normalizeReportText(stderrBuffer.trim());
      const finalMessage = selectPreferredFinalMessage({
        finalMessage: readFileIfPresent(tempFile).trim(),
        liveText: normalizedLiveText,
        stderrText: normalizedStderr,
        maxSilenceMessage,
        code
      });
      const sections = parseNamedSections(finalMessage);
      const rcaFields = parseRcaFields(sections.RCA);
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      const status = clientClosed || stopRequested ? "cancelled" : maxSilenceReached ? "failed" : code === 0 ? "completed" : "failed";
      const derivedIssueTitle = extractDerivedIssueTitle(sections, rcaFields, finalMessage, request.ticketId);
      const nextDisplayName = buildSessionDisplayName({
        ...request,
        issueTitle: request.issueTitle,
        derivedIssueTitle
      });

      session = saveSession({
        ...session,
        status,
        completedAt,
        durationMs,
        output: {
          liveText: normalizedLiveText,
          finalMessage,
          stderr: normalizedStderr
        },
        parsed: {
          sections,
          rcaFields
        },
        request: {
          ...session.request,
          derivedIssueTitle,
          displayName: nextDisplayName
        },
        process: {
          code,
          signal
        }
      });

      writeArtifacts({
        productLabel: request.product.family,
        mode: request.mode,
        ticketId: request.ticketId,
        workspace: request.workspace,
        version: request.version,
        prompt,
        liveText: normalizedLiveText,
        finalMessage,
        errorText: normalizedStderr
      });

      safeSendSse(res, "final", {
        sessionId,
        code,
        signal,
        message: finalMessage,
        sections,
        rcaFields,
        artifacts: currentArtifacts(),
        session: {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          durationMs: session.durationMs,
          request: session.request,
          summary: session.summary
        }
      });

      safeSendSse(res, "done", {
        sessionId,
        code,
        signal,
        hasFinalMessage: Boolean(finalMessage),
        status
      });

      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        // Temp cleanup is best-effort only.
      }

      if (!res.writableEnded) {
        res.end();
      }
    });
  });
}

function handleSessionsList(res) {
  const sessions = listSessions(ACTIVE_SESSION_IDS).map((session) => ({
    id: session.id,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationMs: session.durationMs,
    request: {
      product: session?.request?.product || "",
      productLabel: session?.request?.productLabel || "",
      mode: session?.request?.mode || "",
      ticketId: session?.request?.ticketId || "",
      issueTitle: session?.request?.issueTitle || "",
      derivedIssueTitle: session?.request?.derivedIssueTitle || "",
      workspace: session?.request?.workspace || "",
      version: session?.request?.version || "",
      displayName: session?.request?.displayName || "",
      model: session?.request?.model || "",
      guidanceMode: session?.request?.guidanceMode || "",
      continueSession: Boolean(session?.request?.continueSession)
    },
    summary: session.summary || summarizeSession(session)
  }));

  sendJson(res, 200, { sessions });
}

function handleSessionGet(res, sessionId) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS);
  if (!session) {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }

  sendJson(res, 200, session);
}

function handleSessionDelete(res, sessionId) {
  const result = deleteSession(sessionId, ACTIVE_SESSION_IDS);
  if (result.reason === "not_found") {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }

  if (result.reason === "running") {
    sendJson(res, 409, { error: "Currently running sessions cannot be deleted." });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    deletedSessionId: sessionId
  });
}

function handleSessionStop(res, sessionId) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS);
  if (!session) {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }

  if (session.status !== "running") {
    sendJson(res, 409, { error: "This session is not running." });
    return;
  }

  const completedAt = session.completedAt || new Date().toISOString();
  const durationMs = session.durationMs > 0
    ? session.durationMs
    : Math.max(0, new Date(completedAt).getTime() - new Date(session.startedAt || completedAt).getTime());
  saveSession({
    ...session,
    status: "cancelled",
    completedAt,
    durationMs
  });

  const runningHandle = RUNNING_SESSION_HANDLES.get(sessionId);
  if (!runningHandle) {
    sendJson(res, 202, {
      ok: true,
      sessionId,
      message: "Stop requested. Session marked as cancelled."
    });
    return;
  }

  runningHandle.stop();
  sendJson(res, 202, {
    ok: true,
    sessionId,
    message: "Stop requested."
  });
}

function handleSessionsDeleteAll(res) {
  const result = deleteAllSessions(ACTIVE_SESSION_IDS);
  sendJson(res, 200, {
    ok: true,
    deletedCount: result.deletedCount,
    deletedSessionIds: result.deletedSessionIds,
    skippedCount: result.skippedCount,
    skippedSessionIds: result.skippedSessionIds,
    message: result.skippedCount
      ? `Deleted ${result.deletedCount} session(s). Skipped ${result.skippedCount} running session(s).`
      : `Deleted ${result.deletedCount} session(s).`
  });
}

function handleSessionReport(res, sessionId, format) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS);
  if (!session) {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }

  if (format === "json") {
    sendText(res, 200, "application/json; charset=utf-8", JSON.stringify(session, null, 2), `${sessionId}.json`);
    return;
  }

  if (format === "md") {
    sendText(res, 200, "text/markdown; charset=utf-8", formatMarkdownReport(session), `${sessionId}.md`);
    return;
  }

  sendText(res, 200, "text/plain; charset=utf-8", session?.output?.finalMessage || "", `${sessionId}.txt`);
}

async function handleRequest(req, res) {
  applyCommonHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url) {
    sendJson(res, 400, { error: "Missing URL" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;
  const authState = SERVE_UI ? getAuthState() : { enabled: false, configured: true };
  const currentUser = SERVE_UI ? getCurrentUser(req) : null;
  const brokerConnectToken = url.searchParams.get("brokerConnectToken") || "";

  if (SERVE_UI && brokerConnectToken && req.method === "GET" && SPA_ROUTES.has(pathname)) {
    const nextUrl = `${pathname}${url.search}`.replace(/([?&])brokerConnectToken=[^&]+(&)?/g, (match, first, second) => (first === "?" && second ? "?" : ""));
    handleBrokerConnectToken(req, res, currentUser, brokerConnectToken, nextUrl.replace(/\?&/, "?").replace(/[?&]$/, ""));
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/") {
    redirect(res, currentUser ? "/home" : "/login");
    return;
  }

  if (SERVE_UI && req.method === "GET" && (pathname === "/login" || pathname === "/welcome")) {
    if (currentUser) {
      redirect(res, "/home");
      return;
    }

    serveStatic(res, "/login.html");
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/register") {
    if (currentUser) {
      redirect(res, "/home");
      return;
    }

    serveStatic(res, "/register.html");
    return;
  }

  if (SERVE_UI && req.method === "GET" && (pathname === "/login.js" || pathname === "/register.js")) {
    serveStatic(res, pathname);
    return;
  }

  if (SERVE_UI && pathname === "/auth/login" && req.method === "GET") {
    await handleLogin(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/callback" && req.method === "GET") {
    await handleCallback(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/logout" && req.method === "GET") {
    handleLogout(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/me" && req.method === "GET") {
    handleAuthMe(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/me" && req.method === "DELETE") {
    handleClearStoredProfile(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/login/local" && req.method === "POST") {
    handleLocalLogin(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/auth/register/local" && req.method === "POST") {
    handleLocalRegister(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/agents/register" && req.method === "POST") {
    await handleBrokerAgentRegister(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/agents/poll" && req.method === "POST") {
    await handleBrokerAgentPoll(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/agents/result" && req.method === "POST") {
    await handleBrokerAgentResult(req, res);
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/agents/chunk" && req.method === "POST") {
    await handleBrokerAgentChunk(req, res);
    return;
  }

  const requiresUiLogin = SERVE_UI && SPA_ROUTES.has(pathname) && pathname !== "/" && !currentUser;
  if (requiresUiLogin) {
    redirect(res, "/login");
    return;
  }

  if (SERVE_UI && pathname === "/index.html" && !currentUser) {
    redirect(res, "/login");
    return;
  }

  if (SERVE_UI && !SERVE_AGENT_API && pathname === "/api/broker/status" && req.method === "GET") {
    if (!requireAuthenticatedUser(req, res)) {
      return;
    }
    sendJson(res, 200, getBrokerStatus(currentUser));
    return;
  }

  const sharedWorkspaceApiRequest = isSharedWorkspaceApiPath(pathname);

  if (SERVE_UI && !SERVE_AGENT_API && pathname === "/api/shared-workspaces/token" && req.method === "POST") {
    if (!requireAuthenticatedUser(req, res)) {
      return;
    }
  }

  if (SERVE_UI && !SERVE_AGENT_API && sharedWorkspaceApiRequest && pathname !== "/api/shared-workspaces/token") {
    if (!authorizeSharedWorkspaceRequest(req, res, currentUser)) {
      return;
    }
  }

  if (SERVE_UI && !SERVE_AGENT_API && pathname.startsWith("/api/") && !sharedWorkspaceApiRequest) {
    if (!requireAuthenticatedUser(req, res)) {
      return;
    }
    await proxyBrokerApiRequest(req, res, url, currentUser);
    return;
  }

  const trustedHostedUiRequest = isTrustedHostedUiRequest(req);
  const requiresCombinedApiAuth =
    SERVE_UI
    && SERVE_AGENT_API
    && pathname.startsWith("/api/")
    && !sharedWorkspaceApiRequest
    && pathname !== "/api/health"
    && !isBrokerLocalRequest(req)
    && !trustedHostedUiRequest;
  if (requiresCombinedApiAuth && !requireAuthenticatedUser(req, res)) {
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/config") {
    const elevated = isProcessElevated();
    sendJson(res, 200, {
      host: HOST,
      port: PORT,
      platform: process.platform,
      serverMode: SERVER_MODE,
      model: process.env.CODEX_MODEL || "",
      localOnly: true,
      codexFullAccess: CODEX_FULL_ACCESS,
      requireElevatedExecution: REQUIRE_ELEVATED_EXECUTION,
      elevated,
      skillName: SKILL_NAME,
      defaultPrompt: getDefaultPrompt(),
      mcpConfigFile: MCP_CONFIG_FILE,
      mcpServers: getConfiguredMcpServers(),
      products: Object.values(PRODUCT_OPTIONS).map((product) => ({
        key: product.key,
        label: product.label,
        family: product.family,
        defaultWorkspace: product.defaultWorkspace
      })),
      artifacts: Object.keys(currentArtifacts())
    });
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/health") {
    const elevated = isProcessElevated();
    sendJson(res, 200, {
      ok: true,
      host: HOST,
      port: PORT,
      platform: process.platform,
      serverMode: SERVER_MODE,
      localOnly: true,
      codexFullAccess: CODEX_FULL_ACCESS,
      requireElevatedExecution: REQUIRE_ELEVATED_EXECUTION,
      elevated,
      artifacts: Object.keys(currentArtifacts())
    });
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/artifacts") {
    sendJson(res, 200, currentArtifacts());
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/api/shared-workspaces") {
    if (!authorizeSharedWorkspaceRequest(req, res, currentUser)) {
      return;
    }
    handleSharedWorkspaceRoots(res);
    return;
  }

  if (SERVE_UI && req.method === "POST" && pathname === "/api/shared-workspaces/token") {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    handleSharedWorkspaceToken(res, authenticatedUser);
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/api/shared-workspaces/browse") {
    if (!authorizeSharedWorkspaceRequest(req, res, currentUser)) {
      return;
    }
    handleSharedWorkspaceBrowse(res, url);
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/api/shared-workspaces/read") {
    if (!authorizeSharedWorkspaceRequest(req, res, currentUser)) {
      return;
    }
    handleSharedWorkspaceRead(res, url);
    return;
  }

  if (SERVE_UI && req.method === "GET" && pathname === "/api/shared-workspaces/search") {
    if (!authorizeSharedWorkspaceRequest(req, res, currentUser)) {
      return;
    }
    handleSharedWorkspaceSearch(res, url);
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/pick-workspace") {
    handleWorkspacePick(res, url.searchParams.get("current") || "");
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/sessions") {
    handleSessionsList(res);
    return;
  }

  if (SERVE_AGENT_API && req.method === "DELETE" && pathname === "/api/sessions") {
    handleSessionsDeleteAll(res);
    return;
  }

  const reportMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/report$/);
  if (SERVE_AGENT_API && req.method === "GET" && reportMatch) {
    handleSessionReport(res, decodeURIComponent(reportMatch[1]), url.searchParams.get("format") || "txt");
    return;
  }

  const sessionStopMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/stop$/);
  if (SERVE_AGENT_API && req.method === "POST" && sessionStopMatch) {
    handleSessionStop(res, decodeURIComponent(sessionStopMatch[1]));
    return;
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (SERVE_AGENT_API && req.method === "GET" && sessionMatch) {
    handleSessionGet(res, decodeURIComponent(sessionMatch[1]));
    return;
  }

  if (SERVE_AGENT_API && req.method === "DELETE" && sessionMatch) {
    handleSessionDelete(res, decodeURIComponent(sessionMatch[1]));
    return;
  }

  if (SERVE_AGENT_API && req.method === "POST" && pathname === "/api/run") {
    handleRun(req, res);
    return;
  }

  if (SERVE_UI && req.method === "GET") {
    if (SPA_ROUTES.has(pathname)) {
      serveSpaShell(res);
      return;
    }

    serveStatic(res, pathname);
    return;
  }

  if (pathname.startsWith("/api/") && !SERVE_AGENT_API) {
    sendJson(res, 404, { error: "This host is running in UI-only mode. Start the local agent on the user machine." });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

function requestListener(req, res) {
  handleRequest(req, res).catch((error) => {
    console.error(`Request handling failed: ${error.message}`);
    if (!res.writableEnded) {
      sendJson(res, 500, { error: error.message || "Internal server error" });
    }
  });
}

const server = http.createServer(requestListener);

server.on("error", (error) => {
  console.warn(`Primary listener on port ${PORT} could not start: ${error.message}`);
});

server.listen(PORT, HOST, () => {
  const modeLabel = SERVER_MODE === "agent" ? "agent API" : SERVER_MODE === "ui" ? "UI host" : "combined UI + agent";
  console.log(`Oracle Restaurants Bug RCA Console ${modeLabel} listening on http://${HOST}:${PORT}${SERVE_UI ? "/home" : ""}`);
  if (SERVER_MODE !== "ui" && isLoopbackAddress(HOST)) {
    startBrokerClient();
  }
});
