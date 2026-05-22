function normalizeTicketSource(value, ticketId = "") {
  const explicit = String(value || "").trim().toLowerCase();
  if (explicit === "jira" || explicit === "bugdb" || explicit === "description") {
    return explicit;
  }

  const normalizedTicketId = String(ticketId || "").trim();
  if (/^[A-Za-z][A-Za-z0-9_]*-\d+$/i.test(normalizedTicketId)) {
    return "jira";
  }

  return "bugdb";
}

function isJiraMcpServer(server) {
  const name = String(server?.name || "").trim().toLowerCase();
  const command = String(server?.command || "").trim().toLowerCase();
  const args = Array.isArray(server?.args) ? server.args.map((value) => String(value || "").toLowerCase()) : [];
  const envKeys = server?.env && typeof server.env === "object"
    ? Object.keys(server.env).map((key) => String(key || "").toUpperCase())
    : [];

  return name.includes("atlassian")
    || name.includes("jira")
    || command.includes("docker")
    || args.some((value) => value.includes("mcp-atlassian") || value.includes("jira"))
    || envKeys.some((key) => key.startsWith("JIRA_"));
}

function formatSkippedServerReasons(servers = []) {
  return servers
    .map((server) => `${server.name}: ${server?.probe?.reason || "Unavailable."}`)
    .join(" ");
}

function addGenericJiraMcpAliases(servers = []) {
  const normalizedServers = Array.isArray(servers) ? servers.filter(Boolean) : [];
  if (normalizedServers.some((server) => String(server?.name || "").trim().toLowerCase() === "jira")) {
    return normalizedServers;
  }

  const jiraCommandServers = normalizedServers.filter((server) => server?.kind === "command" && isJiraMcpServer(server));
  if (jiraCommandServers.length !== 1) {
    return normalizedServers;
  }

  return [
    ...normalizedServers,
    {
      ...jiraCommandServers[0],
      name: "jira"
    }
  ];
}

function resolveTicketScopedMcpServers(request, resolution) {
  const ticketSource = normalizeTicketSource(request?.ticketSource, request?.ticketId);
  const runnableUrlServers = Array.isArray(resolution?.runnableUrlServers) ? resolution.runnableUrlServers : [];
  const runnableCommandServers = Array.isArray(resolution?.runnableCommandServers) ? resolution.runnableCommandServers : [];
  const skippedServers = Array.isArray(resolution?.skippedServers) ? resolution.skippedServers : [];

  if (ticketSource !== "jira") {
    return {
      ticketSource,
      runnableUrlServers: [],
      runnableCommandServers: [],
      skippedServers: [],
      blockingIssue: ""
    };
  }

  const jiraRunnableUrlServers = runnableUrlServers.filter(isJiraMcpServer);
  const jiraRunnableCommandServers = runnableCommandServers.filter(isJiraMcpServer);
  const jiraSkippedServers = skippedServers.filter(isJiraMcpServer);

  if (!jiraRunnableUrlServers.length && !jiraRunnableCommandServers.length) {
    return {
      ticketSource,
      runnableUrlServers: [],
      runnableCommandServers: [],
      skippedServers: jiraSkippedServers,
      blockingIssue: jiraSkippedServers.length
        ? `Jira RCA requires a runnable Jira MCP server. ${formatSkippedServerReasons(jiraSkippedServers)}`
        : "Jira RCA requires a runnable Jira MCP server, but no enabled Jira MCP server is configured."
    };
  }

  return {
    ticketSource,
    runnableUrlServers: jiraRunnableUrlServers,
    runnableCommandServers: jiraRunnableCommandServers,
    skippedServers: jiraSkippedServers,
    blockingIssue: ""
  };
}

module.exports = {
  addGenericJiraMcpAliases,
  formatSkippedServerReasons,
  isJiraMcpServer,
  normalizeTicketSource,
  resolveTicketScopedMcpServers
};
