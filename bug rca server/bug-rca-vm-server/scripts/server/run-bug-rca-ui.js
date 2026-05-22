#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const appDir = path.resolve(__dirname, "..", "..");
require(path.join(appDir, "lib", "env-file")).loadEnvFile({ baseDir: appDir });
const serverPath = path.join(appDir, "server.js");
const dataDir = path.join(appDir, "data");
const backgroundOutLog = path.join(dataDir, "launcher-background.out.log");
const backgroundErrLog = path.join(dataDir, "launcher-background.err.log");
const backgroundScriptPath = path.join(dataDir, "launcher-background.ps1");
const backgroundCommandPath = path.join(dataDir, "launcher-background.cmd");
const backgroundCommandRelativePath = `.\\${path.relative(appDir, backgroundCommandPath).replace(/\//g, "\\")}`;

function readFlag(name) {
  return process.argv.includes(name);
}

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }

  return fallback;
}

function buildEnv() {
  const port = readOption("--port", process.env.PORT || "3210");
  const serverMode = readOption("--server-mode", process.env.RCA_SERVER_MODE || "combined");

  return {
    ...process.env,
    PORT: port,
    HOST: readOption("--host", process.env.HOST || "127.0.0.1"),
    RCA_SERVER_MODE: serverMode,
    CODEX_FULL_ACCESS: readOption("--codex-full-access", process.env.CODEX_FULL_ACCESS || "true"),
    REQUIRE_ELEVATED_EXECUTION: readOption("--require-elevated-execution", process.env.REQUIRE_ELEVATED_EXECUTION || "true")
  };
}

function canListen(host, port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(Number(port), host);
  });
}

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookup, [command], {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true
  });
  return result.status === 0;
}

function listListeningPidsOnWindows(port) {
  const result = spawnSync("cmd.exe", ["/c", `netstat -ano | findstr :${port}`], {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true
  });

  if (result.status !== 0 || !result.stdout.trim()) {
    return [];
  }

  return [...new Set(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => /\bLISTENING\b/i.test(line))
      .map((line) => {
        const parts = line.split(/\s+/);
        return Number(parts[parts.length - 1] || 0);
      })
      .filter((pid) => Number.isInteger(pid) && pid > 0)
  )];
}

function listListeningPidsOnUnix(port) {
  if (commandExists("lsof")) {
    const result = spawnSync("lsof", ["-ti", `tcp:${port}`], {
      encoding: "utf8",
      stdio: "pipe"
    });

    if (result.status === 0 && result.stdout.trim()) {
      return [...new Set(
        result.stdout
          .split(/\r?\n/)
          .map((value) => Number(String(value).trim()))
          .filter((pid) => Number.isInteger(pid) && pid > 0)
      )];
    }
  }

  return [];
}

function terminatePortListeners(port) {
  const pids = process.platform === "win32"
    ? listListeningPidsOnWindows(port)
    : listListeningPidsOnUnix(port);

  for (const pid of pids) {
    if (!pid || pid === process.pid) {
      continue;
    }

    if (process.platform === "win32") {
      spawnSync("cmd.exe", ["/c", "taskkill", "/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true
      });
      continue;
    }

    try {
      process.kill(pid, "SIGKILL");
    } catch (error) {
      // Best effort only. Availability is verified after cleanup.
    }
  }

  return pids;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupGeneratedLauncherFiles() {
  for (const filePath of [backgroundScriptPath, backgroundCommandPath]) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch (error) {
      // Best-effort cleanup only. Background mode will recreate these helpers if needed.
    }
  }
}

async function resolveLaunchEnv() {
  const env = buildEnv();
  const host = env.HOST || "127.0.0.1";
  const requestedPort = Number(env.PORT || 3210);
  const strictPrimaryPort = requestedPort === 3210;

  const primaryAvailable = await canListen(host, requestedPort);
  if (primaryAvailable) {
    return env;
  }

  if (strictPrimaryPort) {
    const terminatedPids = terminatePortListeners(requestedPort);
    if (terminatedPids.length) {
      process.stdout.write(`Closed existing process(es) on port ${requestedPort}: ${terminatedPids.join(", ")}\n`);
    }
    await wait(1200);
    if (await canListen(host, requestedPort)) {
      return env;
    }
    throw new Error(`Port ${requestedPort} is still busy after forced cleanup. Reboot the machine and start the tool again.`);
  }

  return env;
}

function getHomeUrl(env) {
  return `http://${env.HOST}:${env.PORT}/home`;
}

function openBrowser(url) {
  let command = "";
  let args = [];
  let options = { detached: true, stdio: "ignore" };

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

  const browser = spawn(command, args, options);
  browser.unref();
}

function toPsLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function runForeground(env, openBrowserFlag) {
  if (openBrowserFlag) {
    setTimeout(() => {
      try {
        openBrowser(getHomeUrl(env));
      } catch (error) {
        // Browser open is best-effort only.
      }
    }, 3000);
  }

  const child = spawn(process.execPath, [serverPath], {
    cwd: appDir,
    env,
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

function runBackground(env) {
  fs.mkdirSync(dataDir, { recursive: true });

  if (process.platform === "win32") {
    const innerScript = [
      `$env:PORT='${toPsLiteral(env.PORT)}'`,
      `$env:HOST='${toPsLiteral(env.HOST)}'`,
      `$env:RCA_SERVER_MODE='${toPsLiteral(env.RCA_SERVER_MODE)}'`,
      `$env:CODEX_FULL_ACCESS='${toPsLiteral(env.CODEX_FULL_ACCESS)}'`,
      `$env:REQUIRE_ELEVATED_EXECUTION='${toPsLiteral(env.REQUIRE_ELEVATED_EXECUTION)}'`,
      `Set-Location '${toPsLiteral(appDir)}'`,
      `& '${toPsLiteral(process.execPath)}' '${toPsLiteral(serverPath)}' 1>> '${toPsLiteral(backgroundOutLog)}' 2>> '${toPsLiteral(backgroundErrLog)}'`
    ].join("\n");

    // Use small helper files to keep the Windows background handoff explicit and easy to debug.
    fs.writeFileSync(backgroundScriptPath, `${innerScript}\n`, "utf8");
    fs.writeFileSync(
      backgroundCommandPath,
      [
        "@echo off",
        `cd /d "${appDir}"`,
        `start "" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "${backgroundScriptPath}"`
      ].join("\r\n"),
      "utf8"
    );

    const result = spawnSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `cmd.exe /c ${backgroundCommandRelativePath}`
    ], {
      cwd: appDir,
      env,
      encoding: "utf8",
      stdio: "ignore",
      windowsHide: true
    });

    if (result.status !== 0) {
      const message = (result.stderr || result.stdout || "Windows background launcher failed.").trim();
      process.stderr.write(`${message}\n`);
      process.exit(result.status || 1);
    }

    process.stdout.write("started\n");
    return;
  }

  const outFd = fs.openSync(backgroundOutLog, "a");
  const errFd = fs.openSync(backgroundErrLog, "a");
  const child = spawn(process.execPath, [serverPath], {
      cwd: appDir,
      env,
      detached: true,
      stdio: ["ignore", outFd, errFd]
  });

  child.unref();
  process.stdout.write(`${child.pid}\n`);
}

async function main() {
  const background = readFlag("--background");
  const foreground = readFlag("--foreground") || !background;
  const openBrowserFlag = readFlag("--open-browser");
  cleanupGeneratedLauncherFiles();
  const env = await resolveLaunchEnv();

  if (background) {
    runBackground(env);
    return;
  }

  if (foreground) {
    runForeground(env, openBrowserFlag);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
