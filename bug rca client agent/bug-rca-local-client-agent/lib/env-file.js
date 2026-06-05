const fs = require("fs");
const path = require("path");

function stripWrappingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function parseEnvFileContent(content) {
  const result = {};
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const exportPrefix = line.startsWith("export ") ? "export " : "";
    const candidate = exportPrefix ? line.slice(exportPrefix.length).trim() : line;
    const separatorIndex = candidate.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = candidate.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = candidate.slice(separatorIndex + 1).trim();
    value = stripWrappingQuotes(value);
    result[key] = value;
  }

  return result;
}

function loadEnvFile(options = {}) {
  const baseDir = path.resolve(options.baseDir || path.join(__dirname, "..", ".."));
  const fileName = String(options.fileName || ".env").trim() || ".env";
  const filePath = path.join(baseDir, fileName);

  if (!fs.existsSync(filePath)) {
    return { filePath, loaded: false, values: {} };
  }

  const parsed = parseEnvFileContent(fs.readFileSync(filePath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return { filePath, loaded: true, values: parsed };
}

module.exports = {
  loadEnvFile,
  parseEnvFileContent
};
