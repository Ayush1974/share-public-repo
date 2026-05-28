#!/usr/bin/env node
/**
 * Quick local test for BugDB integration.
 * Run from the bug-rca-vm-server directory (requires Oracle VPN):
 *
 *   node test-bugdb.js                        — uses default bug number
 *   node test-bugdb.js 39376378               — test a specific bug number
 *   node test-bugdb.js 39376378 --raw         — dump all raw Oracle API field names
 *   node test-bugdb.js 39376378 --download    — download text attachments and show content
 *
 * Reads credentials from .env (BUGDB_CLIENT_ID, BUGDB_CLIENT_SECRET).
 */

require("./lib/env-file").loadEnvFile({ baseDir: __dirname });
const {
  fetchDirectBugDbEvidence,
  fetchRawBugDbHeader,
  formatBugDbEvidence,
  resolveBugDbConfig
} = require("./lib/core/bugdb-api");
const fs = require("fs");
const path = require("path");

const bugNumber = process.argv.find((a) => /^\d+$/.test(a)) || "39376378";
const showRaw = process.argv.includes("--raw");
const withDownload = process.argv.includes("--download");

async function main() {
  console.log("=== BugDB Integration Test ===\n");

  // 1. Verify credentials are configured
  const config = resolveBugDbConfig();
  if (!config) {
    console.error("FAIL: BUGDB_CLIENT_ID or BUGDB_CLIENT_SECRET is not set in .env");
    process.exit(1);
  }
  console.log(`Config OK — client_id: ${config.clientId.slice(0, 8)}...`);
  console.log(`Base URL : ${config.baseUrl}`);
  console.log(`Token URL: ${config.tokenUrl}\n`);

  // 2. (optional) Dump raw API response — useful for discovering actual Oracle field names
  if (showRaw) {
    console.log(`Fetching RAW header for bug ${bugNumber} ...`);
    const raw = await fetchRawBugDbHeader(bugNumber);
    if (raw.error) {
      console.error(`Raw header fetch failed: ${raw.error}`);
    } else {
      const rawItems = Array.isArray(raw.raw?.items) ? raw.raw.items : [raw.raw];
      const rawItem = rawItems[0] || {};
      console.log(`\n--- Raw API Fields (endpoint: ${raw.endpoint}) ---`);
      Object.entries(rawItem).forEach(([key, val]) => {
        const display = typeof val === "string" && val.length > 120
          ? `${val.slice(0, 120)}...`
          : JSON.stringify(val);
        console.log(`  ${key}: ${display}`);
      });
      const rawPath = path.join(__dirname, "test-bugdb-raw.json");
      fs.writeFileSync(rawPath, JSON.stringify(raw.raw, null, 2), "utf8");
      console.log(`\nFull raw response saved to test-bugdb-raw.json\n`);
    }
  }

  // 3. Fetch normalized evidence (with or without attachment downloads)
  if (withDownload) console.log(`Fetching BugDB evidence WITH attachment downloads for bug ${bugNumber} ...`);
  else console.log(`Fetching normalized BugDB evidence for bug ${bugNumber} ...`);
  const start = Date.now();
  const evidence = await fetchDirectBugDbEvidence(bugNumber, { downloadAttachments: withDownload });
  console.log(`Done in ${Date.now() - start}ms\n`);

  // 4. Print summary of all mapped fields
  console.log("--- Bug Summary ---");
  console.log(`Bug Number : ${evidence.bugNumber}`);
  console.log(`Synopsis   : ${evidence.synopsis || "(empty — check --raw for actual field name)"}`);
  console.log(`Status     : ${evidence.status || "(empty)"}`);
  console.log(`Priority   : ${evidence.priority || "(empty)"}`);
  console.log(`Severity   : ${evidence.severity || "(empty)"}`);
  console.log(`Product    : ${evidence.product || "(empty)"}`);
  console.log(`Component  : ${evidence.component || "(empty)"}`);
  console.log(`Assignee   : ${evidence.assignee || "(empty)"}`);
  console.log(`Reporter   : ${evidence.reporter || "(empty)"}`);
  console.log(`Created    : ${evidence.created || "(empty)"}`);
  console.log(`Updated    : ${evidence.updated || "(empty)"}`);
  console.log(`Comments   : ${evidence.comments.length}`);
  console.log(`Attachments: ${evidence.attachments.length}`);
  if (evidence.attachments.length) {
    const downloaded = evidence.attachments.filter(a => a.downloaded).length;
    const withContent = evidence.attachments.filter(a => a.content).length;
    console.log(`  Downloaded      : ${downloaded}/${evidence.attachments.length}`);
    console.log(`  With content    : ${withContent} (these are what Codex sees)`);
    console.log(`  Saved to        : ${evidence.attachmentDirectory}`);
    evidence.attachments.forEach((a, i) => {
      const state = a.downloaded
        ? `downloaded (${a.size ? Math.ceil(a.size / 1024) + " KB" : "?"}) ${a.content ? "✓ content read" : "— binary/skipped"}`
        : a._skipped
          ? `skipped — ${a._skipped}`
          : `FAILED — ${(a.downloadError || "unknown error").split("\n")[0].slice(0, 100)}`;
      console.log(`  [${i + 1}] ${a.filename} — ${state}`);
    });
  }

  // 5. Full description text (not truncated)
  if (evidence.description) {
    console.log("\n--- Full Description ---");
    console.log(evidence.description);
  }

  if (evidence.problemStatement && evidence.problemStatement !== evidence.description) {
    console.log("\n--- Problem Statement ---");
    console.log(evidence.problemStatement);
  }

  // 6. First comment preview
  if (evidence.comments.length) {
    console.log("\n--- First Comment ---");
    const c = evidence.comments[0];
    console.log(`Author : ${c.author}`);
    console.log(`Date   : ${c.created}`);
    console.log(`Text   : ${c.body}`);
  }

  // 7. Show which endpoints responded and which returned 404
  console.log("\n--- Endpoint Sources ---");
  Object.entries(evidence.endpointSources || {}).forEach(([k, v]) =>
    console.log(`  ${k}: ${v || "(none — endpoint returned 404)"}`)
  );

  const endpointErrors = Object.entries(evidence.endpointErrors || {}).filter(([, v]) => v);
  if (endpointErrors.length) {
    console.log("\n--- Endpoint Warnings ---");
    endpointErrors.forEach(([k, v]) => {
      const clean = v.split("\n")[0].slice(0, 200);
      console.log(`  ${k}: ${clean}`);
    });
  }

  // 8. Show the exact text block that will be sent to the AI (Codex)
  console.log("\n--- Formatted Evidence Block (as sent to Codex) ---");
  console.log(formatBugDbEvidence(evidence));

  // 9. Save full normalized output for inspection
  const outPath = path.join(__dirname, "test-bugdb-output.json");
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`\nPASS — normalized evidence saved to test-bugdb-output.json`);
  if (!showRaw) console.log("TIP: run with --raw to dump all actual Oracle API field names");
  if (!withDownload && evidence.attachments.length) {
    console.log(`TIP: run with --download to fetch attachments and read text/zip content (${evidence.attachments.length} attachment(s) found)`);
  }
}

main().catch((err) => {
  console.error("\nFAIL:", err.message);
  process.exit(1);
});
