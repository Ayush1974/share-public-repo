#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnvFile } = require("../../lib/env-file");

const APP_ROOT = path.resolve(__dirname, "..", "..");

loadEnvFile({ baseDir: APP_ROOT, fileName: path.join("cfg", ".env") });

const { SHARED_WORKSPACE_LIST } = require("../../lib/core/config");

function readOption(name) {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(name);
  if (index < 0 || index === argv.length - 1) {
    return "";
  }
  return String(argv[index + 1] || "").trim();
}

function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

function isDisabled(value) {
  return ["0", "false", "no", "off"].includes(String(value || "").trim().toLowerCase());
}

function normalizeWorkspaceSelector(value, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function log(message) {
  process.stdout.write(`[memory-bank-startup] ${message}\n`);
}

function logError(message) {
  process.stderr.write(`[memory-bank-startup] ${message}\n`);
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeCell(value) {
  return String(value == null ? "" : value)
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function summarizeIndexState(modules) {
  const active = modules.filter((module) => !module.removed);
  return {
    total: active.length,
    deep: active.filter((module) => module.index_state === "deep" && !module.stale).length,
    stale: active.filter((module) => module.index_state === "deep" && module.stale).length,
    shallow: active.filter((module) => module.index_state !== "deep").length
  };
}

function writeFallbackAgents(workspaceRoot, label, inventory) {
  const generatedAt = inventory.generated_at || new Date().toISOString();
  const repoHash = inventory.repo_hash || "nogit";
  const activeModules = Array.isArray(inventory.modules) ? inventory.modules.filter((module) => !module.removed) : [];
  const repoName = label || path.basename(workspaceRoot);
  const lines = [
    `<!-- generated_at: ${generatedAt} -->`,
    "<!-- generator: memory-bank-v3.5-fallback -->",
    `<!-- repo_hash: ${repoHash} -->`,
    "",
    `# ${repoName} router`,
    "",
    "Read `docs/memory-bank/index.md` before scanning source.",
    "Use `docs/memory-bank/modules/` for module-level context.",
    "Refresh the memory bank after major structural changes.",
    "",
    "## Current snapshot",
    `- Build system: \`${inventory.build_system || "unknown"}\``,
    `- Mode: \`${inventory.mode || "unknown"}\``,
    `- Languages: \`${Array.isArray(inventory.languages) && inventory.languages.length ? inventory.languages.join(", ") : "unknown"}\``,
    `- Modules indexed: \`${activeModules.length}\``,
    "",
    "## Investigation flow",
    "1. Read `docs/memory-bank/index.md` for repo-wide structure and module map.",
    "2. Open the module markdown that matches the failing area.",
    "3. Only scan source files after the index and relevant module doc are insufficient.",
    ""
  ];

  fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), lines.join("\n"), "utf8");
}

function writeFallbackIndex(workspaceRoot, label, inventory) {
  const generatedAt = inventory.generated_at || new Date().toISOString();
  const repoHash = inventory.repo_hash || "nogit";
  const docsDir = path.join(workspaceRoot, "docs", "memory-bank");
  ensureDirectory(docsDir);
  const modules = Array.isArray(inventory.modules) ? inventory.modules.filter((module) => !module.removed) : [];
  const stats = summarizeIndexState(modules);
  const repoName = label || path.basename(workspaceRoot);
  const commands = inventory.commands && typeof inventory.commands === "object" ? inventory.commands : {};
  const entryPoints = Array.isArray(inventory.entry_points) ? inventory.entry_points.slice(0, 12) : [];
  const lines = [
    `<!-- generated_at: ${generatedAt} -->`,
    "<!-- generator: memory-bank-v3.5-fallback -->",
    `<!-- repo_hash: ${repoHash} -->`,
    "",
    `# ${repoName} memory bank`,
    "",
    "## Summary",
    `- Repo root: \`${workspaceRoot}\``,
    `- Build system: \`${inventory.build_system || "unknown"}\``,
    `- Mode: \`${inventory.mode || "unknown"}\``,
    `- Languages: \`${Array.isArray(inventory.languages) && inventory.languages.length ? inventory.languages.join(", ") : "unknown"}\``,
    `- Modules: \`${stats.total}\` active, \`${stats.deep}\` deep, \`${stats.shallow}\` shallow, \`${stats.stale}\` deep-stale`,
    `- Generated at: \`${generatedAt}\``,
    ""
  ];

  if (Object.keys(commands).length) {
    lines.push("## Commands");
    for (const [name, commandInfo] of Object.entries(commands)) {
      const command = commandInfo?.command || "UNKNOWN";
      const evidence = commandInfo?.evidence || "UNKNOWN";
      lines.push(`- \`${name}\`: \`${command}\` (${evidence})`);
    }
    lines.push("");
  }

  if (entryPoints.length) {
    lines.push("## Entry points");
    for (const entryPoint of entryPoints) {
      lines.push(`- \`${entryPoint.symbol || "UNKNOWN"}\` at \`${entryPoint.path || "UNKNOWN"}:${entryPoint.line || "?"}\``);
    }
    lines.push("");
  }

  lines.push("## Module map");
  lines.push("| Slug | Name | Path | Lang | Files | State | Doc |");
  lines.push("| --- | --- | --- | --- | ---: | --- | --- |");
  for (const module of modules) {
    const slug = escapeCell(module.slug || "unknown");
    const name = escapeCell(module.name || slug);
    const modulePath = escapeCell(module.path || "");
    const language = escapeCell(module.language || "unknown");
    const sourceFiles = Number.isFinite(Number(module.source_files)) ? Number(module.source_files) : 0;
    const state = module.stale ? "deep-stale" : escapeCell(module.index_state || "unknown");
    const docRelPath = `modules/${module.slug}.md`;
    const docCell = fs.existsSync(path.join(docsDir, docRelPath)) ? `[doc](${docRelPath})` : "";
    lines.push(`| \`${slug}\` | ${name} | \`${modulePath}\` | \`${language}\` | ${sourceFiles} | \`${state}\` | ${docCell} |`);
  }
  lines.push("");

  fs.writeFileSync(path.join(docsDir, "index.md"), lines.join("\n"), "utf8");
}

function ensureFinalArtifacts(workspaceRoot, label) {
  const inventoryPath = path.join(workspaceRoot, ".memory-bank-cache", "inventory.json");
  const inventory = readJsonIfExists(inventoryPath);
  if (!inventory) {
    return false;
  }

  ensureDirectory(path.join(workspaceRoot, "docs", "memory-bank"));
  writeFallbackIndex(workspaceRoot, label, inventory);
  writeFallbackAgents(workspaceRoot, label, inventory);
  return true;
}

function uniqueWorkspaces(workspaces) {
  const seen = new Set();
  return workspaces.filter((workspace) => {
    const rootPath = path.resolve(String(workspace?.rootPath || ""));
    if (!rootPath) {
      return false;
    }
    const key = process.platform === "win32" ? rootPath.toLowerCase() : rootPath;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function matchesWorkspaceSelector(workspace, selector) {
  const normalizedSelector = normalizeWorkspaceSelector(selector, "");
  if (!normalizedSelector) {
    return true;
  }

  const candidates = [
    workspace?.id,
    workspace?.productKey,
    ...(Array.isArray(workspace?.aliases) ? workspace.aliases : [])
  ]
    .map((value) => normalizeWorkspaceSelector(value, ""))
    .filter(Boolean);

  return candidates.includes(normalizedSelector);
}

function resolveTargetWorkspaces(workspaces, options = {}) {
  const unique = uniqueWorkspaces(workspaces || []);
  const selector = options.rootId || options.productKey || options.selector || "";
  if (!selector) {
    return unique;
  }
  return unique.filter((workspace) => matchesWorkspaceSelector(workspace, selector));
}

function runCodex(codexBin, workspaceRoot, promptText) {
  const args = ["--sandbox", "workspace-write", "--ask-for-approval", "never", "exec", "--skip-git-repo-check", "-"];
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(codexBin)) {
    const escapedCodexBin = String(codexBin || "").replace(/'/g, "''");
    const command = `& '${escapedCodexBin}' ${args.join(" ")}`;
    return spawnSync("powershell.exe", ["-NoProfile", "-Command", command], {
      cwd: workspaceRoot,
      encoding: "utf8",
      input: promptText,
      maxBuffer: 1024 * 1024 * 20
    });
  }

  return spawnSync(codexBin, args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    input: promptText,
    maxBuffer: 1024 * 1024 * 20
  });
}

function generateSharedWorkspaceMemoryBanks(options = {}) {
  const isEnabled = !isDisabled(process.env.GENERATE_SHARED_MEMORY_BANKS_ON_STARTUP || "true");
  if (!isEnabled) {
    log("Skipping shared workspace memory-bank generation because GENERATE_SHARED_MEMORY_BANKS_ON_STARTUP is disabled.");
    return {
      success: true,
      failureCount: 0,
      matchedCount: 0,
      generatedCount: 0,
      skipped: true
    };
  }

  const workspaces = resolveTargetWorkspaces(SHARED_WORKSPACE_LIST || [], options);
  if (!workspaces.length) {
    const selector = options.rootId || options.productKey || options.selector || "";
    if (selector) {
      logError(`No hosted shared workspace root matched selector "${selector}".`);
      return {
        success: false,
        failureCount: 1,
        matchedCount: 0,
        generatedCount: 0,
        skipped: false
      };
    }
    log("No hosted shared workspace roots are configured. Skipping memory-bank generation.");
    return {
      success: true,
      failureCount: 0,
      matchedCount: 0,
      generatedCount: 0,
      skipped: true
    };
  }

  const promptPath = path.join(APP_ROOT, "references", "generate-memory-bank-FINAL.md");
  if (!fs.existsSync(promptPath)) {
    logError(`Skipping shared workspace memory-bank generation because the prompt file is missing: ${promptPath}`);
    return {
      success: false,
      failureCount: 1,
      matchedCount: workspaces.length,
      generatedCount: 0,
      skipped: false
    };
  }

  const codexBin = options.codexBin || readOption("--codex-bin") || process.env.CODEX_BIN || "codex";
  const promptText = fs.readFileSync(promptPath, "utf8");
  const dryRun = options.dryRun !== undefined ? Boolean(options.dryRun) : hasFlag("--dry-run");
  const finalizeOnly = options.finalizeOnly !== undefined ? Boolean(options.finalizeOnly) : hasFlag("--finalize-only");
  let failureCount = 0;
  let generatedCount = 0;

  log(`Preparing memory-bank generation for ${workspaces.length} shared workspace root(s).`);
  for (const workspace of workspaces) {
    const workspaceRoot = path.resolve(workspace.rootPath);
    const label = workspace.label || workspace.id || path.basename(workspaceRoot);
    if (!fs.existsSync(workspaceRoot)) {
      logError(`Skipping ${label} because the configured root path does not exist: ${workspaceRoot}`);
      failureCount += 1;
      continue;
    }

    const indexPath = path.join(workspaceRoot, "docs", "memory-bank", "index.md");
    if (dryRun) {
      log(`Dry run: would generate ${indexPath} for ${label}.`);
      continue;
    }

    if (!finalizeOnly) {
      log(`Generating ${indexPath} for ${label} from ${workspaceRoot}.`);
      const result = runCodex(codexBin, workspaceRoot, promptText);

      if (result.stdout) {
        process.stdout.write(result.stdout);
        if (!String(result.stdout).endsWith("\n")) {
          process.stdout.write("\n");
        }
      }
      if (result.stderr) {
        process.stderr.write(result.stderr);
        if (!String(result.stderr).endsWith("\n")) {
          process.stderr.write("\n");
        }
      }

      if (result.error) {
        logError(`Generation failed for ${label}: ${result.error.message}`);
        failureCount += 1;
        continue;
      }

      if (result.status !== 0) {
        logError(`Generation failed for ${label} with exit code ${result.status}.`);
        failureCount += 1;
        continue;
      }
    }

    if (!ensureFinalArtifacts(workspaceRoot, label)) {
      logError(`Generation did not produce inventory data for ${label}; final artifacts were not written.`);
      failureCount += 1;
      continue;
    }

    generatedCount += 1;
    log(`Finished generating ${indexPath} and AGENTS.md for ${label}.`);
  }

  if (failureCount) {
    logError(`Shared workspace memory-bank generation completed with ${failureCount} failure(s).`);
    return {
      success: false,
      failureCount,
      matchedCount: workspaces.length,
      generatedCount,
      skipped: false
    };
  }

  log("Shared workspace memory-bank generation completed successfully.");
  return {
    success: true,
    failureCount: 0,
    matchedCount: workspaces.length,
    generatedCount,
    skipped: false
  };
}

function main() {
  const result = generateSharedWorkspaceMemoryBanks({
    rootId: readOption("--root-id"),
    productKey: readOption("--product-key")
  });
  return result.success ? 0 : 1;
}

module.exports = {
  generateSharedWorkspaceMemoryBanks
};

if (require.main === module) {
  process.exitCode = main();
}
