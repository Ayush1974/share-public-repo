const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  APP_ROOT,
  CODEX_FULL_ACCESS,
  HOST,
  PORT,
  REQUIRE_ELEVATED_EXECUTION,
  SERVER_MODE,
  UNIX_LAUNCHER
} = require("./config");

function isProcessElevated() {
  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "[bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
      ],
      {
        encoding: "utf8",
        stdio: "pipe",
        windowsHide: true
      }
    );

    return result.status === 0 && result.stdout.trim().toLowerCase() === "true";
  }

  if (typeof process.getuid === "function") {
    return process.getuid() === 0;
  }

  return false;
}

function ensureRequiredElevationAtStartup() {
  if (!REQUIRE_ELEVATED_EXECUTION || isProcessElevated()) {
    return;
  }

  try {
    if (process.platform === "win32") {
      const forwardedEnv = [
        ["PORT", PORT],
        ["HOST", HOST],
        ["RCA_SERVER_MODE", SERVER_MODE],
        ["CODEX_FULL_ACCESS", CODEX_FULL_ACCESS],
        ["REQUIRE_ELEVATED_EXECUTION", REQUIRE_ELEVATED_EXECUTION],
        ["CODEX_MODEL", process.env.CODEX_MODEL],
        ["CODEX_BIN", process.env.CODEX_BIN],
        ["CODEX_SKILLS_DIR", process.env.CODEX_SKILLS_DIR],
        ["RCA_PRODUCT_CATALOG_FILE", process.env.RCA_PRODUCT_CATALOG_FILE],
        ["SIMPHONY_WORKSPACE", process.env.SIMPHONY_WORKSPACE],
        ["RNA_WORKSPACE", process.env.RNA_WORKSPACE],
        ["FLM_WORKSPACE", process.env.FLM_WORKSPACE]
      ]
        .filter(([, value]) => value !== undefined && value !== null && value !== "");
      const handoffScript = [
        ...forwardedEnv.map(([key, value]) => `$env:${key}='${String(value).replace(/'/g, "''")}'`),
        `Set-Location '${APP_ROOT.replace(/'/g, "''")}'`,
        `& '${process.execPath.replace(/'/g, "''")}' '${path.join(APP_ROOT, "server.js").replace(/'/g, "''")}'`
      ]
        .filter(Boolean)
        .join("; ");
      const encodedHandoff = Buffer.from(handoffScript, "utf16le").toString("base64");
      const script = [
        "Start-Process -Verb RunAs powershell.exe",
        `-ArgumentList '-NoProfile -EncodedCommand ${encodedHandoff}'`,
        "-WindowStyle Hidden"
      ].join(" ");
      const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
        stdio: "inherit",
        windowsHide: false
      });

      if (result.status === 0) {
        console.log("Elevation handoff completed. Exiting the non-elevated bootstrap process.");
        process.exit(0);
      }

      console.error("Administrator launch was cancelled or failed. The server will not stay up without elevation.");
      process.exit(result.status || 1);
    }

    if (!fs.existsSync(UNIX_LAUNCHER)) {
      console.error("Elevation is required, but start-agent.sh was not found.");
      process.exit(1);
    }

    const result = spawnSync("sudo", ["-E", "bash", UNIX_LAUNCHER, "--elevated"], {
      stdio: "inherit"
    });

    if (result.status === 0) {
      console.log("Elevation handoff completed. Exiting the non-elevated bootstrap process.");
      process.exit(0);
    }

    console.error("Elevated launch was cancelled or failed. The server will not stay up without elevation.");
    process.exit(result.status || 1);
  } catch (error) {
    console.error(`Failed to relaunch with elevation: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ensureRequiredElevationAtStartup,
  isProcessElevated
};
