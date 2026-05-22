const http = require("http");
const https = require("https");

const { getConfiguredMcpServers, normalizeReportText } = require("./file-utils");
const { isJiraMcpServer } = require("./ticket-routing");

const TEXT_ATTACHMENT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".log",
  ".md",
  ".txt",
  ".xml",
  ".yaml",
  ".yml"
]);
const MAX_ATTACHMENT_EXCERPT_DOWNLOADS = 5;
const ATTACHMENT_EXCERPT_CONCURRENCY = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 256 * 1024;
const MAX_TEXT_FIELD_LENGTH = 4000;
const MAX_ATTACHMENT_EXCERPT_LENGTH = 4000;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function truncateText(value, maxLength = MAX_TEXT_FIELD_LENGTH) {
  const normalized = normalizeReportText(String(value || ""))
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function flattenJiraValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => flattenJiraValue(entry)).filter(Boolean).join("\n");
  }

  if (typeof value === "object") {
    if (typeof value.text === "string" && value.text.trim()) {
      return value.text;
    }
    if (typeof value.value === "string" && value.value.trim()) {
      return value.value;
    }
    if (typeof value.displayName === "string" && value.displayName.trim()) {
      return value.displayName;
    }
    if (typeof value.name === "string" && value.name.trim()) {
      return value.name;
    }
    if (Array.isArray(value.content)) {
      return flattenJiraValue(value.content);
    }
    if (Array.isArray(value.items)) {
      return flattenJiraValue(value.items);
    }

    return Object.values(value)
      .map((entry) => flattenJiraValue(entry))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function createRequestOptions(url, method, headers, sslVerify) {
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === "https:";
  const transport = isHttps ? https : http;

  return {
    transport,
    options: {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method,
      headers,
      agent: isHttps ? new https.Agent({ rejectUnauthorized: sslVerify }) : undefined
    }
  };
}

function requestUrl(url, { method = "GET", headers = {}, body = null, sslVerify = true, maxRedirects = 3 } = {}) {
  return new Promise((resolve, reject) => {
    const { transport, options } = createRequestOptions(url, method, headers, sslVerify);
    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", async () => {
        const payload = Buffer.concat(chunks);
        const statusCode = Number(res.statusCode || 0);
        const location = String(res.headers.location || "").trim();

        if ([301, 302, 303, 307, 308].includes(statusCode) && location && maxRedirects > 0) {
          try {
            const redirectedUrl = new URL(location, url).toString();
            const redirected = await requestUrl(redirectedUrl, {
              method: statusCode === 303 ? "GET" : method,
              headers,
              body: statusCode === 303 ? null : body,
              sslVerify,
              maxRedirects: maxRedirects - 1
            });
            resolve(redirected);
          } catch (error) {
            reject(error);
          }
          return;
        }

        resolve({
          statusCode,
          headers: res.headers,
          body: payload
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Jira API request timed out."));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function parseJsonResponse(response, fallbackMessage) {
  const text = response.body.toString("utf8");
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${fallbackMessage} HTTP ${response.statusCode}: ${truncateText(text, 800)}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${fallbackMessage} Invalid JSON response.`);
  }
}

function buildJiraHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };
}

function preferJiraServer(left, right) {
  const leftName = String(left?.name || "").toLowerCase();
  const rightName = String(right?.name || "").toLowerCase();
  const score = (name) => (
    name === "jira" ? 5
      : name.includes("gbujira") ? 4
        : name.includes("atlassian") ? 3
          : name.includes("jira") ? 2
            : 1
  );
  return score(rightName) - score(leftName);
}

function resolveDirectJiraApiConfig() {
  const jiraServers = getConfiguredMcpServers()
    .filter((server) => isJiraMcpServer(server))
    .sort(preferJiraServer);

  for (const server of jiraServers) {
    const baseUrl = normalizeBaseUrl(server?.env?.JIRA_URL || server?.url || "");
    const token = String(server?.env?.JIRA_PERSONAL_TOKEN || "").trim();
    const sslVerifyRaw = String(server?.env?.JIRA_SSL_VERIFY || "").trim().toLowerCase();
    const sslVerify = sslVerifyRaw ? sslVerifyRaw !== "false" : true;

    if (baseUrl && token) {
      return {
        baseUrl,
        token,
        sslVerify,
        sourceName: server.name || "jira"
      };
    }
  }

  const envBaseUrl = normalizeBaseUrl(process.env.JIRA_URL || "");
  const envToken = String(process.env.JIRA_PERSONAL_TOKEN || "").trim();
  if (envBaseUrl && envToken) {
    return {
      baseUrl: envBaseUrl,
      token: envToken,
      sslVerify: String(process.env.JIRA_SSL_VERIFY || "").trim().toLowerCase() !== "false",
      sourceName: "env"
    };
  }

  return null;
}

function mapComment(comment) {
  return {
    author: flattenJiraValue(comment?.author?.displayName || comment?.author?.name || comment?.updateAuthor?.displayName || ""),
    created: String(comment?.created || comment?.updated || "").trim(),
    body: truncateText(flattenJiraValue(comment?.body || ""))
  };
}

function mapChangelogHistory(history) {
  const items = Array.isArray(history?.items) ? history.items : [];
  return {
    author: flattenJiraValue(history?.author?.displayName || history?.author?.name || ""),
    created: String(history?.created || "").trim(),
    items: items
      .map((item) => {
        const field = flattenJiraValue(item?.field || item?.fieldId || "");
        const fromString = truncateText(flattenJiraValue(item?.fromString || item?.from || ""), 240);
        const toString = truncateText(flattenJiraValue(item?.toString || item?.to || ""), 240);
        const valueParts = [fromString ? `from ${fromString}` : "", toString ? `to ${toString}` : ""].filter(Boolean);
        return [field || "Change", valueParts.join(" ")].filter(Boolean).join(": ").trim();
      })
      .filter(Boolean)
  };
}

function toAttachmentNameList(attachments = []) {
  return attachments
    .map((attachment) => String(attachment?.filename || "").trim())
    .filter(Boolean);
}

async function fetchAttachmentExcerptsWithLimit(items, { concurrency = 1, maxSuccessfulDownloads = 0, fetcher }) {
  const normalizedItems = Array.isArray(items) ? items : [];
  if (!normalizedItems.length || !maxSuccessfulDownloads || typeof fetcher !== "function") {
    return [];
  }

  const excerpts = new Array(normalizedItems.length).fill("");
  const workerCount = Math.min(Math.max(1, Number(concurrency) || 1), normalizedItems.length);
  let nextIndex = 0;
  let successfulDownloads = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;

        if (currentIndex >= normalizedItems.length || successfulDownloads >= maxSuccessfulDownloads) {
          return;
        }

        let excerpt = "";
        try {
          excerpt = await fetcher(normalizedItems[currentIndex], currentIndex);
        } catch (error) {
          excerpt = "";
        }

        excerpts[currentIndex] = excerpt || "";
        if (excerpt) {
          successfulDownloads += 1;
        }
      }
    })
  );

  return excerpts;
}

async function maybeFetchAttachmentExcerpt(attachment, headers, sslVerify) {
  const filename = String(attachment?.filename || "").trim();
  const contentUrl = String(attachment?.content || "").trim();
  const mimeType = String(attachment?.mimeType || attachment?.mime || "").trim().toLowerCase();
  const size = Number(attachment?.size || 0);
  const extensionMatch = filename.toLowerCase().match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : "";
  const looksTextLike = mimeType.startsWith("text/")
    || mimeType.includes("json")
    || mimeType.includes("xml")
    || TEXT_ATTACHMENT_EXTENSIONS.has(extension);

  if (!contentUrl || !looksTextLike || !size || size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "";
  }

  const response = await requestUrl(contentUrl, {
    method: "GET",
    headers,
    sslVerify
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return "";
  }

  return truncateText(response.body.toString("utf8"), MAX_ATTACHMENT_EXCERPT_LENGTH);
}

async function fetchDirectJiraIssueEvidence(ticketId) {
  const config = resolveDirectJiraApiConfig();
  if (!config) {
    throw new Error("Direct Jira API is not configured. Enable a Jira server with JIRA_URL and JIRA_PERSONAL_TOKEN, or set those values in the environment.");
  }

  const normalizedTicketId = String(ticketId || "").trim();
  const headers = buildJiraHeaders(config.token);
  const fields = [
    "summary",
    "description",
    "comment",
    "attachment",
    "issuetype",
    "project",
    "priority",
    "status",
    "assignee",
    "reporter",
    "labels",
    "components",
    "fixVersions",
    "versions",
    "created",
    "updated"
  ].join(",");
  const issueUrl = `${config.baseUrl}/rest/api/2/issue/${encodeURIComponent(normalizedTicketId)}?fields=${encodeURIComponent(fields)}&expand=changelog`;
  const issueResponse = await requestUrl(issueUrl, {
    method: "GET",
    headers,
    sslVerify: config.sslVerify
  });
  const issue = parseJsonResponse(issueResponse, `Failed to fetch Jira issue ${normalizedTicketId}.`);
  const fieldsData = issue?.fields || {};
  const rawComments = Array.isArray(fieldsData?.comment?.comments) ? fieldsData.comment.comments : [];
  const comments = rawComments.map(mapComment).filter((comment) => comment.body || comment.author);
  const rawAttachments = Array.isArray(fieldsData?.attachment) ? fieldsData.attachment : [];
  const rawChangelog = Array.isArray(issue?.changelog?.histories) ? issue.changelog.histories : [];
  const changelog = rawChangelog.map(mapChangelogHistory).filter((entry) => entry.author || entry.created || entry.items.length);
  const attachmentExcerpts = await fetchAttachmentExcerptsWithLimit(rawAttachments, {
    concurrency: ATTACHMENT_EXCERPT_CONCURRENCY,
    maxSuccessfulDownloads: MAX_ATTACHMENT_EXCERPT_DOWNLOADS,
    fetcher: (attachment) => maybeFetchAttachmentExcerpt(attachment, headers, config.sslVerify)
  });
  const attachments = rawAttachments.map((attachment, index) => ({
      filename: String(attachment?.filename || "").trim(),
      mimeType: String(attachment?.mimeType || attachment?.mime || "").trim(),
      size: Number(attachment?.size || 0),
      excerpt: attachmentExcerpts[index] || ""
    }));

  return {
    source: {
      baseUrl: config.baseUrl,
      sourceName: config.sourceName
    },
    key: String(issue?.key || normalizedTicketId).trim() || normalizedTicketId,
    summary: truncateText(flattenJiraValue(fieldsData.summary || "")),
    description: truncateText(flattenJiraValue(fieldsData.description || "")),
    issueType: flattenJiraValue(fieldsData?.issuetype?.name || ""),
    project: flattenJiraValue(fieldsData?.project?.key || fieldsData?.project?.name || ""),
    priority: flattenJiraValue(fieldsData?.priority?.name || ""),
    status: flattenJiraValue(fieldsData?.status?.name || ""),
    assignee: flattenJiraValue(fieldsData?.assignee?.displayName || fieldsData?.assignee?.name || ""),
    reporter: flattenJiraValue(fieldsData?.reporter?.displayName || fieldsData?.reporter?.name || ""),
    labels: Array.isArray(fieldsData?.labels) ? fieldsData.labels.map((value) => String(value || "").trim()).filter(Boolean) : [],
    components: Array.isArray(fieldsData?.components) ? fieldsData.components.map((value) => flattenJiraValue(value?.name || value)).filter(Boolean) : [],
    fixVersions: Array.isArray(fieldsData?.fixVersions) ? fieldsData.fixVersions.map((value) => flattenJiraValue(value?.name || value)).filter(Boolean) : [],
    affectsVersions: Array.isArray(fieldsData?.versions) ? fieldsData.versions.map((value) => flattenJiraValue(value?.name || value)).filter(Boolean) : [],
    created: String(fieldsData?.created || "").trim(),
    updated: String(fieldsData?.updated || "").trim(),
    commentCount: rawComments.length,
    attachmentCount: rawAttachments.length,
    changelogCount: rawChangelog.length,
    comments,
    changelog,
    attachments,
    attachmentNames: toAttachmentNameList(rawAttachments)
  };
}

module.exports = {
  fetchDirectJiraIssueEvidence,
  flattenJiraValue,
  resolveDirectJiraApiConfig,
  truncateText
};
