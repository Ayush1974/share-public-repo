const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const {
  APP_ROOT,
  DATA_DIR,
  HOST,
  PORT,
  SERVER_MODE
} = require("../core/config");
const {
  parseRequestBody,
  sendJson
} = require("../core/http-utils");

const BROKER_CONFIG_FILE = path.join(APP_ROOT, "ui-host-config.json");
const BROKER_STATE_FILE = path.join(DATA_DIR, "agent-broker-state.json");
const BROKER_AGENT_STALE_MS = 60 * 1000;
const BROKER_POLL_TIMEOUT_MS = 25000;
const BROKER_PROXY_TIMEOUT_MS = 5 * 60 * 1000;
const BROKER_INTERNAL_REQUEST_HEADER = "x-broker-local-request";

const brokerAgents = new Map();
const brokerUserBindings = new Map();
const brokerPendingRequests = new Map();

let brokerClientStarted = false;
let brokerLastPairingUrl = "";

function randomToken(bytes = 18) {
  return crypto.randomBytes(bytes).toString("hex");
}

function readJsonBody(req) {
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

function normalizeBaseUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`);
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    return "";
  }
}

function loadBrokerConfig() {
  const fromEnv = normalizeBaseUrl(process.env.BROKER_SERVER_URL || process.env.UI_HOST_BASE_URL || process.env.HOSTED_UI_BASE_URL);
  const autoOpenBrowserFromEnv = process.env.BROKER_AUTO_OPEN;
  let fileConfig = {};

  try {
    if (fs.existsSync(BROKER_CONFIG_FILE)) {
      fileConfig = JSON.parse(fs.readFileSync(BROKER_CONFIG_FILE, "utf8"));
    }
  } catch (error) {
    fileConfig = {};
  }

  const uiBaseUrl = fromEnv || normalizeBaseUrl(fileConfig.uiBaseUrl || fileConfig.hostedUiBaseUrl || "");
  return {
    enabled: Boolean(uiBaseUrl),
    uiBaseUrl,
    autoOpenBrowser: autoOpenBrowserFromEnv !== undefined
      ? String(autoOpenBrowserFromEnv).trim().toLowerCase() === "true"
      : fileConfig.autoOpenBrowser !== false,
    pollTimeoutMs: Number(fileConfig.pollTimeoutMs || BROKER_POLL_TIMEOUT_MS)
  };
}

function ensureBrokerStateDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadBrokerState() {
  try {
    if (!fs.existsSync(BROKER_STATE_FILE)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(BROKER_STATE_FILE, "utf8")) || {};
  } catch (error) {
    return {};
  }
}

function saveBrokerState(state) {
  try {
    ensureBrokerStateDir();
    fs.writeFileSync(BROKER_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  } catch (error) {
    // Best effort only.
  }
}

function resolvePublicBaseUrl(req) {
  const proto = String(req.headers["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http")).split(",")[0].trim() || "http";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return host ? `${proto}://${host}` : "";
}

function isTrustedHostedUiRequest(req) {
  const config = loadBrokerConfig();
  const trustedBaseUrl = normalizeBaseUrl(config.uiBaseUrl || "");
  if (!trustedBaseUrl) {
    return false;
  }

  const originBaseUrl = normalizeBaseUrl(req.headers.origin || "");
  if (originBaseUrl && originBaseUrl === trustedBaseUrl) {
    return true;
  }

  const refererBaseUrl = normalizeBaseUrl(req.headers.referer || "");
  return Boolean(refererBaseUrl && refererBaseUrl === trustedBaseUrl);
}

function buildUserKey(user = {}) {
  const safeUser = user && typeof user === "object" ? user : {};
  const candidates = [
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

function brokerAgentIsActive(agent) {
  return Boolean(agent && Date.now() - new Date(agent.lastSeenAt || 0).getTime() <= BROKER_AGENT_STALE_MS);
}

function getBoundBrokerAgent(user) {
  const key = buildUserKey(user);
  if (!key) {
    return null;
  }

  const agentId = brokerUserBindings.get(key);
  if (!agentId) {
    return null;
  }

  const agent = brokerAgents.get(agentId) || null;
  if (!brokerAgentIsActive(agent)) {
    if (agent && agent.userKey === key) {
      agent.userKey = "";
    }
    brokerUserBindings.delete(key);
    return null;
  }

  return agent;
}

function dequeueBrokerRequest(agent) {
  if (!agent || !agent.queue?.length) {
    return null;
  }

  return agent.queue.shift() || null;
}

function clearAgentPollWaiter(agent) {
  if (!agent?.pollWaiter) {
    return;
  }

  clearTimeout(agent.pollWaiter.timer);
  agent.pollWaiter = null;
}

function deliverBrokerRequest(agent, request) {
  if (!agent) {
    return false;
  }

  agent.lastSeenAt = new Date().toISOString();

  if (agent.pollWaiter) {
    const waiter = agent.pollWaiter;
    clearAgentPollWaiter(agent);
    waiter.resolve(request);
    return true;
  }

  agent.queue = agent.queue || [];
  agent.queue.push(request);
  return true;
}

function cleanupBrokerRequest(requestId, reason = "") {
  const request = brokerPendingRequests.get(requestId);
  if (!request) {
    return;
  }

  brokerPendingRequests.delete(requestId);
  clearTimeout(request.timer);

  if (request.agentId) {
    const agent = brokerAgents.get(request.agentId);
    if (agent?.queue?.length) {
      agent.queue = agent.queue.filter((entry) => entry.id !== requestId);
    }
  }

  if (request.stream && request.res && !request.res.writableEnded) {
    if (!request.started) {
      sendJson(request.res, 504, { error: reason || "The hosted UI timed out waiting for the local agent." });
    } else {
      request.res.end();
    }
    if (request.reject) {
      request.reject(new Error(reason || "The hosted UI timed out waiting for the local agent."));
    }
    return;
  }

  if (!request.stream && request.reject) {
    request.reject(new Error(reason || "The hosted UI timed out waiting for the local agent."));
  }
}

function createBrokerRequestEntry(agent, request) {
  return new Promise((resolve, reject) => {
    const requestId = randomToken(16);
    const entry = {
      id: requestId,
      agentId: agent.id,
      method: request.method,
      path: request.path,
      headers: request.headers || {},
      body: request.body,
      stream: Boolean(request.stream),
      res: request.res || null,
      started: false,
      resolve,
      reject,
      timer: setTimeout(() => {
        cleanupBrokerRequest(requestId, "The hosted UI timed out waiting for the local agent.");
      }, BROKER_PROXY_TIMEOUT_MS)
    };

    if (entry.res) {
      entry.res.on("close", () => {
        cleanupBrokerRequest(requestId, "The browser closed the proxied local-agent connection.");
      });
    }

    brokerPendingRequests.set(requestId, entry);
    deliverBrokerRequest(agent, {
      id: requestId,
      method: entry.method,
      path: entry.path,
      headers: entry.headers,
      body: entry.body,
      stream: entry.stream
    });
  });
}

function pickResponseHeaders(headers = {}) {
  const responseHeaders = {};
  const candidates = [
    "content-type",
    "content-disposition",
    "cache-control"
  ];

  for (const name of candidates) {
    const value = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (value) {
      responseHeaders[name] = value;
    }
  }

  return responseHeaders;
}

function handleBrokerConnectToken(req, res, currentUser, token, redirectPath = "/home") {
  if (!currentUser) {
    const separator = redirectPath.includes("?") ? "&" : "?";
    res.writeHead(302, {
      Location: `/login?brokerConnectToken=${encodeURIComponent(token)}&next=${encodeURIComponent(`${redirectPath}${separator}`.replace(/[?&]$/, ""))}`,
      "Cache-Control": "no-store"
    });
    res.end();
    return true;
  }

  const agent = [...brokerAgents.values()].find((candidate) => candidate.bindToken === token) || null;
  if (!brokerAgentIsActive(agent)) {
    redirectPath = redirectPath.replace(/[?&]brokerConnectToken=[^&]+/g, "").replace(/[?&]$/, "");
    res.writeHead(302, {
      Location: redirectPath || "/home",
      "Cache-Control": "no-store"
    });
    res.end();
    return true;
  }

  const nextUserKey = buildUserKey(currentUser);
  if (!nextUserKey) {
    sendJson(res, 400, { error: "Unable to bind the local agent to the current signed-in user." });
    return true;
  }

  const previousUserKey = String(agent.userKey || "").trim().toLowerCase();
  if (previousUserKey && previousUserKey !== nextUserKey) {
    brokerUserBindings.delete(previousUserKey);
  }

  const previousAgentId = brokerUserBindings.get(nextUserKey);
  if (previousAgentId && previousAgentId !== agent.id) {
    const previousAgent = brokerAgents.get(previousAgentId);
    if (previousAgent) {
      previousAgent.userKey = "";
    }
  }

  agent.userKey = nextUserKey;
  agent.bindToken = randomToken(18);
  agent.boundAt = new Date().toISOString();
  brokerUserBindings.set(nextUserKey, agent.id);

  redirectPath = redirectPath.replace(/([?&])brokerConnectToken=[^&]+(&)?/g, (match, first, second) => (first === "?" && second ? "?" : ""));
  redirectPath = redirectPath.replace(/\?&/, "?").replace(/[?&]$/, "");

  res.writeHead(302, {
    Location: redirectPath || "/home",
    "Cache-Control": "no-store"
  });
  res.end();
  return true;
}

async function handleBrokerAgentRegister(req, res) {
  const payload = await readJsonBody(req);
  const now = new Date().toISOString();
  let agent = null;

  if (payload.agentId && payload.agentSecret) {
    const existing = brokerAgents.get(String(payload.agentId));
    if (existing && existing.agentSecret === String(payload.agentSecret)) {
      agent = existing;
    }
  }

  if (!agent) {
    agent = {
      id: randomToken(12),
      agentSecret: randomToken(24),
      bindToken: randomToken(18),
      createdAt: now,
      queue: [],
      pollWaiter: null,
      userKey: ""
    };
    brokerAgents.set(agent.id, agent);
  }

  agent.machineName = String(payload.machineName || os.hostname()).trim() || os.hostname();
  agent.hostName = String(payload.hostName || "").trim() || agent.machineName;
  agent.platform = String(payload.platform || "").trim() || process.platform;
  agent.localPort = Number(payload.localPort || PORT || 0);
  agent.lastSeenAt = now;
  agent.lastRegisteredAt = now;

  const baseUrl = resolvePublicBaseUrl(req);
  const pairingUrl = baseUrl ? `${baseUrl}/home?brokerConnectToken=${encodeURIComponent(agent.bindToken)}` : "";

  sendJson(res, 200, {
    ok: true,
    agentId: agent.id,
    agentSecret: agent.agentSecret,
    bindToken: agent.bindToken,
    pairingUrl,
    bound: Boolean(agent.userKey)
  });
}

async function handleBrokerAgentPoll(req, res) {
  const payload = await readJsonBody(req);
  const agent = brokerAgents.get(String(payload.agentId || ""));
  if (!agent || agent.agentSecret !== String(payload.agentSecret || "")) {
    sendJson(res, 401, { error: "Invalid broker agent credentials." });
    return;
  }

  agent.lastSeenAt = new Date().toISOString();

  const pending = dequeueBrokerRequest(agent);
  if (pending) {
    sendJson(res, 200, { request: pending });
    return;
  }

  const request = await new Promise((resolve) => {
    clearAgentPollWaiter(agent);
    agent.pollWaiter = {
      resolve,
      timer: setTimeout(() => {
        clearAgentPollWaiter(agent);
        resolve(null);
      }, BROKER_POLL_TIMEOUT_MS)
    };
  });

  sendJson(res, 200, { request: request || null });
}

async function handleBrokerAgentResult(req, res) {
  const payload = await readJsonBody(req);
  const agent = brokerAgents.get(String(payload.agentId || ""));
  if (!agent || agent.agentSecret !== String(payload.agentSecret || "")) {
    sendJson(res, 401, { error: "Invalid broker agent credentials." });
    return;
  }

  agent.lastSeenAt = new Date().toISOString();

  const request = brokerPendingRequests.get(String(payload.requestId || ""));
  if (!request) {
    sendJson(res, 404, { error: "Broker request not found." });
    return;
  }

  if (payload.stream && payload.started) {
    request.started = true;
    if (request.res && !request.res.headersSent) {
      request.res.writeHead(Number(payload.statusCode || 200), {
        "Content-Type": payload.headers?.["content-type"] || payload.headers?.["Content-Type"] || "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no"
      });
    }

    sendJson(res, 200, { ok: true, stage: "started" });
    return;
  }

  if (payload.stream && payload.completed) {
    if (request.res && !request.res.writableEnded) {
      request.res.end();
    }
    brokerPendingRequests.delete(request.id);
    clearTimeout(request.timer);
    if (request.resolve) {
      request.resolve({ streamCompleted: true });
    }
    sendJson(res, 200, { ok: true, stage: "completed" });
    return;
  }

  const statusCode = Number(payload.statusCode || 200);
  const headers = pickResponseHeaders(payload.headers || {});
  const bodyText = String(payload.bodyText || "");

  if (request.stream) {
    if (request.res && !request.res.headersSent) {
      request.res.writeHead(statusCode, {
        "Content-Type": headers["content-type"] || "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      });
    }
    if (request.res && !request.res.writableEnded) {
      request.res.end(bodyText);
    }
    brokerPendingRequests.delete(request.id);
    clearTimeout(request.timer);
    sendJson(res, 200, { ok: true });
    return;
  }

  brokerPendingRequests.delete(request.id);
  clearTimeout(request.timer);
  request.resolve({
    statusCode,
    headers,
    bodyText
  });
  sendJson(res, 200, { ok: true });
}

async function handleBrokerAgentChunk(req, res) {
  const payload = await readJsonBody(req);
  const agent = brokerAgents.get(String(payload.agentId || ""));
  if (!agent || agent.agentSecret !== String(payload.agentSecret || "")) {
    sendJson(res, 401, { error: "Invalid broker agent credentials." });
    return;
  }

  agent.lastSeenAt = new Date().toISOString();

  const request = brokerPendingRequests.get(String(payload.requestId || ""));
  if (!request || !request.stream) {
    sendJson(res, 404, { error: "Broker stream request not found." });
    return;
  }

  if (request.res && !request.res.writableEnded) {
    request.res.write(String(payload.chunk || ""));
  }

  sendJson(res, 200, { ok: true });
}

function getBrokerStatus(user) {
  const agent = getBoundBrokerAgent(user);
  return {
    connected: Boolean(agent),
    agentId: agent?.id || "",
    machineName: agent?.machineName || "",
    localPort: agent?.localPort || 0,
    lastSeenAt: agent?.lastSeenAt || ""
  };
}

async function proxyBrokerApiRequest(req, res, url, currentUser) {
  const agent = getBoundBrokerAgent(currentUser);
  if (!agent) {
    sendJson(res, 503, { error: "No local agent is connected to the hosted UI for this signed-in user yet." });
    return;
  }

  const body = req.method === "POST" ? await readJsonBody(req) : undefined;
  const headers = {};
  if (req.headers.accept) {
    headers.accept = String(req.headers.accept);
  }
  if (req.headers["content-type"]) {
    headers["content-type"] = String(req.headers["content-type"]);
  }

  const stream = req.method === "POST" && url.pathname === "/api/run";
  const pathValue = `${url.pathname}${url.search || ""}`;
  const resultPromise = createBrokerRequestEntry(agent, {
    method: req.method,
    path: pathValue,
    headers,
    body,
    stream,
    res: stream ? res : null
  });

  if (stream) {
    await resultPromise.catch((error) => {
      if (!res.writableEnded) {
        sendJson(res, 504, { error: error.message });
      }
    });
    return;
  }

  const result = await resultPromise;
  const responseHeaders = {
    "Cache-Control": "no-store"
  };
  if (result.headers["content-type"]) {
    responseHeaders["Content-Type"] = result.headers["content-type"];
  }
  if (result.headers["content-disposition"]) {
    responseHeaders["Content-Disposition"] = result.headers["content-disposition"];
  }

  res.writeHead(result.statusCode, responseHeaders);
  res.end(result.bodyText);
}

function openBrowser(url) {
  if (!url) {
    return;
  }

  let command = "";
  let args = [];

  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

async function brokerFetchJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text().catch(() => "");
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(parsed.error || parsed.message || `HTTP ${response.status}`);
  }

  return parsed;
}

async function postBrokerStreamChunk(baseUrl, state, requestId, chunk) {
  await brokerFetchJson(`${baseUrl}/api/broker/agents/chunk`, {
    agentId: state.agentId,
    agentSecret: state.agentSecret,
    requestId,
    chunk
  });
}

async function postBrokerResult(baseUrl, state, payload) {
  await brokerFetchJson(`${baseUrl}/api/broker/agents/result`, {
    agentId: state.agentId,
    agentSecret: state.agentSecret,
    ...payload
  });
}

async function processBrokerRequest(baseUrl, state, request) {
  const targetUrl = `http://127.0.0.1:${state.localPort}${request.path}`;
  const requestHeaders = {};
  requestHeaders[BROKER_INTERNAL_REQUEST_HEADER] = "1";
  if (request.headers?.accept) {
    requestHeaders.Accept = request.headers.accept;
  }
  if (request.headers?.["content-type"]) {
    requestHeaders["Content-Type"] = request.headers["content-type"];
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: request.body !== undefined ? JSON.stringify(request.body) : undefined
    });

    const headers = {};
    if (response.headers.get("content-type")) {
      headers["content-type"] = response.headers.get("content-type");
    }
    if (response.headers.get("content-disposition")) {
      headers["content-disposition"] = response.headers.get("content-disposition");
    }

    if (request.stream || String(headers["content-type"] || "").toLowerCase().includes("text/event-stream")) {
      await postBrokerResult(baseUrl, state, {
        requestId: request.id,
        stream: true,
        started: true,
        statusCode: response.status,
        headers
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            await postBrokerStreamChunk(baseUrl, state, request.id, chunk);
          }
        }
      }

      await postBrokerResult(baseUrl, state, {
        requestId: request.id,
        stream: true,
        completed: true
      });
      return;
    }

    await postBrokerResult(baseUrl, state, {
      requestId: request.id,
      statusCode: response.status,
      headers,
      bodyText: await response.text()
    });
  } catch (error) {
    await postBrokerResult(baseUrl, state, {
      requestId: request.id,
      statusCode: 502,
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      bodyText: JSON.stringify({
        error: error.message
      })
    });
  }
}

async function runBrokerClientLoop() {
  const config = loadBrokerConfig();
  if (!config.enabled || SERVER_MODE !== "agent") {
    return;
  }

  const state = {
    ...loadBrokerState(),
    localPort: PORT
  };

  while (true) {
    try {
      const registration = await brokerFetchJson(`${config.uiBaseUrl}/api/broker/agents/register`, {
        agentId: state.agentId || "",
        agentSecret: state.agentSecret || "",
        machineName: process.env.COMPUTERNAME || os.hostname(),
        hostName: os.hostname(),
        platform: process.platform,
        localPort: PORT
      });

      state.agentId = registration.agentId;
      state.agentSecret = registration.agentSecret;
      saveBrokerState(state);

      if (config.autoOpenBrowser && registration.pairingUrl && !registration.bound && registration.pairingUrl !== brokerLastPairingUrl) {
        brokerLastPairingUrl = registration.pairingUrl;
        openBrowser(registration.pairingUrl);
      }

      const poll = await brokerFetchJson(`${config.uiBaseUrl}/api/broker/agents/poll`, {
        agentId: state.agentId,
        agentSecret: state.agentSecret
      });

      if (poll.request) {
        await processBrokerRequest(config.uiBaseUrl, state, poll.request);
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

function startBrokerClient() {
  if (brokerClientStarted) {
    return;
  }

  brokerClientStarted = true;
  runBrokerClientLoop().catch(() => {
    brokerClientStarted = false;
  });
}

module.exports = {
  BROKER_CONFIG_FILE,
  BROKER_INTERNAL_REQUEST_HEADER,
  getBrokerStatus,
  handleBrokerAgentChunk,
  handleBrokerAgentPoll,
  handleBrokerAgentRegister,
  handleBrokerAgentResult,
  handleBrokerConnectToken,
  isTrustedHostedUiRequest,
  loadBrokerConfig,
  proxyBrokerApiRequest,
  startBrokerClient
};
