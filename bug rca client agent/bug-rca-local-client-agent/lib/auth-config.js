const fs = require("fs");
const path = require("path");

const { APP_ROOT } = require("./config");

const AUTH_CONFIG_FILE = path.join(APP_ROOT, "auth-config.json");

const DEFAULT_AUTH_CONFIG = {
  authMode: "local",
  enabled: false,
  providerName: "Oracle SSO",
  issuer: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  postLogoutRedirectUri: "",
  registrationUrl: "",
  supportUrl: "",
  scope: "openid profile email",
  cookieSecret: "",
  sessionTtlHours: 12
};

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim().toLowerCase() === "true";
}

function readAuthConfigFile() {
  try {
    const parsed = JSON.parse(fs.readFileSync(AUTH_CONFIG_FILE, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function normalizeHours(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

function normalizeAuthMode(value, enabledFallback) {
  const candidate = String(value || "").trim().toLowerCase();
  if (candidate === "local" || candidate === "oracle-sso" || candidate === "hybrid") {
    return candidate;
  }

  return enabledFallback ? "oracle-sso" : DEFAULT_AUTH_CONFIG.authMode;
}

function normalizeAuthConfig(config) {
  const enabled = parseBoolean(config.enabled, DEFAULT_AUTH_CONFIG.enabled);
  return {
    authMode: normalizeAuthMode(config.authMode, enabled),
    enabled,
    providerName: String(config.providerName || DEFAULT_AUTH_CONFIG.providerName).trim() || DEFAULT_AUTH_CONFIG.providerName,
    issuer: String(config.issuer || "").trim().replace(/\/+$/, ""),
    clientId: String(config.clientId || "").trim(),
    clientSecret: String(config.clientSecret || "").trim(),
    redirectUri: String(config.redirectUri || "").trim(),
    postLogoutRedirectUri: String(config.postLogoutRedirectUri || "").trim(),
    registrationUrl: String(config.registrationUrl || "").trim(),
    supportUrl: String(config.supportUrl || "").trim(),
    scope: String(config.scope || DEFAULT_AUTH_CONFIG.scope).trim() || DEFAULT_AUTH_CONFIG.scope,
    cookieSecret: String(config.cookieSecret || "").trim(),
    sessionTtlHours: normalizeHours(config.sessionTtlHours, DEFAULT_AUTH_CONFIG.sessionTtlHours)
  };
}

function getAuthConfig() {
  const fileConfig = readAuthConfigFile();
  const rawEnvConfig = {
    authMode: process.env.AUTH_MODE || process.env.OIDC_AUTH_MODE,
    enabled: process.env.OIDC_ENABLED,
    providerName: process.env.OIDC_PROVIDER_NAME,
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
    registrationUrl: process.env.OIDC_REGISTRATION_URL,
    supportUrl: process.env.OIDC_SUPPORT_URL,
    scope: process.env.OIDC_SCOPE,
    cookieSecret: process.env.OIDC_COOKIE_SECRET,
    sessionTtlHours: process.env.OIDC_SESSION_TTL_HOURS
  };
  const envConfig = Object.fromEntries(
    Object.entries(rawEnvConfig).filter(([, value]) => value !== undefined)
  );

  return normalizeAuthConfig({
    ...DEFAULT_AUTH_CONFIG,
    ...fileConfig,
    ...envConfig
  });
}

function getAuthState() {
  const config = getAuthConfig();
  const localAuthEnabled = config.authMode === "local" || config.authMode === "hybrid";
  const oidcEnabled = (config.authMode === "oracle-sso" || config.authMode === "hybrid") && config.enabled;
  const missingFields = [];

  if (oidcEnabled) {
    for (const [field, label] of [
      ["issuer", "issuer"],
      ["clientId", "clientId"],
      ["clientSecret", "clientSecret"],
      ["redirectUri", "redirectUri"],
      ["cookieSecret", "cookieSecret"]
    ]) {
      if (!config[field]) {
        missingFields.push(label);
      }
    }
  }

  return {
    ...config,
    enabled: oidcEnabled,
    localAuthEnabled,
    configured: !oidcEnabled || missingFields.length === 0,
    missingFields
  };
}

function ensureAuthConfigFile() {
  if (fs.existsSync(AUTH_CONFIG_FILE)) {
    return;
  }

  fs.writeFileSync(AUTH_CONFIG_FILE, `${JSON.stringify(DEFAULT_AUTH_CONFIG, null, 2)}\n`);
}

module.exports = {
  AUTH_CONFIG_FILE,
  DEFAULT_AUTH_CONFIG,
  ensureAuthConfigFile,
  getAuthConfig,
  getAuthState
};
