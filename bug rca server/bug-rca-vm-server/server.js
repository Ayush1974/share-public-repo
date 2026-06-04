const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const { loadEnvFile } = require("./lib/env-file");

loadEnvFile({ baseDir: __dirname });

const {
  APP_ROOT,
  CODEX_BIN,
  CODEX_FULL_ACCESS,
  CODEX_OUTPUT_DIR,
  CODEX_RUNTIME_HOME_DIR,
  CODEX_SKILLS_DIR,
  HOST,
  MIME_TYPES,
  PORT,
  PRODUCT_OPTIONS,
  PUBLIC_DIR,
  RCA_HEARTBEAT_INTERVAL_MS,
  RCA_MAX_SILENCE_MS,
  RCA_STARTUP_SILENCE_MS,
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
  buildRejectedRcaMessage,
  evaluateRcaOutput
} = require("./lib/rca-output");
const {
  buildSessionDisplayName,
  buildSessionPrompt,
  normalizeRequest
} = require("./lib/prompts");
const {
  fetchDirectJiraIssueEvidence
} = require("./lib/core/jira-api");
// BugDB REST API client — fetches bug details directly from Oracle BugDB
const {
  fetchDirectBugDbEvidence,
  resolveBugDbConfig
} = require("./lib/core/bugdb-api");
const {
  addGenericJiraMcpAliases,
  resolveTicketScopedMcpServers
} = require("./lib/core/ticket-routing");
const {
  buildSessionOwner,
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
const CLI_FLAGS = new Set(process.argv.slice(2).map((value) => String(value || "").trim().toLowerCase()));
const DEFAULT_WINDOWS_TASK_NAMES = ["SimphonyBugRcaUiHost", "SimphonyBugRcaAgent"];

function formatDurationLabel(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(Math.max(0, Number(milliseconds) || 0) / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function formatCodexProcessFailure(code, signal, stderrText = "") {
  const normalizedStderr = normalizeReportText(stderrText);
  if (process.platform === "win32" && Number(code) === 3221225785) {
    return normalizeReportText([
      `Codex exited with code ${code} (0xC0000139).`,
      `This is a Windows "entry point not found" crash on host build ${os.release()}.`,
      "This usually means the native Codex Windows binary is incompatible with this VM OS build or a required Windows runtime entry point is missing.",
      "Hosted shared://simphony execution cannot complete on this VM until the VM OS/runtime is upgraded or the hosted runner is moved to a compatible Windows machine.",
      "Use the local client agent for execution as the fallback on this VM if you cannot change the hosted server environment.",
      normalizedStderr
    ].filter(Boolean).join("\n"));
  }

  return normalizeReportText([
    `Codex exited with code ${code}${signal ? ` and signal ${signal}` : ""}.`,
    normalizedStderr
  ].filter(Boolean).join("\n"));
}

function getHostedCodexCompatibilityIssue(request) {
  if (!request || request.workspaceMode !== "shared-api" || process.platform !== "win32") {
    return "";
  }

  const windowsRelease = String(os.release() || "").trim();
  if (windowsRelease.startsWith("10.0.14393")) {
    return [
      `Hosted shared://simphony execution is blocked on this VM because Codex is incompatible with Windows build ${windowsRelease}.`,
      "This VM hits the native Codex Windows crash 0xC0000139 (entry point not found) before RCA can start.",
      "Use a newer compatible Windows VM for hosted execution, or switch this workflow to the local client agent."
    ].join(" ");
  }

  return "";
}

function looksLikeJwtToken(value) {
  const normalized = String(value || "").trim();
  return /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalized);
}

function firstNonEmptyEntry(entries = []) {
  for (const entry of entries) {
    const [name, rawValue] = Array.isArray(entry) ? entry : ["", entry];
    const value = String(rawValue || "").trim();
    if (value) {
      return { name, value };
    }
  }

  return { name: "", value: "" };
}

function normalizeProviderId(value, fallback = "openai") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function isLikelyOpenAiBaseUrl(baseUrl) {
  const normalized = String(baseUrl || "").trim();
  if (!normalized) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    const hostname = String(parsed.hostname || "").trim().toLowerCase();
    return hostname === "api.openai.com" || hostname.endsWith(".openai.com");
  } catch (error) {
    return false;
  }
}

function parseProviderObjectEnv(rawValue, envLabel) {
  const normalized = String(rawValue || "").trim();
  if (!normalized) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(normalized);
  } catch (error) {
    throw new Error(`${envLabel} must be a JSON object when set.`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${envLabel} must be a JSON object when set.`);
  }

  return parsed;
}

function formatTomlString(value) {
  return JSON.stringify(String(value || ""));
}

function formatTomlValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return formatTomlString(value);
}

function formatTomlArray(values) {
  const normalizedValues = Array.isArray(values) ? values : [];
  return `[${normalizedValues.map((value) => formatTomlValue(value)).join(", ")}]`;
}

function formatTomlInlineTable(table) {
  const entries = Object.entries(table || {})
    .filter(([key, value]) => String(key || "").trim() && value !== undefined && value !== null)
    .map(([key, value]) => `${key} = ${formatTomlValue(value)}`);
  return `{ ${entries.join(", ")} }`;
}

function resolveCodexProviderSettings() {
  const providerHint = String(process.env.CODEX_MODEL_PROVIDER || "").trim();
  const providerNameHint = String(process.env.CODEX_PROVIDER_NAME || "").trim();
  const providerIdHint = String(process.env.CODEX_PROVIDER_ID || "").trim();
  const explicitBaseUrl = firstNonEmptyEntry([
    ["CODEX_BASE_URL", process.env.CODEX_BASE_URL],
    ["ORACLE_CODE_ASSIST_BASE_URL", process.env.ORACLE_CODE_ASSIST_BASE_URL],
    ["OCA_BASE_URL", process.env.OCA_BASE_URL],
    ["OPENAI_BASE_URL", process.env.OPENAI_BASE_URL]
  ]).value;
  const apiKeyEntry = firstNonEmptyEntry([
    ["CODEX_API_KEY", process.env.CODEX_API_KEY],
    ["ORACLE_CODE_ASSIST_API_KEY", process.env.ORACLE_CODE_ASSIST_API_KEY],
    ["OCA_API_KEY", process.env.OCA_API_KEY],
    ["OPENAI_API_KEY", process.env.OPENAI_API_KEY]
  ]);
  const hasOracleHints = Boolean(
    String(process.env.ORACLE_CODE_ASSIST_API_KEY || "").trim()
    || String(process.env.OCA_API_KEY || "").trim()
    || String(process.env.ORACLE_CODE_ASSIST_BASE_URL || "").trim()
    || String(process.env.OCA_BASE_URL || "").trim()
  );
  const envKeyName = String(process.env.CODEX_PROVIDER_ENV_KEY || "").trim() || apiKeyEntry.name || "OPENAI_API_KEY";
  const wireApiRaw = String(process.env.CODEX_PROVIDER_WIRE_API || "responses").trim().toLowerCase();
  const wireApi = wireApiRaw.startsWith("chat") ? "chat" : "responses";
  const providerModel = firstNonEmptyEntry([
    ["CODEX_PROVIDER_MODEL", process.env.CODEX_PROVIDER_MODEL],
    ["ORACLE_CODE_ASSIST_MODEL", process.env.ORACLE_CODE_ASSIST_MODEL],
    ["OCA_MODEL", process.env.OCA_MODEL]
  ]).value;
  const queryParams = parseProviderObjectEnv(
    firstNonEmptyEntry([
      ["CODEX_PROVIDER_QUERY_PARAMS", process.env.CODEX_PROVIDER_QUERY_PARAMS],
      ["ORACLE_CODE_ASSIST_QUERY_PARAMS", process.env.ORACLE_CODE_ASSIST_QUERY_PARAMS],
      ["OCA_QUERY_PARAMS", process.env.OCA_QUERY_PARAMS]
    ]).value,
    "CODEX_PROVIDER_QUERY_PARAMS"
  );
  const httpHeaders = parseProviderObjectEnv(
    firstNonEmptyEntry([
      ["CODEX_PROVIDER_HTTP_HEADERS", process.env.CODEX_PROVIDER_HTTP_HEADERS],
      ["ORACLE_CODE_ASSIST_HTTP_HEADERS", process.env.ORACLE_CODE_ASSIST_HTTP_HEADERS],
      ["OCA_HTTP_HEADERS", process.env.OCA_HTTP_HEADERS]
    ]).value,
    "CODEX_PROVIDER_HTTP_HEADERS"
  );

  let providerId = providerIdHint || providerHint;
  if (!providerId && hasOracleHints) {
    providerId = "oca";
  }
  if (!providerId && apiKeyEntry.value && envKeyName !== "OPENAI_API_KEY") {
    providerId = envKeyName;
  }

  providerId = normalizeProviderId(providerId, explicitBaseUrl ? "openai-compatible" : "openai");
  const providerName = providerNameHint
    || (providerId === "oca" || providerId === "oracle-code-assist"
      ? "Oracle Code Assist"
      : providerId === "openai"
        ? "OpenAI"
        : "Custom OpenAI-Compatible");
  const baseUrl = explicitBaseUrl || (providerId === "openai" ? "https://api.openai.com/v1" : "");
  const defaultModel = providerModel || ((providerId === "oca" || providerId === "oracle-code-assist") ? "gpt5" : "");
  const defaultHeaders = Object.keys(httpHeaders).length
    ? httpHeaders
    : (providerId === "oca" || providerId === "oracle-code-assist")
      ? { client: "codex-cli", "client-version": "0" }
      : {};

  return {
    providerId,
    providerName,
    envKeyName,
    apiKey: apiKeyEntry.value,
    baseUrl,
    explicitBaseUrl,
    wireApi,
    defaultModel,
    httpHeaders: defaultHeaders,
    queryParams,
    usesApiKey: Boolean(apiKeyEntry.value),
    keyLooksLikeJwt: looksLikeJwtToken(apiKeyEntry.value),
    usesLikelyOpenAiHost: isLikelyOpenAiBaseUrl(baseUrl)
  };
}

function buildCodexConfigToml(providerSettings, mcpServers = []) {
  const resolvedMcpServers = addGenericJiraMcpAliases(mcpServers);
  const lines = [
    providerSettings.defaultModel ? `model = ${formatTomlString(providerSettings.defaultModel)}` : "",
    `model_provider = ${formatTomlString(providerSettings.providerId)}`,
    "",
    `[model_providers.${providerSettings.providerId}]`,
    `name = ${formatTomlString(providerSettings.providerName)}`,
    `base_url = ${formatTomlString(providerSettings.baseUrl)}`,
    `env_key = ${formatTomlString(providerSettings.envKeyName)}`,
    `wire_api = ${formatTomlString(providerSettings.wireApi)}`
  ].filter(Boolean);

  if (Object.keys(providerSettings.queryParams || {}).length) {
    lines.push(`query_params = ${formatTomlInlineTable(providerSettings.queryParams)}`);
  }

  if (Object.keys(providerSettings.httpHeaders || {}).length) {
    lines.push(`http_headers = ${formatTomlInlineTable(providerSettings.httpHeaders)}`);
  }

  if (providerSettings.defaultModel) {
    lines.push(`model = ${formatTomlString(providerSettings.defaultModel)}`);
  }

  if (providerSettings.providerId !== "openai") {
    lines.push("requires_openai_auth = false");
  }

  for (const server of resolvedMcpServers) {
    if (server?.kind !== "command" || !server?.name || !server?.command) {
      continue;
    }

    lines.push(
      "",
      `[mcp_servers.${server.name}]`,
      `command = ${formatTomlString(server.command)}`
    );

    if (Array.isArray(server.args) && server.args.length) {
      lines.push(`args = ${formatTomlArray(server.args)}`);
    }

    if (server.env && Object.keys(server.env).length) {
      lines.push(`env = ${formatTomlInlineTable(server.env)}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function writeSsePrelude(res) {
  if (res.writableEnded || res.destroyed) {
    return;
  }

  // Force the browser to flush the streaming response instead of buffering tiny chunks.
  res.write(`:${" ".repeat(8192)}\n\n`);
}

function hasCliFlag(...flags) {
  return flags.some((flag) => CLI_FLAGS.has(String(flag || "").trim().toLowerCase()));
}

function sleepSync(milliseconds) {
  const durationMs = Math.max(0, Number(milliseconds) || 0);
  if (!durationMs) {
    return;
  }

  if (process.platform === "win32" && commandExists("powershell.exe")) {
    spawnSync("powershell.exe", ["-NoProfile", "-Command", `Start-Sleep -Milliseconds ${durationMs}`], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  const start = Date.now();
  while (Date.now() - start < durationMs) {
    // Busy wait only for very short CLI shutdown flows.
  }
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

function listListeningPidsOnWindows(port) {
  const targetPort = Number(port);
  if (!Number.isInteger(targetPort) || targetPort <= 0) {
    return [];
  }

  const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true
  });

  if (result.status !== 0 || !String(result.stdout || "").trim()) {
    return [];
  }

  return [...new Set(
    String(result.stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/))
      .filter((parts) => parts.length >= 5)
      .filter((parts) => String(parts[0] || "").toUpperCase() === "TCP")
      .filter((parts) => String(parts[3] || "").toUpperCase() === "LISTENING")
      .filter((parts) => {
        const localAddress = String(parts[1] || "").trim();
        const match = localAddress.match(/:(\d+)$/);
        return match && Number(match[1]) === targetPort;
      })
      .map((line) => {
        const parts = Array.isArray(line) ? line : String(line || "").split(/\s+/);
        return Number(parts[4] || 0);
      })
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
  )];
}

function listListeningPidsOnUnix(port) {
  if (!commandExists("lsof")) {
    return [];
  }

  const result = spawnSync("lsof", ["-ti", `tcp:${port}`], {
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0 || !String(result.stdout || "").trim()) {
    return [];
  }

  return [...new Set(
    String(result.stdout || "")
      .split(/\r?\n/)
      .map((value) => Number(String(value || "").trim()))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
  )];
}

function listListeningPids(port) {
  return process.platform === "win32"
    ? listListeningPidsOnWindows(port)
    : listListeningPidsOnUnix(port);
}

function stopScheduledTask(taskName) {
  if (process.platform !== "win32") {
    return {
      ok: false,
      skipped: true,
      message: "Scheduled task stop is only available on Windows."
    };
  }

  const result = spawnSync("schtasks", ["/End", "/TN", taskName], {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true
  });
  const stderrText = String(result.stderr || "").trim();
  const stdoutText = String(result.stdout || "").trim();
  const combinedText = stderrText || stdoutText;

  if (result.status === 0) {
    return {
      ok: true,
      skipped: false,
      message: `Ended scheduled task ${taskName}.`
    };
  }

  if (/cannot find the file specified|cannot find the task|error: the system cannot find the file specified/i.test(combinedText)) {
    return {
      ok: false,
      skipped: true,
      message: `Scheduled task ${taskName} was not found.`
    };
  }

  if (/task is not currently running/i.test(combinedText)) {
    return {
      ok: false,
      skipped: true,
      message: `Scheduled task ${taskName} is not running.`
    };
  }

  return {
    ok: false,
    skipped: false,
    message: combinedText || `Failed to end scheduled task ${taskName}.`
  };
}

function stopPortListeners(port) {
  const pids = listListeningPids(port);
  const killed = [];
  const failed = [];

  for (const pid of pids) {
    if (process.platform === "win32") {
      const result = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
        encoding: "utf8",
        stdio: "pipe",
        windowsHide: true
      });
      if (result.status === 0) {
        killed.push(pid);
      } else {
        failed.push({
          pid,
          message: String(result.stderr || result.stdout || "").trim() || `Failed to stop PID ${pid}.`
        });
      }
      continue;
    }

    try {
      process.kill(pid, "SIGKILL");
      killed.push(pid);
    } catch (error) {
      failed.push({
        pid,
        message: error.message || `Failed to stop PID ${pid}.`
      });
    }
  }

  return { pids, killed, failed };
}

function handleStopServerCli() {
  const targetPort = Number(PORT) > 0 ? Number(PORT) : 3210;
  const configuredTaskName = String(process.env.SERVER_WINDOWS_TASK_NAME || "").trim();
  const primaryTaskName = configuredTaskName || DEFAULT_WINDOWS_TASK_NAMES[0];
  const additionalTaskNames = configuredTaskName ? [] : DEFAULT_WINDOWS_TASK_NAMES.slice(1);
  const initialTaskNames = [primaryTaskName];

  for (const taskName of initialTaskNames) {
    const taskResult = stopScheduledTask(taskName);
    if (!taskResult.skipped) {
      console.log(taskResult.message);
    } else if (!taskResult.ok && taskResult.message) {
      console.warn(taskResult.message);
    }
  }

  sleepSync(1200);

  if (additionalTaskNames.length && listListeningPids(targetPort).length) {
    for (const taskName of additionalTaskNames) {
      const taskResult = stopScheduledTask(taskName);
      if (!taskResult.skipped) {
        console.log(taskResult.message);
      } else if (!taskResult.ok && taskResult.message) {
        console.warn(taskResult.message);
      }
    }
    sleepSync(1200);
  }

  const listenerResult = stopPortListeners(targetPort);
  if (listenerResult.killed.length) {
    console.log(`Stopped listener${listenerResult.killed.length === 1 ? "" : "s"} on port ${targetPort}: ${listenerResult.killed.join(", ")}`);
  } else if (!listenerResult.pids.length) {
    console.log(`No listener found on port ${targetPort}.`);
  }

  for (const failure of listenerResult.failed) {
    console.warn(`Failed to stop PID ${failure.pid}: ${failure.message}`);
  }

  const exitCode = listenerResult.failed.length ? 1 : 0;
  process.exit(exitCode);
}

if (hasCliFlag("-stop", "--stop")) {
  handleStopServerCli();
}

ensureAuthConfigFile();

if (SERVE_UI && getAuthState().enabled) {
  ensureAuthRuntimeFiles();
}

if (SERVE_AGENT_API) {
  ensureRuntimeFiles();
  ensureRequiredElevationAtStartup();
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

function resolveCodexRuntimeHome(sessionId = "", mcpServers = []) {
  const configuredCodexHome = String(process.env.CODEX_HOME || "").trim();
  const profileCodexHome = configuredCodexHome
    ? path.resolve(configuredCodexHome)
    : path.join(os.homedir(), ".codex");
  const profileHome = configuredCodexHome
    ? path.dirname(profileCodexHome)
    : os.homedir();
  const authPath = path.join(profileCodexHome, "auth.json");
  const providerSettings = resolveCodexProviderSettings();

  if (providerSettings.usesApiKey) {
    if (!providerSettings.baseUrl) {
      throw new Error(
        providerSettings.providerId === "oracle-code-assist"
          ? "Oracle Code Assist hosted execution requires ORACLE_CODE_ASSIST_BASE_URL or CODEX_BASE_URL to be set on the VM."
          : `Codex API-key execution requires a base URL for provider ${providerSettings.providerId}. Set CODEX_BASE_URL on the VM.`
      );
    }

    if (providerSettings.keyLooksLikeJwt && providerSettings.usesLikelyOpenAiHost) {
      throw new Error(
        `${providerSettings.envKeyName} on this VM looks like a JWT or Oracle identity token, not a real API key for the configured OpenAI-hosted endpoint. Remove that value and either complete \`codex login\` for this VM user or set a valid API key.`
      );
    }

    const runtimeSuffix = String(sessionId || "shared-runtime").trim() || "shared-runtime";
    const codexHome = path.join(CODEX_RUNTIME_HOME_DIR, runtimeSuffix);
    fs.mkdirSync(codexHome, { recursive: true });
    fs.writeFileSync(path.join(codexHome, "config.toml"), buildCodexConfigToml(providerSettings, mcpServers));
    return {
      profileHome,
      codexHome,
      authMode: "api-key",
      providerSettings
    };
  }

  if (!fs.existsSync(profileCodexHome) || !fs.statSync(profileCodexHome).isDirectory()) {
    throw new Error(
      `${configuredCodexHome ? "Configured CODEX_HOME" : "Codex home"} was not found at ${profileCodexHome}. Either complete \`codex login\` for the VM user running this server, set CODEX_HOME to a valid Codex profile, or set an API key provider configuration such as OPENAI_API_KEY or ORACLE_CODE_ASSIST_API_KEY.`
    );
  }

  if (!fs.existsSync(authPath)) {
    throw new Error(
      `Codex login was not found at ${authPath}. Either complete \`codex login\` for the VM user running this server, set CODEX_HOME to a valid Codex profile, or set an API key provider configuration such as OPENAI_API_KEY or ORACLE_CODE_ASSIST_API_KEY.`
    );
  }

  return {
    profileHome,
    codexHome: profileCodexHome,
    authMode: "chatgpt-login",
    providerSettings
  };
}

function buildCodexChildEnv(sessionId = "", mcpServers = []) {
  const env = { ...process.env };
  const { profileHome, codexHome, providerSettings } = resolveCodexRuntimeHome(sessionId, mcpServers);

  env.HOME = profileHome;
  env.USERPROFILE = profileHome;
  env.CODEX_HOME = codexHome;
  env.CODEX_SKILLS_DIR = CODEX_SKILLS_DIR;

  if (process.platform === "win32" && /^[A-Za-z]:/.test(profileHome)) {
    env.HOMEDRIVE = profileHome.slice(0, 2);
    env.HOMEPATH = profileHome.slice(2);
  }

  if (providerSettings?.usesApiKey) {
    env[providerSettings.envKeyName] = providerSettings.apiKey;
    env.OPENAI_BASE_URL = providerSettings.baseUrl;
    if (providerSettings.envKeyName !== "OPENAI_API_KEY") {
      delete env.OPENAI_API_KEY;
    }
  }

  return env;
}

function isNoisyCodexStderrLine(line) {
  return /WARN codex_core_plugins::loader: failed to load plugin: plugin is not installed/.test(line)
    || /WARN codex_core_plugins::startup_remote_sync: skipping startup remote plugin sync/.test(line)
    || /WARN codex_core_skills::loader: ignoring interface\.icon_(?:small|large): icon path must not contain/.test(line)
    || /WARN codex_core::session::turn: stream disconnected - retrying sampling request/.test(line);
}

function filterCodexStderrNoise(text) {
  const raw = String(text || "");
  const trailingNewline = /\r?\n$/.test(raw);
  const lines = raw.split(/\r?\n/).filter((line, index, allLines) => (
    (line || index < allLines.length - 1) && !isNoisyCodexStderrLine(line)
  ));

  if (!lines.length) {
    return "";
  }

  return `${lines.join("\n")}${trailingNewline ? "\n" : ""}`;
}

function getHostedCodexPreflightIssue(request) {
  if (!request || request.workspaceMode !== "shared-api") {
    return "";
  }

  const codexSpawn = resolveCodexLaunch(CODEX_BIN, ["--help"]);
  if (!commandExists(codexSpawn.command)) {
    return [
      `Codex CLI was not found for the VM user running this server.`,
      `Configured runner: ${CODEX_BIN}.`,
      "Install Codex for that VM user, or point CODEX_BIN at the full codex.cmd path."
    ].join(" ");
  }

  try {
    resolveCodexRuntimeHome("__preflight__");
  } catch (error) {
    return error.message;
  }

  return "";
}

async function probeMcpServer(url) {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    return {
      ok: false,
      reason: "Missing MCP URL."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/event-stream"
      },
      redirect: "follow",
      signal: controller.signal
    });
    const contentType = String(response.headers.get("content-type") || "").trim().toLowerCase();
    const bodyPreview = String(await response.text()).slice(0, 512).trim().toLowerCase();

    if (contentType.startsWith("text/html") || bodyPreview.startsWith("<!doctype html") || bodyPreview.startsWith("<html")) {
      return {
        ok: false,
        reason: `Returned HTML instead of MCP content (${contentType || "text/html"}).`
      };
    }

    return {
      ok: true,
      reason: ""
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.name === "AbortError" ? "Timed out during MCP probe." : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function probeCommandMcpServer(server) {
  const command = String(server?.command || "").trim();
  if (!command) {
    return {
      ok: false,
      reason: "Missing MCP command."
    };
  }

  if (!commandExists(command)) {
    return {
      ok: false,
      reason: `Command not found: ${command}`
    };
  }

  const executableName = path.basename(command).toLowerCase();
  if (executableName !== "docker" && executableName !== "docker.exe") {
    return {
      ok: true,
      reason: ""
    };
  }

  // FPS-135835| guid| Reject Jira MCP when Docker exists but the daemon is unavailable.
  const result = spawnSync(command, ["info", "--format", "{{.ServerVersion}}"], {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 5000,
    windowsHide: true
  });
  const failureText = String(
    result.error?.message
    || result.stderr
    || result.stdout
    || ""
  ).trim();

  if (result.status !== 0 || result.error) {
    const needsElevationHint = process.platform === "win32" && !isProcessElevated();
    const hint = needsElevationHint
      ? " Current server process is not elevated. Start the hosted server with start-server-service.cmd or rerun start-server.cmd as Administrator before using Docker-backed Jira MCP."
      : "";
    return {
      ok: false,
      reason: `${failureText || "Docker daemon is unavailable for this MCP server."}${hint}`.trim()
    };
  }

  return {
    ok: true,
    reason: ""
  };
}

const DOCKER_RUN_FLAGS_WITH_VALUE = new Set([
  "-a",
  "--add-host",
  "--annotation",
  "--blkio-weight-device",
  "--cap-add",
  "--cap-drop",
  "--cgroup-parent",
  "--cidfile",
  "--cpu-period",
  "--cpu-quota",
  "--cpu-rt-period",
  "--cpu-rt-runtime",
  "--cpu-shares",
  "--cpus",
  "--cpuset-cpus",
  "--cpuset-mems",
  "--device",
  "--device-cgroup-rule",
  "--device-read-bps",
  "--device-read-iops",
  "--device-write-bps",
  "--device-write-iops",
  "--dns",
  "--dns-option",
  "--dns-search",
  "-e",
  "--env",
  "--env-file",
  "--entrypoint",
  "--gpus",
  "--group-add",
  "--health-cmd",
  "--health-interval",
  "--health-retries",
  "--health-start-interval",
  "--health-start-period",
  "--health-timeout",
  "--hostname",
  "--ip",
  "--ip6",
  "--ipc",
  "--isolation",
  "--label",
  "--label-file",
  "--link",
  "--link-local-ip",
  "--log-driver",
  "--log-opt",
  "--mac-address",
  "-m",
  "--memory",
  "--memory-reservation",
  "--memory-swap",
  "--memory-swappiness",
  "--mount",
  "--name",
  "--network",
  "--network-alias",
  "--oom-kill-disable",
  "--oom-score-adj",
  "-p",
  "--publish",
  "--pid",
  "--platform",
  "--privileged",
  "--pull",
  "--restart",
  "--runtime",
  "--security-opt",
  "--shm-size",
  "--stop-signal",
  "--stop-timeout",
  "--storage-opt",
  "--tmpfs",
  "-u",
  "--user",
  "--userns",
  "--uts",
  "-v",
  "--volume",
  "--volume-driver",
  "--volumes-from",
  "-w",
  "--workdir"
]);

function extractDockerImageRef(server) {
  const args = Array.isArray(server?.args) ? server.args.map((value) => String(value || "").trim()).filter(Boolean) : [];
  if (!args.length) {
    return "";
  }

  const runIndex = args.findIndex((value) => value.toLowerCase() === "run");
  if (runIndex < 0 || runIndex === args.length - 1) {
    return "";
  }

  for (let index = runIndex + 1; index < args.length; index += 1) {
    const value = args[index];
    if (!value) {
      continue;
    }

    if (value === "--") {
      return index + 1 < args.length ? args[index + 1] : "";
    }

    if (value.startsWith("-")) {
      if (value.includes("=")) {
        continue;
      }
      if (DOCKER_RUN_FLAGS_WITH_VALUE.has(value)) {
        index += 1;
      }
      continue;
    }

    return value;
  }

  return "";
}

function probeDockerImageAvailability(command, imageRef) {
  if (!imageRef) {
    return {
      ok: true,
      reason: ""
    };
  }

  const inspectResult = spawnSync(command, ["image", "inspect", imageRef], {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 5000,
    windowsHide: true
  });

  if (inspectResult.status === 0 && !inspectResult.error) {
    return {
      ok: true,
      reason: ""
    };
  }

  const pullResult = spawnSync(command, ["pull", imageRef], {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 20000,
    windowsHide: true
  });

  if (pullResult.status === 0 && !pullResult.error) {
    return {
      ok: true,
      reason: ""
    };
  }

  const failureText = String(
    pullResult.error?.message
    || pullResult.stderr
    || pullResult.stdout
    || inspectResult.error?.message
    || inspectResult.stderr
    || inspectResult.stdout
    || ""
  ).trim();

  return {
    ok: false,
    reason: `Docker image ${imageRef} is not available locally and could not be pulled. ${failureText || "Image pull failed."}`.trim()
  };
}

async function resolveRunnableMcpServers() {
  const configuredServers = getConfiguredMcpServers();
  if (!configuredServers.length) {
    return {
      runnableUrlServers: [],
      runnableCommandServers: [],
      skippedServers: []
    };
  }
  const urlServers = configuredServers.filter((server) => server.kind === "url");
  const commandServers = configuredServers.filter((server) => server.kind === "command");

  const urlResults = await Promise.all(
    urlServers.map(async (server) => ({
      ...server,
      probe: await probeMcpServer(server.url)
    }))
  );

  const commandResults = commandServers.map((server) => ({
    ...server,
    probe: (() => {
      const commandProbe = probeCommandMcpServer(server);
      if (!commandProbe.ok) {
        return commandProbe;
      }

      const command = String(server?.command || "").trim();
      const executableName = path.basename(command).toLowerCase();
      if (executableName !== "docker" && executableName !== "docker.exe") {
        return commandProbe;
      }

      return probeDockerImageAvailability(command, extractDockerImageRef(server));
    })()
  }));

  return {
    runnableUrlServers: urlResults.filter((server) => server.probe.ok),
    runnableCommandServers: commandResults.filter((server) => server.probe.ok),
    skippedServers: [...urlResults, ...commandResults].filter((server) => !server.probe.ok)
  };
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

  if (request.workspaceMode === "shared-api" && String(request.workspace).trim().toLowerCase().startsWith("shared://")) {
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

function readJsonRequest(req) {
  return new Promise((resolve, reject) => {
    parseRequestBody(req, (error, payload) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(payload || {});
    });
  });
}

async function handleTicketEvidence(req, res) {
  let payload = null;
  try {
    payload = await readJsonRequest(req);
  } catch (error) {
    sendJson(res, error.message === "Request body too large" ? 413 : 400, { error: error.message || "Invalid JSON body" });
    return;
  }

  const ticketSource = String(payload.ticketSource || payload.ticketType || "").trim().toLowerCase();
  const ticketId = String(payload.ticketId || "").trim();
  // Validate: only jira and bugdb are supported ticket sources
  if (ticketSource !== "jira" && ticketSource !== "bugdb") {
    sendJson(res, 400, { error: "Only jira and bugdb evidence prefetch is supported by this endpoint." });
    return;
  }
  if (!ticketId) {
    sendJson(res, 400, { error: "Ticket ID / Bug number is required." });
    return;
  }

  // --- BugDB path ---
  if (ticketSource === "bugdb") {
    // Check credentials are configured before attempting fetch
    if (!resolveBugDbConfig()) {
      sendJson(res, 409, { error: "BugDB is not configured on this server. Set BUGDB_CLIENT_ID and BUGDB_CLIENT_SECRET." });
      return;
    }
    try {
      // Fetch bug details + download text attachments only (skip images/binaries)
      const bugDbEvidence = await fetchDirectBugDbEvidence(ticketId, { downloadAttachments: true, textOnly: true });

      // Strip server-internal filesystem paths before sending to browser
      const { attachmentDirectory, ...safeEvidence } = bugDbEvidence;

      // Replace raw HTML 404 error pages with short readable messages
      const cleanErrors = Object.fromEntries(
        Object.entries(safeEvidence.endpointErrors || {}).map(([k, v]) => [
          k,
          v ? (/HTTP 404/i.test(v) ? `${k}: not available (HTTP 404)` : String(v).split("\n")[0].slice(0, 200)) : ""
        ])
      );

      // Remove server-only fields (localPath, _skipped) from each attachment
      const cleanAttachments = (safeEvidence.attachments || []).map(
        ({ localPath, _skipped, ...a }) => a
      );

      sendJson(res, 200, {
        ticketSource: "bugdb",
        ticketId: safeEvidence.bugNumber || ticketId,
        issueTitle: safeEvidence.synopsis || "",
        bugDbEvidence: { ...safeEvidence, attachments: cleanAttachments, endpointErrors: cleanErrors }
      });
    } catch (error) {
      sendJson(res, 409, { error: error.message || `Failed to fetch BugDB bug ${ticketId}.` });
    }
    return;
  }

  // --- Jira path ---
  try {
    const jiraEvidence = await fetchDirectJiraIssueEvidence(ticketId);
    sendJson(res, 200, {
      ticketSource: "jira",
      ticketId: jiraEvidence.key || ticketId,
      issueTitle: jiraEvidence.summary || "",
      jiraEvidence
    });
  } catch (error) {
    sendJson(res, 409, { error: error.message || `Failed to fetch Jira issue ${ticketId} via the direct Jira API.` });
  }
}

function handleRun(req, res, currentUser = null) {
  parseRequestBody(req, async (parseError, payload) => {
    if (parseError) {
      sendJson(res, parseError.message === "Request body too large" ? 413 : 400, { error: parseError.message || "Invalid JSON body" });
      return;
    }

    let request = null;
    let session = null;
    let sessionId = "";
    let startedAt = "";
    let prompt = "";

    try {
      request = normalizeRequest(payload);
      const previousSession = request.previousSessionId ? loadSession(request.previousSessionId, ACTIVE_SESSION_IDS, currentUser) : null;
      const elevated = isProcessElevated();
      const sessionOwner = buildSessionOwner(currentUser);
      let jiraEvidence = null;

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

    const compatibilityIssue = getHostedCodexCompatibilityIssue(request);
    if (compatibilityIssue) {
      sendJson(res, 409, { error: compatibilityIssue });
      return;
    }

    const hostedCodexPreflightIssue = getHostedCodexPreflightIssue(request);
    if (hostedCodexPreflightIssue) {
      sendJson(res, 409, { error: hostedCodexPreflightIssue });
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

    if (request.ticketSource === "jira") {
      jiraEvidence = request.jiraEvidence && typeof request.jiraEvidence === "object" ? request.jiraEvidence : null;
      if (!jiraEvidence) {
        try {
          jiraEvidence = await fetchDirectJiraIssueEvidence(request.ticketId);
        } catch (error) {
          sendJson(res, 409, {
            error: error.message || `Failed to fetch Jira issue ${request.ticketId} via the direct Jira API.`
          });
          return;
        }
      }

      request = {
        ...request,
        issueTitle: request.issueTitle || jiraEvidence.summary || "",
        jiraEvidence
      };
    }

    const displayName = buildSessionDisplayName(request);
    prompt = buildSessionPrompt(request, previousSession);
    sessionId = createSessionId(request);
    startedAt = new Date().toISOString();
    const tempFile = path.join(CODEX_OUTPUT_DIR, `codex-last-message-${sessionId}.txt`);
    let executionWorkspace = request.workspace;
    let ticketScopedServers = {
      runnableUrlServers: [],
      runnableCommandServers: [],
      skippedServers: [],
      blockingIssue: ""
    };
    if (request.ticketSource !== "jira" && request.ticketSource !== "description") {
      const {
        runnableUrlServers,
        runnableCommandServers,
        skippedServers
      } = await resolveRunnableMcpServers();
      ticketScopedServers = resolveTicketScopedMcpServers(request, {
        runnableUrlServers,
        runnableCommandServers,
        skippedServers
      });

      if (ticketScopedServers.blockingIssue) {
        sendJson(res, 409, { error: ticketScopedServers.blockingIssue });
        return;
      }
    }

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

    for (const server of ticketScopedServers.runnableUrlServers) {
      args.push("-c", `mcp_servers.${server.name}.url=${JSON.stringify(server.url)}`);
    }

    const enableHostedFullAccess = CODEX_FULL_ACCESS || request.workspaceMode === "shared-api";
    if (enableHostedFullAccess) {
      args.splice(4, 0, "--dangerously-bypass-approvals-and-sandbox");
    }

    if (request.model) {
      args.push("-m", request.model);
    }

    session = saveSession({
      id: sessionId,
      owner: sessionOwner,
      status: "running",
      startedAt,
      completedAt: "",
      durationMs: 0,
      request: {
        product: request.product.key,
        productLabel: request.product.family,
        mode: request.mode,
        ticketId: request.ticketId,
        issueTitle: request.issueTitle,
        bugDescription: request.bugDescription,
        derivedIssueTitle: "",
        workspace: request.workspace,
        workspaceMode: request.workspaceMode,
        sharedWorkspaceApiBaseUrl: request.sharedWorkspaceApiBaseUrl,
        ticketSource: request.ticketSource,
        version: request.version,
        displayName,
        model: request.model,
        extraInstructions: request.extraInstructions,
        guidanceMode: request.guidanceMode,
        previousSessionId: request.previousSessionId,
        continueSession: request.continueSession,
        jiraEvidence: request.jiraEvidence || jiraEvidence,
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
    }, currentUser);

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
    let clientDisconnected = false;
    let stopRequested = false;
    let child = null;
    let childEnv = null;
    let finalized = false;
    let lastActivityAt = Date.now();
    let silenceWarningSentAt = 0;
    let maxSilenceReached = false;
    let maxSilenceMessage = "";
    const STREAM_PADDING_BYTES = 16384;

    function persistRunningSession(progress = session.progress || {}) {
      session = saveSession({
        ...session,
        progress,
        output: {
          ...(session.output || {}),
          liveText: normalizeReportText(liveText.trim()),
          stderr: normalizeReportText(stderrBuffer.trim())
        }
      });
    }

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
      owner: sessionOwner,
      displayName,
      product: request.product.key,
      mode: request.mode,
      continueSession: request.continueSession,
      guidanceMode: request.guidanceMode,
      command: CODEX_BIN,
      args,
      workspace: request.workspace
    }, {
      paddingBytes: STREAM_PADDING_BYTES
    });

    if (ticketScopedServers.skippedServers.length) {
      safeSendSse(res, "warning", {
        sessionId,
        label: "MCP server skipped",
        headline: "One or more configured MCP endpoints were skipped before the run started.",
        message: ticketScopedServers.skippedServers.map((server) => `${server.name}: ${server.probe.reason}`).join(" "),
        detail: "The RCA run continues with the remaining MCP servers and packaged references."
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
    }

    const codexSpawn = resolveCodexLaunch(CODEX_BIN, args);
    try {
      childEnv = buildCodexChildEnv(sessionId, ticketScopedServers.runnableCommandServers);
    } catch (error) {
      ACTIVE_SESSION_IDS.delete(sessionId);
      session = saveSession({
        ...session,
        status: "failed",
        completedAt: new Date().toISOString(),
        error: error.message,
        output: {
          ...session.output,
          stderr: normalizeReportText(error.message)
        }
      });
      writeArtifacts({
        productLabel: request.product.family,
        mode: request.mode,
        ticketId: request.ticketId,
        workspace: request.workspace,
        version: request.version,
        prompt,
        liveText: "",
        finalMessage: "",
        errorText: normalizeReportText(error.message)
      }, currentUser);
      safeSendSse(res, "error", {
        sessionId,
        message: error.message
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
      safeSendSse(res, "done", {
        sessionId,
        code: 1,
        signal: "",
        error: error.message,
        message: error.message,
        hasFinalMessage: false,
        status: "failed"
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
      res.end();
      return;
    }
    try {
      child = spawn(codexSpawn.command, codexSpawn.args, {
        cwd: APP_ROOT,
        env: childEnv,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
        ...codexSpawn.options
      });
    } catch (error) {
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      const message = error.message || "Failed to start Codex.";
      ACTIVE_SESSION_IDS.delete(sessionId);
      RUNNING_SESSION_HANDLES.delete(sessionId);
      session = saveSession({
        ...session,
        status: "failed",
        completedAt,
        durationMs,
        error: message,
        output: {
          ...session.output,
          liveText: liveText.trim(),
          stderr: normalizeReportText(message)
        },
        process: {
          code: 1,
          signal: "",
          error: message
        }
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
        errorText: normalizeReportText(message)
      }, currentUser);
      safeSendSse(res, "error", {
        sessionId,
        message
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
      safeSendSse(res, "done", {
        sessionId,
        code: 1,
        signal: "",
        hasFinalMessage: false,
        status: "failed",
        message,
        error: message
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }
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
      const hasVisibleOutput = Boolean(liveText.trim() || stderrBuffer.trim());
      const silenceLimitMs = hasVisibleOutput ? RCA_MAX_SILENCE_MS : RCA_STARTUP_SILENCE_MS;
      const progress = {
        lastHeartbeatAt: new Date(now).toISOString(),
        elapsedMs,
        silenceMs,
        hasVisibleOutput
      };
      persistRunningSession(progress);

      safeSendSse(res, "heartbeat", {
        sessionId,
        elapsedMs,
        silenceMs
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });

      if (silenceMs >= RCA_SILENCE_WARNING_MS && now - silenceWarningSentAt >= RCA_SILENCE_WARNING_MS) {
        silenceWarningSentAt = now;
        const warningProgress = {
          ...(session.progress || progress),
          lastWarningAt: new Date(now).toISOString(),
          elapsedMs,
          silenceMs,
          hasVisibleOutput
        };
        persistRunningSession(warningProgress);
        safeSendSse(res, "warning", {
          sessionId,
          label: "Runner waiting",
          headline: "The RCA run is still active but Codex has not produced output yet.",
          message: `No stdout or stderr has arrived for ${formatDurationLabel(silenceMs)}.`,
          detail: "This usually means Codex is still starting tools or is blocked on an external dependency. If this continues for several minutes, stop the run and retry."
        }, {
          paddingBytes: STREAM_PADDING_BYTES
        });
      }

      if (!maxSilenceReached && silenceMs >= silenceLimitMs) {
        maxSilenceReached = true;
        // BUG-38884123| guid| Fail hosted shared runs quickly when Codex never becomes a usable child process.
        maxSilenceMessage = hasVisibleOutput
          ? `The RCA run was stopped after ${formatDurationLabel(silenceMs)} without any new visible output from Codex.`
          : `The RCA run was stopped after ${formatDurationLabel(silenceMs)} because Codex never produced startup output.`;
        stderrBuffer = [stderrBuffer.trim(), maxSilenceMessage].filter(Boolean).join("\n");
        const timeoutProgress = {
          ...(session.progress || progress),
          lastWarningAt: new Date(now).toISOString(),
          elapsedMs,
          silenceMs,
          hasVisibleOutput,
          maxSilenceReached: true
        };
        persistRunningSession(timeoutProgress);
        safeSendSse(res, "warning", {
          sessionId,
          label: "Runner timeout",
          headline: hasVisibleOutput
            ? "The RCA run was stopped because Codex stayed silent for too long."
            : "The RCA run was stopped because Codex never reached a usable startup state.",
          message: maxSilenceMessage,
          detail: hasVisibleOutput
            ? "Check Codex tool startup, MCP connectivity, or workspace access, then rerun the RCA."
            : "Check Codex authentication, CLI installation, server PATH, or VM runtime setup, then rerun the RCA."
        }, {
          paddingBytes: STREAM_PADDING_BYTES
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

    function detachChildFromClient() {
      clientDisconnected = true;
    }

    req.on("aborted", detachChildFromClient);
    res.on("close", () => {
      if (!res.writableEnded) {
        detachChildFromClient();
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

        persistRunningSession();
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
      const text = filterCodexStderrNoise(chunk.toString("utf8"));
      if (!text.trim()) {
        return;
      }
      stderrBuffer += text;
      persistRunningSession();
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
      }, currentUser);

      safeSendSse(res, "error", { sessionId, message: error.message }, {
        paddingBytes: STREAM_PADDING_BYTES
      });
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
      let normalizedStderr = normalizeReportText(stderrBuffer.trim());
      const fallbackFailureMessage = code === 0
        ? ""
        : formatCodexProcessFailure(code, signal, [normalizedStderr, maxSilenceMessage].filter(Boolean).join("\n"));
      let finalMessage = selectPreferredFinalMessage({
        finalMessage: readFileIfPresent(tempFile).trim(),
        liveText: normalizedLiveText,
        stderrText: normalizedStderr,
        maxSilenceMessage,
        fallbackFailureMessage,
        code
      });
      let sections = parseNamedSections(finalMessage);
      let rcaFields = parseRcaFields(sections.RCA);
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      let status = stopRequested ? "cancelled" : maxSilenceReached ? "failed" : code === 0 ? "completed" : "failed";
      if (status === "completed" && request.mode !== "fix") {
        // FPS-135835| guid| reject generic or weakly anchored RCA output before it is surfaced as a valid report
        const rcaEvaluation = evaluateRcaOutput({
          request,
          sections,
          rcaFields,
          finalMessage
        });
        if (rcaEvaluation.shouldReject) {
          const rejectionMessage = buildRejectedRcaMessage(request, rcaEvaluation);
          finalMessage = rejectionMessage;
          sections = parseNamedSections(finalMessage);
          rcaFields = parseRcaFields(sections.RCA);
          normalizedStderr = normalizeReportText([normalizedStderr, rejectionMessage].filter(Boolean).join("\n\n"));
          status = "failed";
        }
      }
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
      }, currentUser);

      safeSendSse(res, "final", {
        sessionId,
        code,
        signal,
        message: finalMessage,
        stderr: normalizedStderr,
        sections,
        rcaFields,
        artifacts: currentArtifacts(currentUser),
        session: {
          id: session.id,
          owner: session.owner || null,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          durationMs: session.durationMs,
          request: session.request,
          summary: session.summary,
          output: {
            finalMessage: session?.output?.finalMessage || "",
            stderr: session?.output?.stderr || ""
          }
        }
      }, {
        paddingBytes: STREAM_PADDING_BYTES
      });

      safeSendSse(res, "done", {
        sessionId,
        code,
        signal,
        hasFinalMessage: Boolean(finalMessage),
        status
      }, {
        paddingBytes: STREAM_PADDING_BYTES
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
    } catch (error) {
      if (sessionId) {
        ACTIVE_SESSION_IDS.delete(sessionId);
      }

      if (session) {
        const completedAt = new Date().toISOString();
        const failureText = normalizeReportText(error.message || "Unable to start the RCA run.");
        session = saveSession({
          ...session,
          status: "failed",
          completedAt,
          durationMs: startedAt ? Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()) : 0,
          output: {
            ...(session.output || {}),
            finalMessage: "",
            stderr: failureText
          },
          error: failureText
        });

        writeArtifacts({
          productLabel: request?.product?.family || session?.request?.productLabel || "",
          mode: request?.mode || session?.request?.mode || "",
          ticketId: request?.ticketId || session?.request?.ticketId || "",
          workspace: request?.workspace || session?.request?.workspace || "",
          version: request?.version || session?.request?.version || "",
          prompt,
          liveText: session?.output?.liveText || "",
          finalMessage: "",
          errorText: failureText
        }, currentUser);
      }

      // FPS-135835| guid| avoid JSON fallback once the run request has already committed SSE headers
      if (res.headersSent || res.writableEnded || res.destroyed) {
        console.error(`Run stream setup failed after SSE headers were sent: ${error.message}`);
        safeSendSse(res, "error", {
          sessionId,
          message: error.message || "Unable to start the RCA run."
        });
        safeSendSse(res, "done", {
          sessionId,
          code: 1,
          signal: "",
          hasFinalMessage: false,
          status: "failed"
        });
        if (!res.writableEnded && !res.destroyed) {
          try {
            res.end();
          } catch (endError) {
            // Best-effort shutdown only.
          }
        }
        return;
      }

      sendJson(res, 500, { error: error.message || "Unable to start the RCA run." });
    }
  });
}

function handleSessionsList(res, currentUser = null) {
  const sessions = listSessions(ACTIVE_SESSION_IDS, currentUser).map((session) => ({
    id: session.id,
    owner: session.owner || null,
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

function handleSessionGet(res, sessionId, currentUser = null) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS, currentUser);
  if (!session) {
    sendJson(res, 404, { error: "Session not found" });
    return;
  }

  sendJson(res, 200, session);
}

function handleSessionDelete(res, sessionId, currentUser = null) {
  const result = deleteSession(sessionId, ACTIVE_SESSION_IDS, currentUser);
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

function handleSessionStop(res, sessionId, currentUser = null) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS, currentUser);
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

function handleSessionsDeleteAll(res, currentUser = null) {
  const result = deleteAllSessions(ACTIVE_SESSION_IDS, currentUser);
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

function handleSessionReport(res, sessionId, format, currentUser = null) {
  const session = loadSession(sessionId, ACTIVE_SESSION_IDS, currentUser);
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
  const rawPathname = url.pathname;
  const pathname = rawPathname === "/"
    ? rawPathname
    : (rawPathname.replace(/\/+$/, "") || "/");
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

  if (SERVE_UI && pathname === "/api/broker/status" && req.method === "GET") {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    sendJson(res, 200, getBrokerStatus(authenticatedUser));
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/pick-workspace" && req.method === "GET") {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    const proxiedUrl = new URL(url.toString());
    proxiedUrl.pathname = "/api/pick-workspace";
    await proxyBrokerApiRequest(req, res, proxiedUrl, authenticatedUser);
    return;
  }

  if (SERVE_UI && pathname === "/api/broker/run" && req.method === "POST") {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    const proxiedUrl = new URL(url.toString());
    proxiedUrl.pathname = "/api/run";
    await proxyBrokerApiRequest(req, res, proxiedUrl, authenticatedUser);
    return;
  }

  const brokerSessionStopMatch = pathname.match(/^\/api\/broker\/sessions\/([^/]+)\/stop$/);
  if (SERVE_UI && req.method === "POST" && brokerSessionStopMatch) {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    const proxiedUrl = new URL(url.toString());
    proxiedUrl.pathname = `/api/sessions/${brokerSessionStopMatch[1]}/stop`;
    await proxyBrokerApiRequest(req, res, proxiedUrl, authenticatedUser);
    return;
  }

  if (SERVE_UI && pathname === "/api/ticket-evidence" && req.method === "POST") {
    const authenticatedUser = requireAuthenticatedUser(req, res);
    if (!authenticatedUser) {
      return;
    }
    await handleTicketEvidence(req, res);
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
      artifacts: Object.keys(currentArtifacts(currentUser))
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
      artifacts: Object.keys(currentArtifacts(currentUser))
    });
    return;
  }

  if (SERVE_AGENT_API && req.method === "GET" && pathname === "/api/artifacts") {
    sendJson(res, 200, currentArtifacts(currentUser));
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
    handleSessionsList(res, currentUser);
    return;
  }

  if (SERVE_AGENT_API && req.method === "DELETE" && pathname === "/api/sessions") {
    handleSessionsDeleteAll(res, currentUser);
    return;
  }

  const reportMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/report$/);
  if (SERVE_AGENT_API && req.method === "GET" && reportMatch) {
    handleSessionReport(res, decodeURIComponent(reportMatch[1]), url.searchParams.get("format") || "txt", currentUser);
    return;
  }

  const sessionStopMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/stop$/);
  if (SERVE_AGENT_API && req.method === "POST" && sessionStopMatch) {
    handleSessionStop(res, decodeURIComponent(sessionStopMatch[1]), currentUser);
    return;
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (SERVE_AGENT_API && req.method === "GET" && sessionMatch) {
    handleSessionGet(res, decodeURIComponent(sessionMatch[1]), currentUser);
    return;
  }

  if (SERVE_AGENT_API && req.method === "DELETE" && sessionMatch) {
    handleSessionDelete(res, decodeURIComponent(sessionMatch[1]), currentUser);
    return;
  }

  if (SERVE_AGENT_API && req.method === "POST" && pathname === "/api/run") {
    handleRun(req, res, currentUser);
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
