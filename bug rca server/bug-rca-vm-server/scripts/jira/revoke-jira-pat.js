#!/usr/bin/env node

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
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
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
      "  node ./scripts/revoke-jira-pat.js [options]",
      "",
      "Options:",
      "  --target <gbujira|central|oci>   Target Jira profile. Default: gbujira",
      "  --env-file <FILE>                Env file to read. Default: .env",
      "  --token-id <ID>                  Delete the PAT with this Jira token id",
      "  --token-name <NAME>              Delete the PAT with this token name",
      "  --revoke-previous                Delete the single non-current PAT from the last rotation set",
      "  --metadata-file <FILE>           Override rotation metadata file path",
      "  --dry-run                        Resolve the target token without deleting it",
      "  --help                           Show this help",
      "",
      "Examples:",
      "  node ./scripts/revoke-jira-pat.js --target gbujira --revoke-previous",
      "  node ./scripts/revoke-jira-pat.js --target gbujira --token-name AyushMishraJIRAToken"
    ].join("\n") + "\n"
  );
}

function normalizeTarget(targetName) {
  return String(targetName || "gbujira").trim().toLowerCase();
}

function ensureAbsolutePath(candidatePath) {
  if (path.isAbsolute(candidatePath)) {
    return candidatePath;
  }
  return path.join(appDir, candidatePath);
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

function readTrimmedEnv(name) {
  return String(process.env[name] || "").trim();
}

function toIsoTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function listPats(baseUrl, token) {
  const response = await fetch(new URL("/rest/pat/latest/tokens", baseUrl).toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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

async function deletePat(baseUrl, token, patId) {
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

function resolveCandidate(tokens, metadata, options) {
  if (options["token-id"]) {
    const id = Number.parseInt(String(options["token-id"]), 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("--token-id must be a positive integer.");
    }
    const match = tokens.find((entry) => Number(entry.id) === id);
    if (!match) {
      throw new Error(`PAT id ${id} was not found.`);
    }
    return match;
  }

  if (options["token-name"]) {
    const name = String(options["token-name"]).trim();
    const matches = tokens.filter((entry) => String(entry.name || "").trim() === name);
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one PAT named "${name}", found ${matches.length}.`);
    }
    return matches[0];
  }

  if (options["revoke-previous"]) {
    if (!metadata || !metadata.tokenName) {
      throw new Error("--revoke-previous requires rotation metadata with the current tokenName.");
    }

    const currentName = String(metadata.tokenName).trim();
    const candidates = tokens.filter((entry) => String(entry.name || "").trim() !== currentName);
    if (candidates.length !== 1) {
      throw new Error(
        `--revoke-previous expected exactly one non-current PAT, found ${candidates.length}. Use --token-id or --token-name instead.`
      );
    }
    return candidates[0];
  }

  throw new Error("Provide --token-id, --token-name, or --revoke-previous.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const targetKey = normalizeTarget(options.target);
  const target = TARGETS[targetKey] || TARGETS.gbujira;
  const envFilePath = ensureAbsolutePath(String(options["env-file"] || defaultEnvFileName).trim() || ".env");
  const metadataFilePath = ensureAbsolutePath(
    String(options["metadata-file"] || path.join("data", "jira-pat-rotation", `${target.label}.json`)).trim()
  );
  const token = readTrimmedEnv(target.envVarName);
  if (!token) {
    throw new Error(`${target.envVarName} is empty. Cannot authenticate the PAT revoke call.`);
  }

  const metadata = readMetadata(metadataFilePath);
  const tokens = await listPats(target.baseUrl, token);
  const candidate = resolveCandidate(tokens, metadata, options);

  if (metadata && metadata.tokenName && String(candidate.name || "").trim() === String(metadata.tokenName).trim()) {
    throw new Error(`Refusing to delete the current PAT "${candidate.name}".`);
  }

  if (options["dry-run"]) {
    process.stdout.write(
      [
        "Dry run only. No Jira delete call was made.",
        `Target: ${target.label}`,
        `Env file: ${envFilePath}`,
        `Candidate id: ${candidate.id}`,
        `Candidate name: ${candidate.name}`,
        `Candidate expiry: ${candidate.expiringAt || "unknown"}`
      ].join("\n") + "\n"
    );
    return;
  }

  await deletePat(target.baseUrl, token, candidate.id);

  if (metadata) {
    metadata.revokedPatId = candidate.id;
    metadata.revokedPatName = candidate.name || "";
    metadata.revokedAt = toIsoTimestamp();
    writeMetadata(metadataFilePath, metadata);
  }

  process.stdout.write(
    [
      `Revoked PAT id ${candidate.id}.`,
      `Token name: ${candidate.name || ""}`,
      `Metadata file: ${metadataFilePath}`
    ].join("\n") + "\n"
  );
}

main().catch((error) => {
  process.stderr.write(`${error && error.message ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
