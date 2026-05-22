#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function normalizeBaseUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error("Hosted UI base URL cannot be empty.");
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`;
  const parsed = new URL(candidate);
  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

const input = process.argv[2] || process.env.BUG_RCA_VM_BASE_URL || "";
const normalized = normalizeBaseUrl(input);
const appDir = path.resolve(__dirname, "..");
const configPath = path.join(appDir, "ui-host-config.json");

const payload = {
  uiBaseUrl: normalized,
  autoOpenBrowser: true,
  pollTimeoutMs: 25000
};

fs.writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
process.stdout.write(`Updated hosted UI base URL: ${normalized}\n`);
