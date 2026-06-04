const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(APP_ROOT, "public");
const DATA_DIR = path.join(APP_ROOT, "data");
const SESSIONS_DIR = path.join(DATA_DIR, "sessions");
const RUNTIME_DIR = path.join(DATA_DIR, "runtime");
const CODEX_OUTPUT_DIR = path.join(RUNTIME_DIR, "codex-output");
const REMOTE_WORKSPACE_RUNS_DIR = path.join(RUNTIME_DIR, "remote-workspaces");

function readPositiveMs(value, fallback, minimum = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < minimum) {
    return fallback;
  }
  return numeric;
}

function resolveDefaultCodexBin() {
  if (process.env.CODEX_BIN) {
    return process.env.CODEX_BIN;
  }

  if (process.platform !== "win32") {
    return "codex";
  }

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const codexBinRoot = path.join(localAppData, "OpenAI", "Codex", "bin");
  const candidates = [];

  if (fs.existsSync(codexBinRoot)) {
    try {
      const versionedBins = fs
        .readdirSync(codexBinRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const filePath = path.join(codexBinRoot, entry.name, "codex.exe");
          if (!fs.existsSync(filePath)) {
            return null;
          }
          return {
            filePath,
            mtimeMs: fs.statSync(filePath).mtimeMs
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

      versionedBins.forEach((entry) => candidates.push(entry.filePath));
    } catch (error) {
      // Fall through to the stable app-local and npm shim locations.
    }
  }

  candidates.push(
    path.join(codexBinRoot, "codex.exe"),
    path.join(appData, "npm", "codex.cmd"),
    path.join(os.homedir(), "AppData", "Roaming", "npm", "codex.cmd")
  );

  return candidates.find((candidate) => fs.existsSync(candidate)) || "codex.cmd";
}

const PORT = Number(process.env.PORT || 3210);
const HOST = process.env.HOST || "127.0.0.1";
const SERVER_MODE = ["combined", "agent", "ui"].includes(String(process.env.RCA_SERVER_MODE || "").trim().toLowerCase())
  ? String(process.env.RCA_SERVER_MODE || "").trim().toLowerCase()
  : "combined";
const SERVE_AGENT_API = SERVER_MODE !== "ui";
const SERVE_UI = SERVER_MODE !== "agent";
const CODEX_BIN = resolveDefaultCodexBin();
const DEFAULT_MODEL = process.env.CODEX_MODEL || "";
const CODEX_FULL_ACCESS = String(process.env.CODEX_FULL_ACCESS || "true").trim().toLowerCase() !== "false";
const REQUIRE_ELEVATED_EXECUTION = String(process.env.REQUIRE_ELEVATED_EXECUTION || "true").trim().toLowerCase() !== "false";
const WINDOWS_LAUNCHER = path.join(APP_ROOT, "start-agent.cmd");
const UNIX_LAUNCHER = path.join(APP_ROOT, "start-agent.sh");
const SKILL_NAME = "$simphony-bug-rca-pipeline";
const BUNDLED_SKILLS_DIR = path.join(APP_ROOT, "skills");
const FALLBACK_SKILLS_DIR = path.join(os.homedir(), ".codex", "skills");
const CODEX_SKILLS_DIR =
  process.env.CODEX_SKILLS_DIR
  || (fs.existsSync(path.join(BUNDLED_SKILLS_DIR, "simphony-bug-rca-pipeline")) ? BUNDLED_SKILLS_DIR : FALLBACK_SKILLS_DIR);
const SKILL_ROOT = path.join(CODEX_SKILLS_DIR, "simphony-bug-rca-pipeline");
const AGENT_CONFIG = path.join(SKILL_ROOT, "agents", "openai.yaml");
const MAX_BODY_SIZE = Number(process.env.MAX_BODY_SIZE || 1024 * 1024);
const RCA_HEARTBEAT_INTERVAL_MS = readPositiveMs(process.env.RCA_HEARTBEAT_INTERVAL_MS, 15000, 5000);
const RCA_SILENCE_WARNING_MS = readPositiveMs(process.env.RCA_SILENCE_WARNING_MS, 45000, 15000);
const RCA_MAX_SILENCE_MS = readPositiveMs(process.env.RCA_MAX_SILENCE_MS, 300000, RCA_SILENCE_WARNING_MS);
const PRODUCT_CATALOG_FILE = path.resolve(process.env.RCA_PRODUCT_CATALOG_FILE || path.join(APP_ROOT, "product-catalog.json"));
const DEFAULT_SHARED_SIMPHONY_WORKSPACE = "C:\\simphony\\temp";
const DEFAULT_SHARED_SIMPHONY_ROOT_ID = "simphony";
const DEFAULT_SHARED_SIMPHONY_ROOT_ALIASES = ["simphony-temp"];

const DEFAULT_PRODUCT_OPTIONS = [
  {
    key: "simphony",
    label: "Simphony",
    family: "Oracle Restaurants Simphony",
    defaultWorkspace: process.env.SIMPHONY_WORKSPACE || "",
    usesSkill: true,
    skillName: SKILL_NAME
  },
  {
    key: "rna",
    label: "R&A",
    family: "Oracle Restaurants Reporting and Analytics",
    defaultWorkspace: process.env.RNA_WORKSPACE || "",
    usesSkill: false
  },
  {
    key: "flm",
    label: "FLM",
    family: "Oracle Restaurants Front Line Manager",
    defaultWorkspace: process.env.FLM_WORKSPACE || "",
    usesSkill: false
  }
];

function slugifyProductKey(value, fallback = "product") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function normalizeProductOption(rawProduct, index) {
  if (!rawProduct || typeof rawProduct !== "object") {
    return null;
  }

  const family = String(rawProduct.family || rawProduct.label || rawProduct.name || rawProduct.key || "").trim();
  if (!family) {
    return null;
  }

  const label = String(rawProduct.label || rawProduct.name || family).trim();
  const key = slugifyProductKey(rawProduct.key || label || family, `product-${index + 1}`);
  const defaultWorkspace = String(rawProduct.defaultWorkspace || rawProduct.workspace || "").trim();
  const skillName = String(rawProduct.skillName || "").trim();
  const usesSkill = Boolean(rawProduct.usesSkill) || Boolean(skillName);

  return {
    key,
    label,
    family,
    defaultWorkspace,
    usesSkill,
    skillName: usesSkill ? skillName || SKILL_NAME : ""
  };
}

function loadProductOptions() {
  let catalogSource = DEFAULT_PRODUCT_OPTIONS;

  if (fs.existsSync(PRODUCT_CATALOG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(PRODUCT_CATALOG_FILE, "utf8"));
      if (Array.isArray(parsed)) {
        catalogSource = parsed;
      } else if (Array.isArray(parsed?.products)) {
        catalogSource = parsed.products;
      } else {
        console.warn(`Ignoring ${PRODUCT_CATALOG_FILE} because it does not contain a product array.`);
      }
    } catch (error) {
      console.warn(`Failed to read ${PRODUCT_CATALOG_FILE}: ${error.message}`);
    }
  }

  const normalizedProducts = {};
  catalogSource.forEach((rawProduct, index) => {
    const product = normalizeProductOption(rawProduct, index);
    if (product) {
      normalizedProducts[product.key] = product;
    }
  });

  if (!Object.keys(normalizedProducts).length) {
    normalizedProducts.generic = {
      key: "generic",
      label: "Generic",
      family: "Oracle Restaurants Product",
      defaultWorkspace: "",
      usesSkill: false,
      skillName: ""
    };
  }

  return normalizedProducts;
}

const PRODUCT_OPTIONS = loadProductOptions();
const PRODUCT_LIST = Object.values(PRODUCT_OPTIONS);

function normalizeSharedWorkspaceOption(rawWorkspace, index) {
  if (!rawWorkspace || typeof rawWorkspace !== "object") {
    return null;
  }

  const rootPath = String(rawWorkspace.rootPath || rawWorkspace.path || "").trim();
  if (!rootPath) {
    return null;
  }

  let id = slugifyProductKey(rawWorkspace.id || rawWorkspace.key || rawWorkspace.label || path.basename(rootPath), `shared-root-${index + 1}`);
  const aliasCandidates = [];
  if (Array.isArray(rawWorkspace.aliases)) {
    aliasCandidates.push(...rawWorkspace.aliases);
  } else if (typeof rawWorkspace.aliases === "string") {
    aliasCandidates.push(...rawWorkspace.aliases.split(","));
  }
  const productKey = String(rawWorkspace.productKey || "").trim().toLowerCase();
  if (productKey === "simphony") {
    if (DEFAULT_SHARED_SIMPHONY_ROOT_ALIASES.includes(id)) {
      id = DEFAULT_SHARED_SIMPHONY_ROOT_ID;
    }
    if (id === DEFAULT_SHARED_SIMPHONY_ROOT_ID) {
      aliasCandidates.push(...DEFAULT_SHARED_SIMPHONY_ROOT_ALIASES);
    }
  }
  const aliases = [...new Set(
    aliasCandidates
      .map((alias) => slugifyProductKey(alias, ""))
      .filter((alias) => alias && alias !== id)
  )];
  return {
    id,
    label: String(rawWorkspace.label || rawWorkspace.name || id).trim(),
    rootPath: path.resolve(rootPath),
    productKey,
    aliases
  };
}

function registerSharedWorkspaceOption(configured, workspace) {
  configured[workspace.id] = workspace;
  for (const alias of workspace.aliases || []) {
    configured[alias] = workspace;
  }
}

function loadSharedWorkspaceOptions() {
  const configured = {};
  const rawConfig = String(process.env.SHARED_WORKSPACE_ROOTS || "").trim();
  const candidates = [];

  if (rawConfig) {
    try {
      const parsed = JSON.parse(rawConfig);
      if (Array.isArray(parsed)) {
        candidates.push(...parsed);
      } else if (Array.isArray(parsed?.roots)) {
        candidates.push(...parsed.roots);
      }
    } catch (error) {
      rawConfig
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          const [keyPart, pathPart] = item.split("=", 2);
          if (!keyPart || !pathPart) {
            return;
          }
          candidates.push({
            id: keyPart.trim(),
            label: keyPart.trim(),
            rootPath: pathPart.trim()
          });
        });
    }
  } else if (fs.existsSync(DEFAULT_SHARED_SIMPHONY_WORKSPACE)) {
    candidates.push({
      id: DEFAULT_SHARED_SIMPHONY_ROOT_ID,
      aliases: DEFAULT_SHARED_SIMPHONY_ROOT_ALIASES,
      label: "Simphony Shared Workspace",
      rootPath: DEFAULT_SHARED_SIMPHONY_WORKSPACE,
      productKey: "simphony"
    });
  }

  candidates.forEach((rawWorkspace, index) => {
    const workspace = normalizeSharedWorkspaceOption(rawWorkspace, index);
    if (workspace && fs.existsSync(workspace.rootPath)) {
      registerSharedWorkspaceOption(configured, workspace);
    }
  });

  return configured;
}

const SHARED_WORKSPACE_OPTIONS = loadSharedWorkspaceOptions();
const SHARED_WORKSPACE_LIST = Object.values(SHARED_WORKSPACE_OPTIONS)
  .filter((workspace, index, collection) => collection.findIndex((candidate) => candidate.id === workspace.id) === index);

const ARTIFACT_FILES = {
  aiToolInstruction: path.join(APP_ROOT, "aitoolinstruction.md"),
  newToolInstruction: path.join(APP_ROOT, "newtoolinstruction.md"),
  error: path.join(APP_ROOT, "error.md")
};

const MCP_CONFIG_FILE = path.join(APP_ROOT, "mcp-servers.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};

const SPA_ROUTES = new Set([
  "/",
  "/home",
  "/root-cause-report",
  "/session-history",
  "/tool-memory"
]);

module.exports = {
  AGENT_CONFIG,
  APP_ROOT,
  ARTIFACT_FILES,
  BUNDLED_SKILLS_DIR,
  CODEX_BIN,
  CODEX_FULL_ACCESS,
  CODEX_OUTPUT_DIR,
  CODEX_SKILLS_DIR,
  DATA_DIR,
  DEFAULT_MODEL,
  FALLBACK_SKILLS_DIR,
  HOST,
  MAX_BODY_SIZE,
  MCP_CONFIG_FILE,
  MIME_TYPES,
  PORT,
  PRODUCT_CATALOG_FILE,
  PRODUCT_LIST,
  PRODUCT_OPTIONS,
  PUBLIC_DIR,
  RCA_HEARTBEAT_INTERVAL_MS,
  RCA_MAX_SILENCE_MS,
  RCA_SILENCE_WARNING_MS,
  REQUIRE_ELEVATED_EXECUTION,
  REMOTE_WORKSPACE_RUNS_DIR,
  RUNTIME_DIR,
  SHARED_WORKSPACE_LIST,
  SHARED_WORKSPACE_OPTIONS,
  SERVER_MODE,
  SESSIONS_DIR,
  SERVE_AGENT_API,
  SERVE_UI,
  SKILL_NAME,
  SKILL_ROOT,
  SPA_ROUTES,
  UNIX_LAUNCHER,
  WINDOWS_LAUNCHER
};
