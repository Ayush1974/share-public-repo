const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { DATA_DIR } = require("./config");
const {
  resolveAuthWorkbookFile,
  writeAuthWorkbook
} = require("./auth-workbook");

const ENV_AUTH_DATA_DIR = String(process.env.AUTH_DATA_DIR || process.env.OIDC_DATA_DIR || "").trim();
const DEFAULT_AUTH_DATA_DIR = DATA_DIR;
const LOCAL_APPDATA_AUTH_DATA_DIR = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "bug-rca-ui", "auth-data")
  : "";
const TEMP_AUTH_DATA_DIR = path.join(os.tmpdir(), "bug-rca-ui", "auth-data");
const FALLBACK_AUTH_DATA_DIR = path.join(os.homedir(), ".bug-rca-ui", "auth-data");
const AUTH_USER_RETENTION_DAYS = 3;
const AUTH_USER_RETENTION_MS = AUTH_USER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const LOCAL_ACCOUNT_PROVIDER = "Local Account";
const GENERIC_LOCAL_ACCOUNT_DISPLAY_NAME = "Oracle User";
const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;
const PASSWORD_HASH_SCHEME = "scrypt-v1";
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
};

let resolvedAuthDataDir = null;
let authWorkbookWatcherFiles = [];
let authWorkbookWatchers = [];
let authWorkbookSyncTimer = null;

function ensureWritableDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });

  const probeFile = path.join(dirPath, `.write-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`);
  fs.writeFileSync(probeFile, "ok");
  fs.unlinkSync(probeFile);
}

function ensureWritableFile(filePath, initialContent) {
  const parentDir = path.dirname(filePath);
  fs.mkdirSync(parentDir, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initialContent);
  }

  fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
}

function tryPrepareAuthDataDir(candidate) {
  if (!candidate) {
    return false;
  }

  const sessionsDir = path.join(candidate, "auth-sessions");
  const usersFile = path.join(candidate, "auth-users.json");

  ensureWritableDirectory(candidate);
  ensureWritableDirectory(sessionsDir);
  ensureWritableFile(usersFile, `${JSON.stringify({ users: {} }, null, 2)}\n`);
  return true;
}

function resolveAuthDataDir() {
  if (resolvedAuthDataDir) {
    return resolvedAuthDataDir;
  }

  const candidates = [
    ENV_AUTH_DATA_DIR,
    DEFAULT_AUTH_DATA_DIR,
    LOCAL_APPDATA_AUTH_DATA_DIR,
    TEMP_AUTH_DATA_DIR,
    FALLBACK_AUTH_DATA_DIR
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      tryPrepareAuthDataDir(candidate);
      resolvedAuthDataDir = candidate;
      return resolvedAuthDataDir;
    } catch (error) {
      // Try the next candidate.
    }
  }

  throw new Error("Unable to create a writable auth data directory.");
}

function resolveAuthSessionsDir() {
  return path.join(resolveAuthDataDir(), "auth-sessions");
}

function resolveAuthUsersFile() {
  return path.join(resolveAuthDataDir(), "auth-users.json");
}

function resolveLocalAccountsFile() {
  return path.join(resolveAuthDataDir(), "local-accounts.json");
}

function ensureAuthStorage() {
  tryPrepareAuthDataDir(resolveAuthDataDir());
  ensureWritableFile(resolveLocalAccountsFile(), `${JSON.stringify({ accounts: {} }, null, 2)}\n`);
  syncAuthWorkbook();
  ensureAuthWorkbookWatcher();
}

function sessionFilePath(sessionId) {
  return path.join(resolveAuthSessionsDir(), `${sessionId}.json`);
}

function readJsonIfPresent(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function readAuthUsersStoreSnapshot() {
  const store = readJsonIfPresent(resolveAuthUsersFile(), { retentionDays: AUTH_USER_RETENTION_DAYS, updatedAt: "", users: {} }) || {};
  return {
    retentionDays: AUTH_USER_RETENTION_DAYS,
    updatedAt: String(store.updatedAt || "").trim(),
    users: store.users && typeof store.users === "object" ? store.users : {}
  };
}

function readLocalAccountsStoreSnapshot() {
  const store = readJsonIfPresent(resolveLocalAccountsFile(), { updatedAt: "", accounts: {} }) || {};
  return {
    updatedAt: String(store.updatedAt || "").trim(),
    accounts: store.accounts && typeof store.accounts === "object" ? store.accounts : {}
  };
}

function syncAuthWorkbook() {
  try {
    return writeAuthWorkbook({
      filePath: resolveAuthWorkbookFile(resolveAuthDataDir()),
      authUsersStore: readAuthUsersStoreSnapshot(),
      localAccountsStore: readLocalAccountsStoreSnapshot()
    });
  } catch (error) {
    return null;
  }
}

function scheduleAuthWorkbookSync() {
  if (authWorkbookSyncTimer) {
    clearTimeout(authWorkbookSyncTimer);
  }

  authWorkbookSyncTimer = setTimeout(() => {
    authWorkbookSyncTimer = null;
    syncAuthWorkbook();
  }, 100);
}

function ensureAuthWorkbookWatcher() {
  const watchFiles = [resolveAuthUsersFile(), resolveLocalAccountsFile()];
  if (
    authWorkbookWatchers.length
    && authWorkbookWatcherFiles.length === watchFiles.length
    && authWorkbookWatcherFiles.every((filePath, index) => filePath === watchFiles[index])
  ) {
    return;
  }

  for (const watcher of authWorkbookWatchers) {
    try {
      watcher.close();
    } catch (error) {
      // Best-effort cleanup only.
    }
  }
  authWorkbookWatchers = [];
  authWorkbookWatcherFiles = [];

  try {
    authWorkbookWatchers = watchFiles.map((filePath) => {
      const watcher = fs.watch(filePath, { persistent: false }, () => {
        scheduleAuthWorkbookSync();
      });
      watcher.on("error", () => {
        authWorkbookWatchers = [];
        authWorkbookWatcherFiles = [];
      });
      return watcher;
    });
    authWorkbookWatcherFiles = watchFiles;
  } catch (error) {
    authWorkbookWatchers = [];
    authWorkbookWatcherFiles = [];
  }
}

function authUserKey(user = {}) {
  return String(user.subject || user.email || user.username || "").trim();
}

function createAuthSession(user, sessionTtlHours) {
  ensureAuthStorage();
  const sessionId = crypto.randomBytes(24).toString("hex");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + sessionTtlHours * 60 * 60 * 1000).toISOString();
  const session = {
    id: sessionId,
    createdAt,
    expiresAt,
    user
  };

  writeJson(sessionFilePath(sessionId), session);
  return session;
}

function getAuthSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const session = readJsonIfPresent(sessionFilePath(sessionId));
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    deleteAuthSession(sessionId);
    return null;
  }

  return session;
}

function deleteAuthSession(sessionId) {
  try {
    fs.unlinkSync(sessionFilePath(sessionId));
  } catch (error) {
    // Best-effort cleanup only.
  }
}

function readAuthUsersStore() {
  ensureAuthStorage();
  return readAuthUsersStoreSnapshot();
}

function writeAuthUsersStore(store) {
  const payload = {
    retentionDays: AUTH_USER_RETENTION_DAYS,
    updatedAt: new Date().toISOString(),
    users: store.users || {}
  };
  fs.writeFileSync(resolveAuthUsersFile(), `${JSON.stringify(payload)}\n`);
  syncAuthWorkbook();
  return payload;
}

function pruneAuthUsersStore(store) {
  const nextStore = {
    retentionDays: AUTH_USER_RETENTION_DAYS,
    updatedAt: new Date().toISOString(),
    users: {}
  };
  const cutoff = Date.now() - AUTH_USER_RETENTION_MS;

  for (const [key, record] of Object.entries(store.users || {})) {
    const updatedAt = new Date(record?.lastLoginAt || record?.updatedAt || record?.firstLoginAt || 0).getTime();
    if (Number.isFinite(updatedAt) && updatedAt >= cutoff) {
      nextStore.users[key] = record;
    }
  }

  return nextStore;
}

function compactStoredUser(user, existing = {}) {
  const now = new Date().toISOString();
  return {
    subject: user.subject || existing.subject || "",
    username: user.username || existing.username || "",
    displayName: user.displayName || existing.displayName || "",
    email: user.email || existing.email || "",
    employeeId: user.employeeId || existing.employeeId || "",
    givenName: user.givenName || existing.givenName || "",
    familyName: user.familyName || existing.familyName || "",
    groups: Array.isArray(user.groups) ? user.groups : Array.isArray(existing.groups) ? existing.groups : [],
    roles: Array.isArray(user.roles) ? user.roles : Array.isArray(existing.roles) ? existing.roles : [],
    provider: user.provider || existing.provider || "",
    issuer: user.issuer || existing.issuer || "",
    firstLoginAt: existing.firstLoginAt || now,
    lastLoginAt: now
  };
}

function buildConciseUserProfile(claims = {}) {
  const groups = Array.isArray(claims.groups) ? claims.groups.map((value) => String(value).trim()).filter(Boolean) : [];
  const roles = Array.isArray(claims.roles) ? claims.roles.map((value) => String(value).trim()).filter(Boolean) : [];

  return {
    subject: String(claims.sub || "").trim(),
    username: String(claims.preferred_username || claims.username || claims.upn || claims.email || "").trim(),
    displayName: String(claims.name || `${claims.given_name || ""} ${claims.family_name || ""}`).trim(),
    email: String(claims.email || "").trim(),
    employeeId: String(claims.employeeNumber || claims.employee_id || claims.oracleGuid || claims.oracle_guid || "").trim(),
    givenName: String(claims.given_name || "").trim(),
    familyName: String(claims.family_name || "").trim(),
    groups,
    roles
  };
}

function upsertAuthUser(user) {
  ensureAuthStorage();
  const key = authUserKey(user);
  if (!key) {
    return null;
  }

  const store = pruneAuthUsersStore(readAuthUsersStore());
  const existing = store.users[key] || {};
  store.users[key] = compactStoredUser(user, existing);
  writeAuthUsersStore(store);
  return key;
}

function clearAuthUserData(user) {
  ensureAuthStorage();
  const key = authUserKey(user);
  if (!key) {
    return { cleared: false, deletedSessions: 0 };
  }

  const store = pruneAuthUsersStore(readAuthUsersStore());
  delete store.users[key];
  writeAuthUsersStore(store);

  let deletedSessions = 0;
  const sessionsDir = resolveAuthSessionsDir();
  const sessionFiles = fs.existsSync(sessionsDir)
    ? fs.readdirSync(sessionsDir).filter((fileName) => fileName.endsWith(".json"))
    : [];

  for (const fileName of sessionFiles) {
    const filePath = path.join(sessionsDir, fileName);
    const session = readJsonIfPresent(filePath);
    if (!session?.user || authUserKey(session.user) !== key) {
      continue;
    }

    try {
      fs.unlinkSync(filePath);
      deletedSessions += 1;
    } catch (error) {
      // Best-effort cleanup only.
    }
  }

  return {
    cleared: true,
    deletedSessions
  };
}

function getAuthUserRetentionDays() {
  return AUTH_USER_RETENTION_DAYS;
}

function normalizeLocalAccountEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readLocalAccountsStore() {
  ensureAuthStorage();
  return readLocalAccountsStoreSnapshot();
}

function writeLocalAccountsStore(store) {
  const payload = {
    updatedAt: new Date().toISOString(),
    accounts: store.accounts || {}
  };
  fs.writeFileSync(resolveLocalAccountsFile(), `${JSON.stringify(payload)}\n`);
  syncAuthWorkbook();
  return payload;
}

function buildGenericLocalAccountProfile(email) {
  const normalizedEmail = normalizeLocalAccountEmail(email);
  return {
    subject: `local:${normalizedEmail}`,
    username: normalizedEmail,
    email: normalizedEmail,
    displayName: GENERIC_LOCAL_ACCOUNT_DISPLAY_NAME,
    givenName: "",
    familyName: ""
  };
}

function normalizeLocalAccountName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function splitDisplayName(displayName) {
  const normalized = normalizeLocalAccountName(displayName);
  if (!normalized) {
    return {
      givenName: "",
      familyName: ""
    };
  }

  const parts = normalized.split(" ");
  return {
    givenName: parts[0] || "",
    familyName: parts.slice(1).join(" ")
  };
}

function createScryptPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password || ""), salt, SCRYPT_KEY_LENGTH, SCRYPT_COST).toString("hex");
  return {
    scheme: PASSWORD_HASH_SCHEME,
    salt,
    hash,
    keyLength: SCRYPT_KEY_LENGTH,
    cost: {
      N: SCRYPT_COST.N,
      r: SCRYPT_COST.r,
      p: SCRYPT_COST.p
    }
  };
}

function verifyScryptPassword(password, salt, expectedHash, keyLength = SCRYPT_KEY_LENGTH, cost = SCRYPT_COST) {
  const actual = Buffer.from(
    crypto.scryptSync(String(password || ""), salt, keyLength, {
      N: Number(cost?.N || SCRYPT_COST.N),
      r: Number(cost?.r || SCRYPT_COST.r),
      p: Number(cost?.p || SCRYPT_COST.p),
      maxmem: Number(cost?.maxmem || SCRYPT_COST.maxmem)
    }).toString("hex"),
    "hex"
  );
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

function verifyStoredPasswordRecord(account, password) {
  if (account?.password?.scheme === PASSWORD_HASH_SCHEME) {
    return verifyScryptPassword(
      password,
      account.password.salt,
      account.password.hash,
      Number(account.password.keyLength || SCRYPT_KEY_LENGTH),
      {
        ...SCRYPT_COST,
        ...(account.password.cost || {})
      }
    );
  }

  if (account?.passwordSalt && account?.passwordHash) {
    return verifyScryptPassword(password, account.passwordSalt, account.passwordHash);
  }

  return false;
}

function extractPasswordTokens(displayName, email) {
  const tokens = new Set();
  for (const rawValue of [displayName, email, String(email || "").split("@")[0]]) {
    const normalized = String(rawValue || "").toLowerCase();
    for (const token of normalized.split(/[^a-z0-9]+/).filter((part) => part.length >= 3)) {
      tokens.add(token);
    }
  }
  return [...tokens];
}

function evaluateLocalPassword(password, profile = {}) {
  const candidate = String(password || "");
  const tokens = extractPasswordTokens(profile.displayName, profile.email);
  const normalizedCandidate = candidate.toLowerCase();
  const checks = {
    length: candidate.length >= 8,
    uppercase: /[A-Z]/.test(candidate),
    lowercase: /[a-z]/.test(candidate),
    number: /\d/.test(candidate),
    special: PASSWORD_SPECIAL_CHARACTER_PATTERN.test(candidate),
    personalInfo: !tokens.some((token) => normalizedCandidate.includes(token))
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  let label = "Weak";
  if (passedCount >= 6) {
    label = "Strong";
  } else if (passedCount >= 4) {
    label = "Medium";
  }

  return {
    score: passedCount,
    label,
    checks,
    valid: checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special && checks.personalInfo
  };
}

function sanitizeLocalAccount(account) {
  if (!account) {
    return null;
  }

  const genericProfile = buildGenericLocalAccountProfile(account.email || account.username || "");
  const displayName = normalizeLocalAccountName(account.displayName || genericProfile.displayName);
  const splitName = splitDisplayName(displayName);

  return {
    subject: genericProfile.subject,
    username: genericProfile.username,
    displayName,
    email: genericProfile.email,
    employeeId: "",
    givenName: account.givenName || splitName.givenName,
    familyName: account.familyName || splitName.familyName,
    groups: [],
    roles: ["registered-user"],
    provider: LOCAL_ACCOUNT_PROVIDER,
    issuer: "local",
    registeredAt: account.registeredAt || "",
    lastLoginAt: account.lastLoginAt || ""
  };
}

function createLocalAccount(payload = {}) {
  ensureAuthStorage();

  const displayName = normalizeLocalAccountName(payload.name || payload.displayName);
  const email = normalizeLocalAccountEmail(payload.email);
  const password = String(payload.password || "");

  if (!displayName) {
    throw new Error("Name is required.");
  }

  if (!email) {
    throw new Error("Oracle email is required.");
  }

  if (!/@oracle\.com$/i.test(email)) {
    throw new Error("Use a valid Oracle email address.");
  }

  const passwordEvaluation = evaluateLocalPassword(password, {
    displayName,
    email
  });
  if (!passwordEvaluation.valid) {
    throw new Error("Password must be 8+ characters and include uppercase, lowercase, number, special character, and no personal details.");
  }

  const store = readLocalAccountsStore();
  if (store.accounts[email]) {
    throw new Error("An account already exists for this Oracle email.");
  }

  const genericProfile = buildGenericLocalAccountProfile(email);
  const splitName = splitDisplayName(displayName);
  const now = new Date().toISOString();
  const account = {
    subject: genericProfile.subject,
    username: genericProfile.username,
    email: genericProfile.email,
    displayName,
    givenName: splitName.givenName,
    familyName: splitName.familyName,
    password: createScryptPasswordRecord(password),
    registeredAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  store.accounts[email] = account;
  writeLocalAccountsStore(store);
  return sanitizeLocalAccount(account);
}

function authenticateLocalAccount(loginId, password) {
  ensureAuthStorage();

  const normalizedLoginId = normalizeLocalAccountEmail(loginId);
  const normalizedPassword = String(password || "");
  if (!normalizedLoginId || !normalizedPassword) {
    throw new Error("Enter both login id and password.");
  }

  const store = readLocalAccountsStore();
  const account = store.accounts[normalizedLoginId];
  if (!account || !verifyStoredPasswordRecord(account, normalizedPassword)) {
    throw new Error("Invalid login id or password.");
  }

  const nextAccount = {
    ...account,
    password: account.password?.scheme === PASSWORD_HASH_SCHEME ? account.password : createScryptPasswordRecord(normalizedPassword),
    passwordSalt: undefined,
    passwordHash: undefined,
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.accounts[normalizedLoginId] = nextAccount;
  writeLocalAccountsStore(store);
  return sanitizeLocalAccount(nextAccount);
}

module.exports = {
  AUTH_USER_RETENTION_DAYS,
  LOCAL_ACCOUNT_PROVIDER,
  authenticateLocalAccount,
  buildConciseUserProfile,
  clearAuthUserData,
  createLocalAccount,
  createAuthSession,
  deleteAuthSession,
  evaluateLocalPassword,
  ensureAuthStorage,
  getAuthSession,
  getAuthUserRetentionDays,
  resolveAuthDataDir,
  resolveAuthWorkbookFile,
  resolveLocalAccountsFile,
  resolveAuthSessionsDir,
  resolveAuthUsersFile,
  syncAuthWorkbook,
  upsertAuthUser
};
