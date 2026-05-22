#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..", "..");
const defaultEnvFileName = resolveOptionValue(process.argv.slice(2), "--env-file") || ".env";
require(path.join(appDir, "lib", "env-file")).loadEnvFile({ baseDir: appDir, fileName: defaultEnvFileName });

const TARGETS = {
  gbu: {
    label: "gbujira",
    envVarName: "GBUJIRA_PERSONAL_TOKEN",
    baseUrl: "https://gbujira.oraclecorp.com/"
  },
  gbujira: {
    label: "gbujira",
    envVarName: "GBUJIRA_PERSONAL_TOKEN",
    baseUrl: "https://gbujira.oraclecorp.com/"
  },
  central: {
    label: "central",
    envVarName: "JIRA_CENTRAL_PERSONAL_TOKEN",
    baseUrl: "https://jira.oraclecorp.com/jira"
  },
  oci: {
    label: "oci",
    envVarName: "JIRA_OCI_PERSONAL_TOKEN",
    baseUrl: "https://jira.oci.oraclecorp.com/"
  }
};

function resolveOptionValue(argv, flagName) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === flagName) {
      return argv[index + 1] || "";
    }
    if (value.startsWith(`${flagName}=`)) {
      return value.slice(flagName.length + 1);
    }
  }
  return "";
}

function parseArgs(argv) {
  const options = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      options._.push(value);
      continue;
    }

    if (value === "--help") {
      options.help = true;
      continue;
    }

    const equalsIndex = value.indexOf("=");
    if (equalsIndex >= 0) {
      options[value.slice(2, equalsIndex)] = value.slice(equalsIndex + 1);
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
      continue;
    }

    options[key] = true;
  }

  return options;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage:",
      "  node ./scripts/rotate-jira-pat.js [options]",
      "",
      "Options:",
      "  --target <gbujira|central|oci>        Target Jira profile. Default: gbujira",
      "  --env-var <NAME>                      Override the env var to update",
      "  --base-url <URL>                      Override the Jira base URL",
      "  --env-file <FILE>                     Env file to read and update. Default: .env",
      "  --name <TOKEN_NAME>                   Jira PAT name to create",
      "  --expiration-days <N>                 PAT lifetime in days. Default: 5",
      "  --auth-token <TOKEN>                  Existing PAT to authenticate the create call",
      "  --auth-token-env <NAME>               Env var that contains the auth PAT",
      "  --basic-user <USERNAME>               Use basic auth instead of PAT auth",
      "  --basic-password-env <NAME>           Env var that contains the basic-auth password",
      "  --only-when-expiring-within-days <N>  Skip rotation until local metadata is inside this window",
      "  --current-token-expires-at <ISO>      Seed local expiry metadata for the current token",
      "  --keep-previous                       Do not auto-revoke the previous PAT after rotation",
      "  --metadata-file <FILE>                Override metadata file path",
      "  --dry-run                             Validate inputs without calling Jira or changing files",
      "  --help                                Show this help",
      "",
      "Examples:",
      "  npm run jira:rotate:gbu",
      "  npm run jira:rotate:gbu -- --only-when-expiring-within-days 1 --current-token-expires-at 2026-05-05T11:54:36+05:30",
      "  node ./scripts/rotate-jira-pat.js --target gbujira --basic-user ayush.mishra --basic-password-env GBUJIRA_PASSWORD"
    ].join("\n") + "\n"
  );
}

function readTrimmedEnv(name) {
  return String(process.env[name] || "").trim();
}

function normalizeTarget(targetName) {
  return String(targetName || "gbujira").trim().toLowerCase();
}

function toPositiveInteger(rawValue, optionName) {
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

function ensureAbsolutePath(candidatePath) {
  if (path.isAbsolute(candidatePath)) {
    return candidatePath;
  }
  return path.join(appDir, candidatePath);
}

function toIsoTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function buildTokenName(label, explicitName) {
  if (explicitName) {
    if (explicitName.length > 40) {
      throw new Error("Jira PAT names are capped at 40 characters.");
    }
    return explicitName;
  }

  const now = new Date();
  const compactTimestamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("")
    + "-"
    + [
      String(now.getUTCHours()).padStart(2, "0"),
      String(now.getUTCMinutes()).padStart(2, "0"),
      String(now.getUTCSeconds()).padStart(2, "0")
    ].join("");

  return `${label}-pat-${compactTimestamp}`;
}

function fingerprintToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex").slice(0, 12);
}

function readMetadata(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

function writeMetadata(filePath, metadata) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateEnvFileValue(filePath, key, value) {
  const existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const normalized = existingContent.replace(/\r\n/g, "\n");
  const lines = normalized ? normalized.split("\n") : [];
  const pattern = new RegExp(`^(\\s*(?:export\\s+)?${escapeRegExp(key)}\\s*=).*?$`);
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (replaced || line.trim().startsWith("#")) {
      return line;
    }
    if (!pattern.test(line)) {
      return line;
    }
    replaced = true;
    return line.replace(pattern, `$1${value}`);
  });

  if (!replaced) {
    while (nextLines.length && nextLines[nextLines.length - 1] === "") {
      nextLines.pop();
    }
    nextLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, `${nextLines.join("\n")}\n`, "utf8");
}

function parseExpiry(rawValue, optionName) {
  const parsed = new Date(String(rawValue || "").trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${optionName} must be an ISO-8601 timestamp.`);
  }
  return parsed;
}

function findTokenValue(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const exactKeys = new Set([
    "token",
    "pat",
    "personalaccesstoken",
    "rawtoken",
    "tokenvalue",
    "pattoken"
  ]);
  const queue = [payload];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (typeof value === "string" && exactKeys.has(normalizedKey)) {
        return value.trim();
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return "";
}

function findExpiryValue(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const queue = [payload];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "string" && /(expir|expires|expiry)/i.test(key)) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return "";
}

function formatDaysRemaining(expiryIso) {
  const ms = new Date(expiryIso).getTime() - Date.now();
  return (ms / 86400000).toFixed(2);
}

function buildEndpoint(baseUrl) {
  return new URL("/rest/pat/latest/tokens", baseUrl).toString();
}

async function listPats({ endpoint, headers }) {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: headers.Authorization,
      Accept: "application/json"
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Jira PAT list call failed with HTTP ${response.status}.`);
  }

  const payload = JSON.parse(text);
  if (!Array.isArray(payload)) {
    throw new Error("Jira PAT list call did not return an array.");
  }

  return payload;
}

async function deletePat({ baseUrl, token, patId }) {
  const response = await fetch(new URL(`/rest/pat/latest/tokens/${patId}`, baseUrl).toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Jira PAT delete call failed with HTTP ${response.status}.${text ? ` Body: ${text}` : ""}`);
  }
}

function resolvePreviousPatCandidate(tokens, metadata) {
  if (!Array.isArray(tokens) || !tokens.length) {
    return { candidate: null, reason: "No existing PATs were listed before rotation." };
  }

  if (metadata && metadata.tokenName) {
    const currentName = String(metadata.tokenName).trim();
    const matches = tokens.filter((entry) => String(entry.name || "").trim() === currentName);
    if (matches.length === 1) {
      return { candidate: matches[0], reason: "" };
    }
    if (matches.length > 1) {
      return {
        candidate: null,
        reason: `Multiple PATs matched the previously recorded token name "${currentName}".`
      };
    }
  }

  if (tokens.length === 1) {
    return { candidate: tokens[0], reason: "" };
  }

  return {
    candidate: null,
    reason: "Previous PAT could not be identified safely from the pre-rotation token list."
  };
}

async function createPat({ endpoint, headers, tokenName, expirationDays }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: tokenName,
      expirationDuration: expirationDays
    })
  });

  const text = await response.text();
  let payload = null;

  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = null;
    }
  }

  if (!response.ok) {
    const safeDetails = payload && typeof payload === "object"
      ? Object.keys(payload).join(", ") || "no response fields"
      : "non-JSON response";
    throw new Error(`Jira PAT create call failed with HTTP ${response.status}. Response shape: ${safeDetails}.`);
  }

  const token = findTokenValue(payload) || (!payload && text.trim() && !text.trim().startsWith("<") ? text.trim() : "");
  if (!token) {
    const safeDetails = payload && typeof payload === "object"
      ? Object.keys(payload).join(", ") || "no response fields"
      : "empty response";
    throw new Error(`Jira returned success but the new PAT was not found in the response. Response shape: ${safeDetails}.`);
  }

  return {
    token,
    expiresAt: findExpiryValue(payload),
    responseKeys: payload && typeof payload === "object" ? Object.keys(payload) : []
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const targetKey = normalizeTarget(options.target);
  const target = TARGETS[targetKey] || TARGETS.gbujira;
  const envVarName = String(options["env-var"] || target.envVarName).trim();
  const baseUrl = String(options["base-url"] || target.baseUrl).trim();
  const envFilePath = ensureAbsolutePath(String(options["env-file"] || defaultEnvFileName).trim() || ".env");
  const metadataFilePath = ensureAbsolutePath(
    String(
      options["metadata-file"]
      || path.join("data", "jira-pat-rotation", `${target.label}.json`)
    ).trim()
  );
  const expirationDays = options["expiration-days"]
    ? toPositiveInteger(options["expiration-days"], "--expiration-days")
    : 5;
  const thresholdDays = options["only-when-expiring-within-days"]
    ? toPositiveInteger(options["only-when-expiring-within-days"], "--only-when-expiring-within-days")
    : 0;
  const explicitCurrentExpiry = options["current-token-expires-at"]
    ? parseExpiry(options["current-token-expires-at"], "--current-token-expires-at")
    : null;
  const autoRevokePrevious = !options["keep-previous"];

  if (!envVarName) {
    throw new Error("No env var name was resolved for the Jira token.");
  }
  if (!baseUrl) {
    throw new Error("No Jira base URL was resolved.");
  }

  const currentToken = readTrimmedEnv(envVarName);
  const authToken = String(options["auth-token"] || readTrimmedEnv(String(options["auth-token-env"] || "")) || currentToken).trim();
  const basicUser = String(options["basic-user"] || "").trim();
  const basicPassword = readTrimmedEnv(String(options["basic-password-env"] || ""));
  const authMode = authToken ? "bearer" : (basicUser && basicPassword ? "basic" : "");

  if (!authMode && !options["dry-run"]) {
    throw new Error(
      `No Jira authentication source was found. Provide --auth-token, --auth-token-env, or --basic-user with --basic-password-env.`
    );
  }

  const currentFingerprint = currentToken ? fingerprintToken(currentToken) : "";
  let metadata = readMetadata(metadataFilePath);

  if (
    metadata
    && metadata.tokenFingerprint
    && currentFingerprint
    && metadata.tokenFingerprint !== currentFingerprint
  ) {
    metadata = null;
    process.stdout.write(`Local PAT metadata did not match ${envVarName}; treating this run as unbootstrapped.\n`);
  }

  if (!metadata && explicitCurrentExpiry && currentFingerprint) {
    metadata = {
      version: 1,
      target: target.label,
      envVarName,
      baseUrl,
      tokenFingerprint: currentFingerprint,
      expiresAt: explicitCurrentExpiry.toISOString(),
      recordedAt: toIsoTimestamp(),
      source: "current-token-expires-at"
    };
    writeMetadata(metadataFilePath, metadata);
    process.stdout.write(`Seeded local expiry metadata at ${metadataFilePath}.\n`);
  }

  if (thresholdDays && metadata && metadata.expiresAt) {
    const daysRemaining = Number(formatDaysRemaining(metadata.expiresAt));
    if (daysRemaining > thresholdDays) {
      process.stdout.write(
        `Skipping Jira PAT rotation for ${target.label}. ${daysRemaining.toFixed(2)} day(s) remain, outside the ${thresholdDays}-day window.\n`
      );
      return;
    }
  }

  const tokenName = buildTokenName(target.label, String(options.name || "").trim());
  const endpoint = buildEndpoint(baseUrl);
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
  };

  if (authMode === "bearer") {
    headers.Authorization = `Bearer ${authToken}`;
  } else if (authMode === "basic") {
    headers.Authorization = `Basic ${Buffer.from(`${basicUser}:${basicPassword}`).toString("base64")}`;
  }

  let previousPatCandidate = null;
  let previousPatResolutionWarning = "";
  if (!options["dry-run"] && autoRevokePrevious) {
    try {
      const existingPats = await listPats({ endpoint, headers });
      const resolved = resolvePreviousPatCandidate(existingPats, metadata);
      previousPatCandidate = resolved.candidate;
      previousPatResolutionWarning = resolved.reason || "";
    } catch (error) {
      previousPatResolutionWarning = error && error.message ? error.message : String(error);
    }
  }

  if (options["dry-run"]) {
    process.stdout.write(
      [
        "Dry run only. No Jira call was made.",
        `Target: ${target.label}`,
        `Base URL: ${baseUrl}`,
        `Env file: ${envFilePath}`,
        `Env var: ${envVarName}`,
        `Metadata file: ${metadataFilePath}`,
        `Token name: ${tokenName}`,
        `Expiration days: ${expirationDays}`,
        `Auth mode: ${authMode || "not provided"}`,
        `Auto revoke previous: ${autoRevokePrevious ? "enabled" : "disabled"}`,
        thresholdDays ? `Threshold window: ${thresholdDays} day(s)` : "Threshold window: disabled"
      ].join("\n") + "\n"
    );
    return;
  }

  process.stdout.write(`Creating a replacement Jira PAT for ${target.label} via ${endpoint}.\n`);
  const created = await createPat({ endpoint, headers, tokenName, expirationDays });
  updateEnvFileValue(envFilePath, envVarName, created.token);

  const expiresAt = created.expiresAt || new Date(Date.now() + expirationDays * 86400000).toISOString();
  const newFingerprint = fingerprintToken(created.token);
  const nextMetadata = {
    version: 1,
    target: target.label,
    envVarName,
    baseUrl,
    tokenName,
    expirationDays,
    rotatedAt: toIsoTimestamp(),
    expiresAt,
    tokenFingerprint: newFingerprint,
    source: created.expiresAt ? "jira-response" : "local-expiration-days"
  };

  let revokeSummary = "";
  if (autoRevokePrevious) {
    if (!previousPatCandidate) {
      revokeSummary = previousPatResolutionWarning
        ? `Skipped automatic previous-PAT revoke: ${previousPatResolutionWarning}`
        : "Skipped automatic previous-PAT revoke: no safe previous token candidate was found.";
    } else if (String(previousPatCandidate.name || "").trim() === tokenName) {
      revokeSummary = `Skipped automatic previous-PAT revoke: refusing to delete the newly created token "${tokenName}".`;
    } else {
      try {
        await deletePat({ baseUrl, token: created.token, patId: previousPatCandidate.id });
        nextMetadata.revokedPatId = previousPatCandidate.id;
        nextMetadata.revokedPatName = previousPatCandidate.name || "";
        nextMetadata.revokedAt = toIsoTimestamp();
        revokeSummary = `Revoked previous PAT "${previousPatCandidate.name || previousPatCandidate.id}" automatically.`;
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        nextMetadata.revokeError = message;
        revokeSummary = `Automatic previous-PAT revoke failed: ${message}`;
      }
    }
  } else {
    revokeSummary = "Kept the previous PAT because --keep-previous was set.";
  }

  writeMetadata(metadataFilePath, nextMetadata);

  process.stdout.write(
    [
      `Updated ${envVarName} in ${envFilePath}.`,
      `Rotation metadata saved to ${metadataFilePath}.`,
      `New token name: ${tokenName}`,
      `Expected expiry: ${expiresAt}`,
      revokeSummary
    ].join("\n") + "\n"
  );
}

main().catch((error) => {
  process.stderr.write(`${error && error.message ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
