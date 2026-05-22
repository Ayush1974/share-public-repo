const elements = {
  form: document.getElementById("runForm"),
  viewNav: document.getElementById("viewNav"),
  productInput: document.getElementById("productInput"),
  productOptions: document.getElementById("productOptions"),
  workspaceInput: document.getElementById("workspace"),
  browseWorkspaceButton: document.getElementById("browseWorkspaceButton"),
  agentPanel: document.getElementById("agentPanel"),
  agentBaseUrlInput: document.getElementById("agentBaseUrl"),
  agentAdvancedPanel: document.getElementById("agentAdvancedPanel"),
  connectAgentButton: document.getElementById("connectAgentButton"),
  agentConnectionHint: document.getElementById("agentConnectionHint"),
  ticketIdInput: document.getElementById("ticketId"),
  issueTitleInput: document.getElementById("issueTitle"),
  versionInput: document.getElementById("versionInput"),
  modelInput: document.getElementById("model"),
  extraInstructionsInput: document.getElementById("extraInstructions"),
  interactionInput: document.getElementById("interactionInput"),
  continueInteractionButton: document.getElementById("continueInteractionButton"),
  steerPanel: document.getElementById("steerPanel"),
  steerToggleButton: document.getElementById("steerToggleButton"),
  runButton: document.getElementById("runButton"),
  stopButton: document.getElementById("stopButton"),
  liveStopButton: document.getElementById("liveStopButton"),
  clearStreamButton: document.getElementById("clearStreamButton"),
  downloadContextButton: document.getElementById("downloadContextButton"),
  refreshSessionsButton: document.getElementById("refreshSessionsButton"),
  deleteAllSessionsButton: document.getElementById("deleteAllSessionsButton"),
  refreshArtifactsButton: document.getElementById("refreshArtifactsButton"),
  autoScrollToggle: document.getElementById("autoScrollToggle"),
  liveOutput: document.getElementById("liveOutput"),
  reportNav: document.getElementById("reportNav"),
  reportBody: document.getElementById("reportBody"),
  sessionList: document.getElementById("sessionList"),
  artifactTabs: document.getElementById("artifactTabs"),
  artifactOutput: document.getElementById("artifactOutput"),
  defaultPrompt: document.getElementById("defaultPrompt"),
  authUserChip: document.getElementById("authUserChip"),
  authUserName: document.getElementById("authUserName"),
  authUserMeta: document.getElementById("authUserMeta"),
  clearStoredProfileButton: document.getElementById("clearStoredProfileButton"),
  logoutLink: document.getElementById("logoutLink"),
  statusBadge: document.getElementById("statusBadge"),
  eventCount: document.getElementById("eventCount"),
  savedSessionsCount: document.getElementById("savedSessionsCount"),
  elapsedTime: document.getElementById("elapsedTime"),
  lastUpdated: document.getElementById("lastUpdated"),
  commandPreview: document.getElementById("commandPreview"),
  runtimeModeTitle: document.getElementById("runtimeModeTitle"),
  runtimeModeDetail: document.getElementById("runtimeModeDetail"),
  runtimeBlocker: document.getElementById("runtimeBlocker"),
  runtimeBlockerTitle: document.getElementById("runtimeBlockerTitle"),
  runtimeBlockerDetail: document.getElementById("runtimeBlockerDetail"),
  runtimeBlockerHint: document.getElementById("runtimeBlockerHint"),
  guidanceSummary: document.getElementById("guidanceSummary"),
  sessionNameSummary: document.getElementById("sessionNameSummary"),
  currentSessionId: document.getElementById("currentSessionId"),
  productSummary: document.getElementById("productSummary"),
  workspaceSummary: document.getElementById("workspaceSummary"),
  ticketSummary: document.getElementById("ticketSummary"),
  versionSummary: document.getElementById("versionSummary"),
  finalState: document.getElementById("finalState"),
  activeSectionLabel: document.getElementById("activeSectionLabel"),
  reportSectionSummary: document.getElementById("reportSectionSummary"),
  rcaFieldSummary: document.getElementById("rcaFieldSummary"),
  mcpCallSummary: document.getElementById("mcpCallSummary"),
  summaryConfidence: document.getElementById("summaryConfidence"),
  summarySubsystem: document.getElementById("summarySubsystem"),
  summaryAffectedFiles: document.getElementById("summaryAffectedFiles"),
  summaryVerification: document.getElementById("summaryVerification"),
  summaryPreview: document.getElementById("summaryPreview"),
  homeDeepRca: document.getElementById("homeDeepRca"),
  homeReportLabel: document.getElementById("homeReportLabel"),
  homeReportHeading: document.getElementById("homeReportHeading"),
  reportTitle: document.getElementById("reportTitle"),
  reportSubcopy: document.getElementById("reportSubcopy"),
  confirmDialog: document.getElementById("confirmDialog"),
  confirmDialogBackdrop: document.getElementById("confirmDialogBackdrop"),
  confirmDialogEyebrow: document.getElementById("confirmDialogEyebrow"),
  confirmDialogTitle: document.getElementById("confirmDialogTitle"),
  confirmDialogMessage: document.getElementById("confirmDialogMessage"),
  confirmDialogCancel: document.getElementById("confirmDialogCancel"),
  confirmDialogConfirm: document.getElementById("confirmDialogConfirm")
};

const state = {
  controller: null,
  products: [],
  productMap: {},
  productLookup: {},
  selectedProductKey: "",
  activeView: "home",
  receivedEvents: 0,
  latestFinalMessage: "",
  latestSections: {},
  latestRcaFields: {},
  activeReportSection: "rca",
  activeArtifact: "aiToolInstruction",
  artifacts: {
    aiToolInstruction: "",
    newToolInstruction: "",
    error: ""
  },
  hostedWorkspaceRoots: [],
  liveEntries: [],
  agentBaseUrl: "",
  runtimeConfig: {
    platform: "",
    connected: false,
    requireElevatedExecution: false,
    elevated: false,
    serverMode: ""
  },
  steerPanelOpen: false,
  currentSessionId: "",
  currentSessionStatus: "",
  sessions: [],
  runStartedAt: 0,
  elapsedTimer: null,
  sessionPollTimer: null,
  agentReconnectTimer: null,
  authenticatedUser: null,
  authRetentionDays: 0,
  canClearStoredProfile: false,
  confirmResolver: null
};

const VALID_VIEWS = new Set(["home", "rca", "sessions"]);
const VIEW_PATHS = {
  home: "/home",
  rca: "/root-cause-report",
  sessions: "/session-history"
};

const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([view, pathname]) => [pathname, view])
);

const DEFAULT_AGENT_BASE_URL = "http://127.0.0.1:3210";
const AGENT_BASE_STORAGE_KEY = "bugRcaUiAgentBaseUrl";
const AGENT_RECONNECT_DELAY_MS = 5000;
const RUNNING_SESSION_POLL_MS = 10000;
const EVIDENCE_FIRST_GUIDANCE = "Focus on comments, audit history, attachments, logs, and reproducible evidence before concluding RCA.";
const PRODUCT_GENERIC_GUIDANCE = "Keep the RCA generic to the selected Oracle Restaurants product and highlight subsystem-specific evidence.";
const FIX_FROM_RCA_GUIDANCE = "If the RCA identifies concrete files, make the follow-up fix step update those exact files and report verification.";

function normalizeAgentBaseUrl(value) {
  let candidate = String(value || "").trim();
  if (!candidate) {
    candidate = DEFAULT_AGENT_BASE_URL;
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    return DEFAULT_AGENT_BASE_URL;
  }
}

function readStoredAgentBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("agent") || params.get("agentBaseUrl");
  const fromStorage = window.localStorage.getItem(AGENT_BASE_STORAGE_KEY);
  return {
    fromQuery: fromQuery ? normalizeAgentBaseUrl(fromQuery) : "",
    fromStorage: fromStorage ? normalizeAgentBaseUrl(fromStorage) : ""
  };
}

function normalizeSharedWorkspaceRelativePath(value) {
  const cleaned = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");

  if (!cleaned || cleaned === ".") {
    return "";
  }

  const parts = cleaned.split("/").filter(Boolean);
  const safeParts = [];
  for (const part of parts) {
    if (part === ".") {
      continue;
    }
    if (part === "..") {
      if (!safeParts.length) {
        return "";
      }
      safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return safeParts.join("/");
}

function canonicalizeSharedWorkspaceRootId(value) {
  const normalized = compactWhitespace(value).toLowerCase();
  if (!normalized) {
    return "";
  }

  const matchingRoot = state.hostedWorkspaceRoots.find((root) => (
    compactWhitespace(root.id).toLowerCase() === normalized
    || (Array.isArray(root.aliases) && root.aliases.some((alias) => compactWhitespace(alias).toLowerCase() === normalized))
  ));
  if (matchingRoot) {
    return compactWhitespace(matchingRoot.id).toLowerCase();
  }

  if (normalized === "simphony-temp") {
    return "simphony";
  }

  return normalized;
}

function buildSharedWorkspaceDescriptor(rootId, relativePath = "") {
  const normalizedRootId = canonicalizeSharedWorkspaceRootId(rootId);
  const normalizedRelativePath = normalizeSharedWorkspaceRelativePath(relativePath);
  return normalizedRelativePath
    ? `shared://${normalizedRootId}/${normalizedRelativePath}`
    : `shared://${normalizedRootId}`;
}

function parseSharedWorkspaceDescriptor(value) {
  const rawValue = compactWhitespace(value);
  if (!rawValue.toLowerCase().startsWith("shared://")) {
    return null;
  }

  const remainder = rawValue.slice("shared://".length);
  const slashIndex = remainder.indexOf("/");
  const rootId = slashIndex >= 0 ? remainder.slice(0, slashIndex) : remainder;
  const relativePath = slashIndex >= 0 ? remainder.slice(slashIndex + 1) : "";
  if (!rootId) {
    return null;
  }

  return {
    rootId: canonicalizeSharedWorkspaceRootId(rootId),
    relativePath: normalizeSharedWorkspaceRelativePath(relativePath),
    descriptor: buildSharedWorkspaceDescriptor(rootId, relativePath)
  };
}

function isHostedWorkspaceSelection(value = elements.workspaceInput?.value || "") {
  return Boolean(parseSharedWorkspaceDescriptor(value));
}

function getFixFromRcaBlockedReason(value = elements.workspaceInput?.value || "") {
  const sharedWorkspace = parseSharedWorkspaceDescriptor(value);
  if (!sharedWorkspace) {
    return "";
  }

  return `Fix from RCA is disabled for ${sharedWorkspace.descriptor}. Use a writable local checkout instead.`;
}

function normalizeDraftGuidanceForWorkspace() {
  if (!elements.extraInstructionsInput) {
    return "";
  }

  const blockedReason = getFixFromRcaBlockedReason();
  const currentGuidance = elements.extraInstructionsInput.value || "";
  if (!blockedReason || inferGuidanceMode(currentGuidance) !== "fix-from-rca") {
    return blockedReason;
  }

  elements.extraInstructionsInput.value = currentGuidance.includes(FIX_FROM_RCA_GUIDANCE)
    ? currentGuidance.replace(FIX_FROM_RCA_GUIDANCE, PRODUCT_GENERIC_GUIDANCE)
    : PRODUCT_GENERIC_GUIDANCE;
  return blockedReason;
}

function getHostedWorkspaceApiBaseUrl() {
  return normalizeAgentBaseUrl(window.location.origin);
}

async function canReachAgentApi(baseUrl) {
  const candidate = normalizeAgentBaseUrl(baseUrl);
  try {
    const response = await fetch(`${candidate}/api/config`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const serverMode = String(payload?.serverMode || "").trim().toLowerCase();
    return serverMode === "agent" || serverMode === "combined";
  } catch (error) {
    return false;
  }
}

async function findReachableAgentBaseUrl(candidates) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeAgentBaseUrl(candidate);
    if (await canReachAgentApi(normalized)) {
      return normalized;
    }
  }

  return "";
}

async function resolveInitialAgentBaseUrl() {
  const { fromQuery, fromStorage } = readStoredAgentBaseUrl();
  if (fromQuery) {
    const reachableFromQuery = await findReachableAgentBaseUrl([fromQuery]);
    if (reachableFromQuery) {
      return reachableFromQuery;
    }
  }

  if (fromStorage) {
    const reachableFromStorage = await findReachableAgentBaseUrl([fromStorage]);
    if (reachableFromStorage) {
      return reachableFromStorage;
    }
    window.localStorage.removeItem(AGENT_BASE_STORAGE_KEY);
  }

  const currentOrigin = normalizeAgentBaseUrl(window.location.origin);
  return await findReachableAgentBaseUrl([
    currentOrigin,
    DEFAULT_AGENT_BASE_URL
  ]) || DEFAULT_AGENT_BASE_URL;
}

function setAgentBaseUrl(value, options = {}) {
  const nextValue = normalizeAgentBaseUrl(value);
  state.agentBaseUrl = nextValue;
  if (elements.agentBaseUrlInput) {
    elements.agentBaseUrlInput.value = nextValue;
  }

  if (options.persist !== false) {
    window.localStorage.setItem(AGENT_BASE_STORAGE_KEY, nextValue);
  }

  return nextValue;
}

function isDefaultAgentBaseUrl(value = state.agentBaseUrl || DEFAULT_AGENT_BASE_URL) {
  return normalizeAgentBaseUrl(value) === DEFAULT_AGENT_BASE_URL;
}

function clearAgentReconnect() {
  if (!state.agentReconnectTimer) {
    return;
  }

  window.clearTimeout(state.agentReconnectTimer);
  state.agentReconnectTimer = null;
}

function scheduleAgentReconnect() {
  if (state.runtimeConfig.connected || state.agentReconnectTimer) {
    return;
  }

  state.agentReconnectTimer = window.setTimeout(() => {
    state.agentReconnectTimer = null;
    if (state.runtimeConfig.connected) {
      return;
    }

    connectAgent({ silent: true }).catch(() => {});
  }, AGENT_RECONNECT_DELAY_MS);
}

function apiUrl(path) {
  return `${state.agentBaseUrl}${path}`;
}

function setStatus(label, className) {
  elements.statusBadge.textContent = label;
  elements.statusBadge.className = `status-pill ${className}`;
}

function inferGuidanceMode(extraInstructions) {
  const normalized = compactWhitespace(extraInstructions);
  if (!normalized) {
    return "";
  }

  if (normalized.includes(EVIDENCE_FIRST_GUIDANCE)) {
    return "evidence-first";
  }

  if (normalized.includes(PRODUCT_GENERIC_GUIDANCE)) {
    return "product-generic";
  }

  if (normalized.includes(FIX_FROM_RCA_GUIDANCE)) {
    return "fix-from-rca";
  }

  return "";
}

function getSessionGuidanceMode(session) {
  return session?.request?.guidanceMode || inferGuidanceMode(session?.request?.extraInstructions || "");
}

function getDraftGuidanceMode() {
  return inferGuidanceMode(elements.extraInstructionsInput?.value || "");
}

function getActiveGuidanceMode(session = null) {
  if (session) {
    return getSessionGuidanceMode(session);
  }

  const activeSession = state.sessions.find((item) => item.id === state.currentSessionId);
  return getSessionGuidanceMode(activeSession) || getDraftGuidanceMode();
}

function formatGuidanceModeLabel(mode) {
  if (mode === "evidence-first") {
    return "Evidence-first";
  }

  if (mode === "product-generic") {
    return "Root Cause Report";
  }

  if (mode === "fix-from-rca") {
    return "Fix from RCA";
  }

  return "Standard RCA";
}

function getReportPresentation(mode = getActiveGuidanceMode()) {
  if (mode === "evidence-first") {
    return {
      mode,
      reportSectionName: "Evidence",
      reportTag: "Evidence",
      tagClassName: "section-tag-evidence",
      homeLabel: "Completed Evidence Report",
      homeHeading: "Single report preview",
      homeTitle: "Evidence-first RCA for the active session",
      homeEmptyTitle: "No Evidence block yet",
      homeEmptyCopy: "Start a run to populate the current preview here on Home.",
      reportTitle: "Completed evidence report",
      reportSubcopy: "Review the evidence-focused RCA report with comments, audit history, attachments, logs, and reproducible clues before concluding the RCA.",
      reportEmptyCopy: "Run an evidence-first RCA first, then the structured evidence report will appear here.",
      focusCopy: EVIDENCE_FIRST_GUIDANCE
    };
  }

  if (mode === "product-generic") {
    return {
      mode,
      reportSectionName: "Root Cause Report",
      reportTag: "Root Cause Report",
      tagClassName: "",
      homeLabel: "Completed RCA report",
      homeHeading: "Single report preview",
      homeTitle: "Full Root Cause Report for the active session",
      homeEmptyTitle: "No Root Cause Report block yet",
      homeEmptyCopy: "Start a run to populate the current preview here on Home.",
      reportTitle: "Completed RCA report",
      reportSubcopy: "Review the full .clinerules-based Root Cause Report with evidence, call chain, root cause code, failure analysis, and complete fix scope.",
      reportEmptyCopy: "Run the .clinerules-based RCA first, then the structured Root Cause Report will appear here.",
      focusCopy: PRODUCT_GENERIC_GUIDANCE
    };
  }

  if (mode === "fix-from-rca") {
    return {
      mode,
      reportSectionName: "Fix from RCA",
      reportTag: "Fix from RCA",
      tagClassName: "",
      homeLabel: "Completed Fix from RCA Report",
      homeHeading: "Single report preview",
      homeTitle: "Fix from RCA follow-up for the active session",
      homeEmptyTitle: "No Fix from RCA block yet",
      homeEmptyCopy: "Start a run to populate the current preview here on Home.",
      reportTitle: "Completed fix from RCA report",
      reportSubcopy: "Review the RCA-guided fix output, changed files, and verification notes for the active session.",
      reportEmptyCopy: "Run a fix-from-RCA flow first, then the structured report will appear here.",
      focusCopy: FIX_FROM_RCA_GUIDANCE
    };
  }

  return {
    mode,
    reportSectionName: "Report",
    reportTag: "Report",
    tagClassName: "",
    homeLabel: "Completed RCA Report",
    homeHeading: "Single report preview",
    homeTitle: "Current report for the active session",
    homeEmptyTitle: "No report preview yet",
    homeEmptyCopy: "Start a run to populate the current preview here on Home.",
    reportTitle: "Completed report",
    reportSubcopy: "Review the current report with evidence, subsystem findings, affected files, and the final RCA output called out clearly.",
    reportEmptyCopy: "Run RCA first, then the structured report will appear here.",
    focusCopy: ""
  };
}

function hasStructuredReportContent(sections = {}, rcaFields = {}) {
  return Object.values(sections || {}).some((value) => String(value || "").trim())
    || Object.values(rcaFields || {}).some((value) => String(value || "").trim());
}

function getResolvedReportPresentation(mode = getActiveGuidanceMode()) {
  const base = getReportPresentation(mode);
  const status = String(state.currentSessionStatus || "").toLowerCase();
  const failureDetails = String(state.latestFinalMessage || "").trim();
  const hasReport = hasStructuredReportContent(state.latestSections, state.latestRcaFields);

  if (!hasReport && failureDetails && (status === "failed" || status === "cancelled" || status === "interrupted")) {
    const failed = status === "failed";
    return {
      ...base,
      homeLabel: failed ? "RCA Run Failed" : "RCA Run Stopped",
      homeHeading: "Run outcome",
      homeEmptyTitle: failed
        ? "No RCA report was captured"
        : "The RCA run stopped before a report was captured",
      homeEmptyCopy: failed
        ? "The run ended with runtime or authentication errors before any Root Cause Report or evidence report was produced."
        : "The run ended before any Root Cause Report or evidence report was produced.",
      reportTitle: failed ? "RCA failure details" : "RCA stop details",
      reportSubcopy: failed
        ? "Review the runtime failure that prevented the RCA report from being generated."
        : "Review why the run stopped before any RCA report was generated.",
      reportEmptyCopy: failed
        ? "The run failed before any RCA or evidence sections were produced."
        : "The run stopped before any RCA or evidence sections were produced."
    };
  }

  return base;
}

function renderTemplateChipSelection(blockedReason = getFixFromRcaBlockedReason()) {
  const activeMode = getDraftGuidanceMode();
  document.querySelectorAll(".template-chip[data-guidance-mode]").forEach((button) => {
    const blocked = button.dataset.guidanceMode === "fix-from-rca" && Boolean(blockedReason);
    button.disabled = blocked;
    button.setAttribute("aria-disabled", blocked ? "true" : "false");
    if (blocked) {
      button.title = blockedReason;
    } else {
      button.removeAttribute("title");
    }
    button.classList.toggle("template-chip-active", !blocked && button.dataset.guidanceMode === activeMode);
  });
}

function resolveConfirmDialog(result) {
  elements.confirmDialog.hidden = true;
  elements.confirmDialog.setAttribute("aria-hidden", "true");
  elements.confirmDialog.classList.remove("confirm-dialog-danger");

  if (!state.confirmResolver) {
    return;
  }

  const resolver = state.confirmResolver;
  state.confirmResolver = null;
  resolver(result);
}

window.__bugRcaResolveConfirmDialog = resolveConfirmDialog;

function handleConfirmDialogKeydown(event) {
  if (event.key === "Escape" && state.confirmResolver) {
    event.preventDefault();
    resolveConfirmDialog(false);
  }
}

function showConfirmDialog(options = {}) {
  if (!elements.confirmDialog || !elements.confirmDialogConfirm || !elements.confirmDialogCancel) {
    return Promise.resolve(true);
  }

  if (state.confirmResolver) {
    resolveConfirmDialog(false);
  }

  elements.confirmDialogEyebrow.textContent = options.eyebrow || "Confirm Action";
  elements.confirmDialogTitle.textContent = options.title || "Confirm";
  elements.confirmDialogMessage.textContent = options.message || "Please confirm this action.";
  elements.confirmDialogConfirm.textContent = options.confirmLabel || "Confirm";
  elements.confirmDialog.classList.toggle("confirm-dialog-danger", Boolean(options.danger));
  elements.confirmDialog.hidden = false;
  elements.confirmDialog.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    state.confirmResolver = resolve;
    window.setTimeout(() => {
      elements.confirmDialogConfirm.focus();
    }, 0);
  });
}

function syncReportChrome(mode = getActiveGuidanceMode()) {
  const presentation = getResolvedReportPresentation(mode);
  if (elements.homeReportLabel) {
    elements.homeReportLabel.textContent = presentation.homeLabel;
  }
  if (elements.homeReportHeading) {
    elements.homeReportHeading.textContent = presentation.homeHeading;
  }
  if (elements.reportTitle) {
    elements.reportTitle.textContent = presentation.reportTitle;
  }
  if (elements.reportSubcopy) {
    elements.reportSubcopy.textContent = presentation.reportSubcopy;
  }
}

function renderAuthenticatedUser() {
  const user = state.authenticatedUser;
  if (!elements.authUserChip || !elements.logoutLink) {
    return;
  }

  if (!user) {
    if (elements.authUserName) {
      elements.authUserName.textContent = "";
    }
    if (elements.authUserMeta) {
      elements.authUserMeta.textContent = "";
    }
    elements.authUserChip.hidden = true;
    elements.logoutLink.hidden = true;
    return;
  }

  const name = user.displayName || user.username || user.email || user.subject || "Signed in user";
  const metaParts = [user.email, user.employeeId].filter(Boolean);
  elements.authUserName.textContent = name;
  elements.authUserMeta.textContent = metaParts.join(" | ") || user.subject || user.username || "";
  elements.authUserChip.hidden = false;
  elements.logoutLink.hidden = false;
}

async function loadAuthenticatedUser() {
  try {
    const response = await fetch("/auth/me", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      state.authenticatedUser = null;
      state.authRetentionDays = 0;
      state.canClearStoredProfile = false;
      renderAuthenticatedUser();
      return;
    }

    const payload = await response.json();
    state.authenticatedUser = payload.authenticated ? payload.user || null : null;
    state.authRetentionDays = Number(payload.retentionDays || 0);
    state.canClearStoredProfile = Boolean(payload.canClearStoredProfile);
  } catch (error) {
    state.authenticatedUser = null;
    state.authRetentionDays = 0;
    state.canClearStoredProfile = false;
  }

  renderAuthenticatedUser();
}

async function clearStoredProfile() {
  if (!state.authenticatedUser) {
    return;
  }

  const retentionMessage = state.authRetentionDays
    ? `This server would otherwise auto-clear it after ${state.authRetentionDays} day(s).`
    : "This only clears the compact profile saved on the server.";
  const confirmed = await showConfirmDialog({
    eyebrow: "Clear Saved Profile",
    title: "Clear stored profile?",
    message: `Clear the saved profile for this signed-in user? ${retentionMessage}`,
    confirmLabel: "Clear Profile",
    danger: true
  });
  if (!confirmed) {
    return;
  }

  if (elements.clearStoredProfileButton) {
    elements.clearStoredProfileButton.disabled = true;
  }

  try {
    await fetchJson("/auth/me", { method: "DELETE" });
    await loadAuthenticatedUser();
    appendLive({
      kind: "success",
      label: "Saved profile cleared",
      headline: "The compact server-side profile for this signed-in user was removed.",
      resultSummary: "The next sign-in will recreate it only if needed."
    });
  } catch (error) {
    appendLive({
      kind: "error",
      label: "Profile clear failed",
      headline: "The saved profile could not be cleared.",
      resultSummary: summarizeResultText(error.message),
      detail: shortenMultiline(error.message, 420)
    });
  } finally {
    if (elements.clearStoredProfileButton) {
      elements.clearStoredProfileButton.disabled = false;
    }
  }
}

function escapeHtml(value) {
  return String(normalizeReportText(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugifySectionName(value) {
  return String(value || "section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDuration(durationMs) {
  if (!durationMs) {
    return "0m";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function normalizeProduct(product) {
  if (!product || typeof product !== "object") {
    return null;
  }

  const family = compactWhitespace(product.family || product.label || product.key || "");
  if (!family) {
    return null;
  }

  return {
    ...product,
    key: compactWhitespace(product.key || ""),
    label: compactWhitespace(product.label || family),
    family,
    defaultWorkspace: String(product.defaultWorkspace || "").trim()
  };
}

function normalizeProductLookupValue(value) {
  return compactWhitespace(value).toLowerCase();
}

function rememberProduct(product) {
  if (!product) {
    return;
  }

  if (product.key) {
    state.productMap[product.key] = product;
  }

  [product.key, product.label, product.family].forEach((candidate) => {
    const normalized = normalizeProductLookupValue(candidate);
    if (normalized) {
      state.productLookup[normalized] = product;
    }
  });
}

function findProductByInput(value) {
  const normalized = normalizeProductLookupValue(value);
  if (!normalized) {
    return null;
  }

  return state.productLookup[normalized] || state.productMap[normalized] || null;
}

function buildCustomProduct(value) {
  const family = compactWhitespace(value);
  if (!family) {
    return null;
  }

  return {
    key: "",
    label: family,
    family,
    defaultWorkspace: "",
    usesSkill: false,
    skillName: ""
  };
}

function getCurrentProductSelection(options = {}) {
  const { allowFallback = true } = options;
  const typedValue = compactWhitespace(elements.productInput?.value || "");
  const matchedProduct = findProductByInput(typedValue);
  if (matchedProduct) {
    return matchedProduct;
  }

  if (typedValue) {
    return buildCustomProduct(typedValue);
  }

  if (allowFallback) {
    return state.productMap[state.selectedProductKey] || state.products[0] || null;
  }

  return null;
}

function getSessionProductLabel(session) {
  return session?.request?.productLabel || state.productMap[session?.request?.product]?.family || session?.summary?.product || "";
}

function updateElapsedClock() {
  if (!state.runStartedAt) {
    elements.elapsedTime.textContent = "00:00";
    return;
  }

  const deltaSeconds = Math.floor((Date.now() - state.runStartedAt) / 1000);
  const minutes = String(Math.floor(deltaSeconds / 60)).padStart(2, "0");
  const seconds = String(deltaSeconds % 60).padStart(2, "0");
  elements.elapsedTime.textContent = `${minutes}:${seconds}`;
}

function startElapsedClock() {
  state.runStartedAt = Date.now();
  updateElapsedClock();
  clearInterval(state.elapsedTimer);
  state.elapsedTimer = setInterval(updateElapsedClock, 1000);
}

function stopElapsedClock(durationMs) {
  clearInterval(state.elapsedTimer);
  state.elapsedTimer = null;

  if (typeof durationMs === "number" && durationMs >= 0) {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    elements.elapsedTime.textContent = `${minutes}:${seconds}`;
    return;
  }

  updateElapsedClock();
}

function stopSessionPolling() {
  clearInterval(state.sessionPollTimer);
  state.sessionPollTimer = null;
}

function getCurrentSessionStatus() {
  const session = state.sessions.find((item) => item.id === state.currentSessionId);
  return session?.status || state.currentSessionStatus || "";
}

function isCurrentSessionRunning() {
  return getCurrentSessionStatus() === "running";
}

async function syncCurrentSessionFromSavedState(options = {}) {
  const { appendRecoveryNote = false } = options;
  if (!state.currentSessionId) {
    return false;
  }

  try {
    const session = await fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(state.currentSessionId)}`));
    if (!session) {
      return false;
    }

    applySession(session);
    if (session.status === "running") {
      return false;
    }

    if (state.controller) {
      state.controller.abort();
      state.controller = null;
    }

    const completed = session.status === "completed";
    const cancelled = session.status === "cancelled" || session.status === "interrupted";
    setStatus(completed ? "Completed" : cancelled ? "Stopped" : "Error", completed ? "status-done" : "status-error");
    stopElapsedClock(session.durationMs || 0);
    updateButtons();

    if (appendRecoveryNote) {
      appendLive({
        kind: cancelled ? "warning" : completed ? "success" : "error",
        label: "Run state synced",
        headline: "The page refreshed the saved session because the live stream did not close cleanly.",
        resultSummary: summarizeResultText(session.status || "Session updated"),
        detail: shortenMultiline(session.output?.stderr || session.output?.finalMessage || "", 560)
      });
    }

    stopSessionPolling();
    return true;
  } catch (error) {
    return false;
  }
}

function startSessionPolling() {
  stopSessionPolling();
  state.sessionPollTimer = setInterval(async () => {
    if (!state.currentSessionId) {
      return;
    }

    if (!state.controller && !isCurrentSessionRunning()) {
      stopSessionPolling();
      return;
    }

    try {
      const session = await fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(state.currentSessionId)}`));
      if (!session) {
        return;
      }

      if (session.status !== "running") {
        await syncCurrentSessionFromSavedState({ appendRecoveryNote: true });
        return;
      }

      if (session.progress?.lastWarningAt && session.progress?.silenceMs >= 45000) {
        elements.lastUpdated.textContent = formatClock();
      }
    } catch (error) {
      // Keep polling quietly while the run is active.
    }
  }, RUNNING_SESSION_POLL_MS);
}

function normalizeView(view) {
  return VALID_VIEWS.has(view) ? view : "home";
}

function normalizePathname(pathname) {
  const cleaned = String(pathname || "/")
    .trim()
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");

  return cleaned || "/";
}

function getPathForView(view) {
  return VIEW_PATHS[normalizeView(view)] || VIEW_PATHS.home;
}

function getViewFromLocation() {
  return normalizeView(PATH_VIEWS[normalizePathname(window.location.pathname)] || "home");
}

function setActiveView(view, options = {}) {
  const { syncHistory = true, replaceHistory = false } = options;
  const nextView = normalizeView(view);
  state.activeView = nextView;

  document.querySelectorAll(".view-tab[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === nextView);
  });

  document.querySelectorAll(".page-view[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === nextView);
  });

  if (syncHistory) {
    const nextPath = getPathForView(nextView);
    const currentPath = normalizePathname(window.location.pathname);
    if (currentPath !== nextPath) {
      if (replaceHistory) {
        window.history.replaceState(null, "", nextPath);
      } else {
        window.history.pushState(null, "", nextPath);
      }
    }
  }
}

function summarizeGuidanceList(value) {
  const guidance = compactWhitespace(value);
  if (!guidance) {
    return "No extra RCA guidance is applied yet.";
  }

  const mode = inferGuidanceMode(guidance);
  if (mode === "evidence-first") {
    return `Evidence-first RCA selected. ${guidance}`;
  }

  if (mode === "product-generic") {
    return `Root Cause Report selected. ${guidance}`;
  }

  if (mode === "fix-from-rca") {
    return `Fix from RCA selected. ${guidance}`;
  }

  return guidance;
}

function renderGuidanceSummary() {
  if (!elements.guidanceSummary) {
    return;
  }

  const blockedReason = normalizeDraftGuidanceForWorkspace();
  const guidanceSummary = summarizeGuidanceList(elements.extraInstructionsInput?.value || "");
  elements.guidanceSummary.textContent = blockedReason
    ? `${guidanceSummary} ${blockedReason}`
    : guidanceSummary;
  renderTemplateChipSelection(blockedReason);
  if (!state.currentSessionId || !state.latestFinalMessage) {
    renderHomeReportPreview();
    renderReport();
  }
}

function appendLive(text) {
  const entry = normalizeLiveEntry(text);
  if (!entry) {
    return;
  }

  state.liveEntries.push({
    ...entry,
    time: formatClock()
  });
  renderLiveOutput();

  if (elements.autoScrollToggle.checked) {
    elements.liveOutput.scrollTop = elements.liveOutput.scrollHeight;
  }

  elements.lastUpdated.textContent = formatClock();
}

function addActivity() {}

function resetActivityFeed() {}

function normalizeLiveKind(kind) {
  const allowed = new Set(["status", "command", "tool", "insight", "note", "warning", "error", "success"]);
  return allowed.has(kind) ? kind : "note";
}

function shortenMultiline(value, maxLength = 420) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  const text = lines.join("\n");
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function preserveMultiline(value) {
  return normalizeReportText(value)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function stripBracketPrefix(text) {
  return String(text || "").replace(/^\[[^\]]+\]\s*/, "").trim();
}

function summarizeResultText(value, maxLength = 260) {
  const firstLine = String(value || "")
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .find(Boolean);

  if (!firstLine) {
    return "No result text was printed.";
  }

  return firstLine.length > maxLength ? `${firstLine.slice(0, maxLength - 3)}...` : firstLine;
}

function normalizeLiveEntry(input) {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    const text = input.trim();
    if (!text) {
      return null;
    }

    if (text.startsWith("[status]")) {
      return { kind: "status", label: "Run status", headline: stripBracketPrefix(text) };
    }

    if (text.startsWith("[stderr]")) {
      return { kind: "warning", label: "System note", headline: stripBracketPrefix(text) };
    }

    if (text.startsWith("[runtime blocked]")) {
      return { kind: "warning", label: "Runtime gate", headline: stripBracketPrefix(text) };
    }

    if (text.startsWith("[request error]") || text.startsWith("[stream error]") || text.startsWith("[error]")) {
      return { kind: "error", label: "Run error", headline: stripBracketPrefix(text) };
    }

    return { kind: "note", label: "Live note", headline: text };
  }

  const headline = compactWhitespace(input.headline || input.summary || input.text || "");
  const command = String(input.command || "").trim();
  const resultSummary = compactWhitespace(input.resultSummary || "");
  const detail = preserveMultiline(input.detail || "");
  if (!headline && !command && !resultSummary && !detail) {
    return null;
  }

  return {
    kind: normalizeLiveKind(input.kind),
    label: String(input.label || "Live update").trim() || "Live update",
    headline: headline || resultSummary || detail,
    command,
    resultSummary,
    detail: detail && detail !== (headline || resultSummary) ? detail : ""
  };
}

function renderLiveOutput() {
  if (!state.liveEntries.length) {
    elements.liveOutput.innerHTML = `
      <article class="stream-placeholder">
        <h4>The stream will explain each RCA step as it happens.</h4>
        <p>Start an RCA run to see local commands, support lookups, warnings, findings, and brief result summaries in one place.</p>
      </article>
    `;
    return;
  }

  elements.liveOutput.innerHTML = state.liveEntries
    .map(
      (entry) => `
        <article class="stream-entry stream-${escapeHtml(entry.kind)}">
          <div class="stream-entry-top">
            <span class="stream-badge">${escapeHtml(entry.label)}</span>
            <span class="stream-time">${escapeHtml(entry.time)}</span>
          </div>
          <p class="stream-summary">${escapeHtml(entry.headline)}</p>
          ${entry.command ? `
            <div class="stream-section">
              <span class="stream-section-label">Command</span>
              <pre class="stream-commandline">${escapeHtml(entry.command)}</pre>
            </div>
          ` : ""}
          ${entry.resultSummary ? `
            <div class="stream-section">
              <span class="stream-section-label">What it showed</span>
              <p class="stream-result-summary">${escapeHtml(entry.resultSummary)}</p>
            </div>
          ` : ""}
          ${entry.detail ? `<pre class="stream-detail">${escapeHtml(entry.detail)}</pre>` : ""}
        </article>
      `
    )
    .join("");
}

function parseAffectedFiles(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n|,|;/)
        .map((item) => item.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
    )
  );
}

function deriveVerificationLabel(sections, guidanceMode = getActiveGuidanceMode()) {
  if (guidanceMode === "evidence-first") {
    return "Evidence-only RCA";
  }

  if (guidanceMode === "product-generic") {
    return "Root Cause Report";
  }

  if (guidanceMode === "fix-from-rca") {
    return "Fix from RCA";
  }

  if (sections["Verification Loop"] && sections["UI Validation"]) {
    return "Verified + UI";
  }

  if (sections["Verification Loop"]) {
    return "Verified";
  }

  return "Pending";
}

function countMcpCalls(sections) {
  const text = String(sections["MCP Calls"] || "").trim();
  if (!text) {
    return 0;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const listLike = lines.filter((line) => /^[-*]|\d+\./.test(line));
  return listLike.length || lines.length;
}

function resetReport() {
  const presentation = getReportPresentation();
  state.latestFinalMessage = "";
  state.latestSections = {};
  state.latestRcaFields = {};
  state.activeReportSection = "rca";
  elements.reportSectionSummary.textContent = "0";
  elements.rcaFieldSummary.textContent = "0";
  elements.mcpCallSummary.textContent = "0";
  elements.activeSectionLabel.textContent = presentation.reportSectionName;
  syncReportChrome(presentation.mode);
  if (elements.reportNav) {
    elements.reportNav.innerHTML = "";
  }
  elements.reportBody.innerHTML = `
    <div class="report-empty">
      <h4>No final output yet</h4>
      <p>${escapeHtml(presentation.reportEmptyCopy)}</p>
    </div>
  `;
  renderHomeReportPreview();
}

function updateArtifactView() {
  if (!elements.artifactOutput || !elements.artifactTabs) {
    return;
  }

  const content = normalizeReportText(state.artifacts[state.activeArtifact] || "No artifact loaded.");
  elements.artifactOutput.textContent = content;

  elements.artifactTabs.querySelectorAll(".report-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.artifact === state.activeArtifact);
  });
}

function isRuntimeBlocked() {
  return !state.runtimeConfig.connected || Boolean(state.runtimeConfig.requireElevatedExecution && !state.runtimeConfig.elevated);
}

function getElevationInstructions(platform) {
  if (platform === "win32") {
    return {
      title: "Administrator startup required",
      detail: "Run this console with start-agent.cmd using Run as administrator. RCA, continuation, fix, and direct run actions stay disabled until the wrapper is elevated.",
      hint: "Workspace browsing, source-path edits, and saved sessions remain available before relaunch."
    };
  }

  return {
    title: "Elevated startup required",
    detail: "Restart this console with sudo ./start-agent.sh. RCA, continuation, fix, and direct run actions stay disabled until the wrapper is elevated.",
    hint: "Workspace browsing, source-path edits, and saved sessions remain available before relaunch."
  };
}

function getAgentOfflineInstructions() {
  return {
    title: "Local agent not connected",
    detail: `This page needs a localhost agent at ${state.agentBaseUrl || DEFAULT_AGENT_BASE_URL} to browse workspaces, run RCA, manage sessions, and launch Codex on the user machine.`,
    hint: "Start the local agent on this machine, or install its automatic startup service once, and this page will reconnect automatically."
  };
}

function renderAgentConnection() {
  if (!elements.agentConnectionHint) {
    return;
  }

  if (elements.agentPanel) {
    elements.agentPanel.hidden = true;
  }

  if (elements.agentBaseUrlInput) {
    elements.agentBaseUrlInput.value = state.agentBaseUrl || DEFAULT_AGENT_BASE_URL;
  }

  if (elements.connectAgentButton) {
    elements.connectAgentButton.hidden = true;
    elements.connectAgentButton.textContent = "Retry Agent";
  }

  if (elements.agentAdvancedPanel) {
    elements.agentAdvancedPanel.hidden = true;
    elements.agentAdvancedPanel.open = false;
  }

  elements.agentConnectionHint.hidden = true;
  elements.agentConnectionHint.textContent = "";
}

function renderRuntimeBlocker() {
  const agentOffline = !state.runtimeConfig.connected;
  const blocked = agentOffline || isRuntimeBlocked();
  elements.runtimeBlocker.hidden = !blocked;

  if (!blocked) {
    return;
  }

  const instructions = agentOffline ? getAgentOfflineInstructions() : getElevationInstructions(state.runtimeConfig.platform);
  elements.runtimeBlockerTitle.textContent = instructions.title;
  elements.runtimeBlockerDetail.textContent = instructions.detail;
  elements.runtimeBlockerHint.textContent = instructions.hint;
}

function setSteerPanelOpen(nextOpen, options = {}) {
  const open = Boolean(nextOpen);
  const shouldFocus = Boolean(options.focusInput);
  state.steerPanelOpen = open;

  if (elements.steerPanel) {
    elements.steerPanel.hidden = !open;
  }

  if (elements.steerToggleButton) {
    elements.steerToggleButton.classList.toggle("is-open", open);
    elements.steerToggleButton.setAttribute("aria-expanded", String(open));
    elements.steerToggleButton.textContent = open ? "Steer Input On" : "Steer Input Off";
  }

  if (open && shouldFocus && elements.interactionInput && !elements.interactionInput.disabled) {
    elements.interactionInput.focus();
  }
}

function toggleSteerPanel() {
  if (elements.steerToggleButton?.disabled) {
    return;
  }

  setSteerPanelOpen(!state.steerPanelOpen, { focusInput: !state.steerPanelOpen });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch (error) {
      body = "";
    }

    let message = body || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      message = parsed.error || parsed.message || message;
    } catch (error) {
      // Plain text or HTML response. Keep the raw body.
    }

    throw new Error(message);
  }

  return response.json();
}

async function fetchHostedWorkspaceJson(pathname, params = {}) {
  const url = new URL(pathname, `${getHostedWorkspaceApiBaseUrl()}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return fetchJson(url.toString());
}

async function postHostedWorkspaceJson(pathname, body = {}) {
  const url = new URL(pathname, `${getHostedWorkspaceApiBaseUrl()}/`);
  return fetchJson(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function requestHostedWorkspaceAccessToken() {
  const payload = await postHostedWorkspaceJson("/api/shared-workspaces/token", {});
  const token = compactWhitespace(payload?.token || "");
  if (!token) {
    throw new Error("The hosted UI did not return a shared workspace access token.");
  }
  return token;
}

async function loadHostedWorkspaceRoots() {
  try {
    const payload = await fetchHostedWorkspaceJson("/api/shared-workspaces");
    state.hostedWorkspaceRoots = Array.isArray(payload.roots) ? payload.roots : [];
  } catch (error) {
    state.hostedWorkspaceRoots = [];
  }

  applyPreferredWorkspaceForProduct(getCurrentProductSelection({ allowFallback: false }));
}

function getHostedWorkspaceRootForProduct(product) {
  if (!state.hostedWorkspaceRoots.length) {
    return null;
  }

  const normalizedProductKey = compactWhitespace(product?.key || "").toLowerCase();
  if (normalizedProductKey) {
    const matchingRoot = state.hostedWorkspaceRoots.find((root) => compactWhitespace(root.productKey || "").toLowerCase() === normalizedProductKey);
    if (matchingRoot) {
      return matchingRoot;
    }
  }

  return state.hostedWorkspaceRoots.length === 1 ? state.hostedWorkspaceRoots[0] : null;
}

function getPreferredWorkspaceForProduct(product) {
  if (!product) {
    return "";
  }

  const hostedRoot = getHostedWorkspaceRootForProduct(product);
  if (hostedRoot) {
    return buildSharedWorkspaceDescriptor(hostedRoot.id);
  }

  const localWorkspace = compactWhitespace(product.defaultWorkspace || "");
  if (localWorkspace) {
    return localWorkspace;
  }

  return "";
}

function shouldReplaceWorkspaceForProduct(product, currentWorkspace = elements.workspaceInput.value) {
  const currentValue = compactWhitespace(currentWorkspace);
  if (!currentValue) {
    return true;
  }

  const sharedWorkspace = parseSharedWorkspaceDescriptor(currentValue);
  if (!sharedWorkspace) {
    return false;
  }

  const hostedRoot = getHostedWorkspaceRootForProduct(product);
  if (!hostedRoot) {
    return false;
  }

  return sharedWorkspace.rootId !== hostedRoot.id || Boolean(sharedWorkspace.relativePath);
}

function applyPreferredWorkspaceForProduct(product, options = {}) {
  const { force = false } = options;
  const preferredWorkspace = getPreferredWorkspaceForProduct(product);
  if (!preferredWorkspace && !force) {
    return;
  }

  if (!force && !shouldReplaceWorkspaceForProduct(product)) {
    return;
  }

  elements.workspaceInput.value = preferredWorkspace;
}

async function loadArtifacts() {
  state.artifacts = await fetchJson(apiUrl("/api/artifacts"));
  updateArtifactView();
}

function updateCurrentSessionSummary(session) {
  const request = session?.request || {};
  const product = state.productMap[request.product] || findProductByInput(request.productLabel) || getCurrentProductSelection({ allowFallback: false });
  state.currentSessionStatus = session?.status || "";
  elements.sessionNameSummary.textContent = request.displayName || "Not started";
  elements.currentSessionId.textContent = session?.id || "Not started";
  elements.productSummary.textContent = request.productLabel || product?.family || "Not selected";
  elements.workspaceSummary.textContent = request.workspace || elements.workspaceInput.value.trim() || "Not loaded";
  elements.ticketSummary.textContent = request.ticketId || elements.ticketIdInput.value.trim() || "Not provided";
  elements.versionSummary.textContent = request.version || elements.versionInput.value.trim() || "Not provided";
  elements.finalState.textContent = session?.status || "No final report yet";
}

function resetToFreshSessionDraft() {
  const selectedProduct = getCurrentProductSelection() || state.products[0];
  if (selectedProduct) {
    state.selectedProductKey = selectedProduct.key || "";
    elements.productInput.value = selectedProduct.family || "";
    applyPreferredWorkspaceForProduct(selectedProduct, { force: true });
  } else {
    elements.productInput.value = "";
    elements.workspaceInput.value = "";
  }

  state.currentSessionId = "";
  state.currentSessionStatus = "";
  state.latestFinalMessage = "";
  state.latestSections = {};
  state.latestRcaFields = {};
  state.activeReportSection = "rca";
  elements.ticketIdInput.value = "";
  elements.issueTitleInput.value = "";
  elements.versionInput.value = "";
  elements.extraInstructionsInput.value = PRODUCT_GENERIC_GUIDANCE;
  if (elements.interactionInput) {
    elements.interactionInput.value = "";
  }

  stopElapsedClock();
  updateCurrentSessionSummary(null);
  updateFormSummaries();
  resetReport();
  updateButtons();
  selectSessionCard();
}

function buildDraftSessionName() {
  const issueTitle = elements.issueTitleInput.value.trim();
  if (issueTitle) {
    return issueTitle;
  }

  const ticketId = elements.ticketIdInput.value.trim();
  if (ticketId) {
    return ticketId;
  }

  const product = getCurrentProductSelection();
  return `${product?.family || "Oracle Restaurants"} RCA session`;
}

function plainTextFromMarkdown(value) {
  return compactWhitespace(
    String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^#+\s*/gm, "")
  );
}

function cleanMetricText(value, fallback = "-") {
  const text = plainTextFromMarkdown(value).replace(/^[-:]\s*/, "").trim();
  return text || fallback;
}

function extractMarkdownFields(markdown, fieldNames) {
  const source = String(markdown || "");
  const extracted = {};

  for (const field of fieldNames) {
    const pattern = new RegExp(
      `\\*\\*${escapeRegExp(field)}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*[^\\n]+\\*\\*:|$)`,
      "i"
    );
    const match = source.match(pattern);
    if (match) {
      extracted[field] = match[1].trim();
    }
  }

  return extracted;
}

function getNormalizedRcaFields(rcaFields = {}, sections = {}) {
  const merged = { ...(rcaFields || {}) };
  const derived = extractMarkdownFields(sections.RCA || "", [
    "Comments",
    "Comment Evidence",
    "Audit History",
    "Attachment Evidence",
    "Attachments",
    "Reproducible Evidence",
    "Subsystem",
    "Investigation Tier",
    "Culprit",
    "Call Chain",
    "Root Cause Code",
    "Code Evidence",
    "Log Evidence",
    "Why It Fails",
    "Complete Fix",
    "Fix Explanation",
    "Proposed Diff",
    "All Affected Files",
    "Confidence",
    "Remaining Uncertainty"
  ]);

  for (const [field, value] of Object.entries(derived)) {
    if (value && !merged[field]) {
      merged[field] = value;
    }
  }

  return merged;
}

function getEvidenceOnlyRcaFields(rcaFields, sections) {
  const normalizedFields = getNormalizedRcaFields(rcaFields, sections);
  const allowedOrder = [
    "Comments",
    "Comment Evidence",
    "Audit History",
    "Attachment Evidence",
    "Attachments",
    "Log Evidence",
    "Reproducible Evidence",
    "Confidence",
    "Remaining Uncertainty"
  ];

  return allowedOrder
    .filter((field) => normalizedFields[field])
    .map((field) => [field, normalizedFields[field]]);
}

function renderInlineMarkdown(value) {
  const tokens = [];
  let source = String(value || "");

  source = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
    const token = `
      <span class="markdown-link">
        <span>${escapeHtml(label)}</span>
        <code>${escapeHtml(target)}</code>
      </span>
    `;
    return `@@MDTOKEN${tokens.push(token) - 1}@@`;
  });

  source = source.replace(/`([^`]+)`/g, (_, code) => {
    const token = `<code>${escapeHtml(code)}</code>`;
    return `@@MDTOKEN${tokens.push(token) - 1}@@`;
  });

  source = source.replace(/\*\*([^*]+)\*\*/g, (_, strong) => {
    const token = `<strong>${escapeHtml(strong)}</strong>`;
    return `@@MDTOKEN${tokens.push(token) - 1}@@`;
  });

  source = source.replace(/\*([^*\n]+)\*/g, (_, emphasis) => {
    const token = `<em>${escapeHtml(emphasis)}</em>`;
    return `@@MDTOKEN${tokens.push(token) - 1}@@`;
  });

  return escapeHtml(source).replace(/@@MDTOKEN(\d+)@@/g, (_, index) => tokens[Number(index)] || "");
}

function renderMarkdownSection(markdown) {
  const source = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return `<p class="section-copy">No content available.</p>`;
  }

  const blocks = [];
  const lines = source.split("\n");
  let paragraphLines = [];
  let listType = "";
  let listItems = [];
  let codeFence = "";
  let codeLines = [];
  let quoteLines = [];

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }
    blocks.push(`<p>${paragraphLines.map((line) => renderInlineMarkdown(line)).join("<br>")}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (!listItems.length || !listType) {
      return;
    }
    const tag = listType === "ordered" ? "ol" : "ul";
    const className = listType === "ordered" ? "markdown-list markdown-list-ordered" : "markdown-list";
    blocks.push(`
      <${tag} class="${className}">
        ${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}
      </${tag}>
    `);
    listType = "";
    listItems = [];
  }

  function flushQuote() {
    if (!quoteLines.length) {
      return;
    }
    blocks.push(`
      <div class="markdown-callout">
        ${quoteLines.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join("")}
      </div>
    `);
    quoteLines = [];
  }

  function flushCode() {
    if (!codeFence) {
      return;
    }
    const language = codeFence.replace(/^```+/, "").trim();
    blocks.push(`
      <div class="structured-codeblock ${language ? "structured-codeblock-fenced" : ""}">
        ${language ? `<div class="structured-codeblock-head"><span>${escapeHtml(language)}</span></div>` : ""}
        <pre class="markdown-codeblock structured-codeblock-body">${escapeHtml(codeLines.join("\n"))}</pre>
      </div>
    `);
    codeFence = "";
    codeLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      if (codeFence) {
        flushCode();
      } else {
        codeFence = trimmed;
      }
      continue;
    }

    if (codeFence) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      flushList();
      quoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = Math.min(4, (trimmed.match(/^#+/) || ["#"])[0].length + 1);
      const title = trimmed.replace(/^#{1,4}\s+/, "");
      blocks.push(`<h${level} class="markdown-heading">${renderInlineMarkdown(title)}</h${level}>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "unordered") {
        flushList();
      }
      listType = "unordered";
      listItems.push(line.replace(/^\s*[-*+]\s+/, ""));
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ordered") {
        flushList();
      }
      listType = "ordered";
      listItems.push(line.replace(/^\s*\d+\.\s+/, ""));
      continue;
    }

    flushList();
    flushQuote();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushCode();

  return blocks.join("");
}

function summarizeFieldText(value, maxLength = 220) {
  const text = cleanMetricText(value, "");
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function renderStructuredCodeBlock(value, options = {}) {
  const tone = String(options.tone || "").trim();
  const eyebrow = String(options.eyebrow || "").trim();
  return `
    <div class="structured-codeblock ${tone}">
      ${eyebrow ? `<div class="structured-codeblock-head"><span>${escapeHtml(eyebrow)}</span></div>` : ""}
      <pre class="markdown-codeblock structured-codeblock-body">${escapeHtml(String(value || "").trim())}</pre>
    </div>
  `;
}

function looksLikeDiffSnippet(value) {
  const text = String(value || "").trim();
  if (!text || /^```/.test(text)) {
    return false;
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.length >= 2 && (
    /^diff --git\b/m.test(text)
    || /^@@ /m.test(text)
    || (/^[+-][^\r\n]+/m.test(text) && /^(---|\+\+\+)/m.test(text))
  );
}

function looksLikeCodeSnippet(value) {
  const text = String(value || "").trim();
  if (!text || /^```/.test(text)) {
    return false;
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.length >= 2 && (
    /[{};]/.test(text)
    || /\b(if|else|return|throw|catch|public|private|protected|class|function|const|let|var|switch|case|try)\b/.test(text)
    || /=>/.test(text)
    || /<[A-Za-z][^>]*>/.test(text)
  );
}

function looksLikeLogSnippet(value) {
  const text = String(value || "").trim();
  if (!text || /^```/.test(text)) {
    return false;
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.length >= 2 && (
    /\b(exception|error|fatal|warn|stack trace|nullreference|timeout)\b/i.test(text)
    || /\bat\s+[A-Za-z_][\w.:<>]+\(/.test(text)
    || /\d{2}:\d{2}:\d{2}/.test(text)
    || /\d{4}-\d{2}-\d{2}/.test(text)
  );
}

function getCallChainSteps(value) {
  const source = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return [];
  }

  const segments = source.includes("\n")
    ? source.split("\n")
    : source.split(/\s*(?:->|=>|→|⇒|-->)\s*/);

  return Array.from(
    new Set(
      segments
        .map((segment) => segment.replace(/^\s*(?:[-*]|\d+\.)\s*/, "").trim())
        .filter(Boolean)
    )
  );
}

function renderCallChainFlow(value) {
  const steps = getCallChainSteps(value);
  if (steps.length < 2) {
    return "";
  }

  return `
    <ol class="call-chain-flow">
      ${steps
        .map(
          (step, index) => `
            <li class="call-chain-step">
              <span class="call-chain-index">${index + 1}</span>
              <div class="call-chain-copy">${renderInlineMarkdown(step)}</div>
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

function renderAffectedFilePills(value) {
  const files = parseAffectedFiles(value);
  if (!files.length) {
    return "";
  }

  return `
    <div class="affected-file-list">
      ${files.map((file) => `<code class="affected-file-pill">${escapeHtml(file)}</code>`).join("")}
    </div>
  `;
}

function getStructuredFieldClass(field) {
  const classes = [];
  if ([
    "Call Chain",
    "Root Cause Code",
    "Code Evidence",
    "Log Evidence",
    "Complete Fix",
    "Fix Explanation",
    "Proposed Diff",
    "All Affected Files",
    "Remaining Uncertainty",
    "Comment Evidence",
    "Audit History",
    "Attachment Evidence",
    "Reproducible Evidence"
  ].includes(field)) {
    classes.push("field-span-full");
  }

  if (field === "Root Cause Code") {
    classes.push("field-emphasis-code");
  }

  if (field === "Code Evidence") {
    classes.push("field-emphasis-code");
  }

  if (field === "Log Evidence") {
    classes.push("field-emphasis-log");
  }

  if (field === "Proposed Diff") {
    classes.push("field-emphasis-code");
  }

  if (field === "Call Chain") {
    classes.push("field-emphasis-chain");
  }

  if (field === "All Affected Files") {
    classes.push("field-emphasis-files");
  }

  return classes.join(" ");
}

function renderStructuredFieldBody(field, value) {
  const text = String(value || "").trim();
  if (!text) {
    return `<p class="section-copy">No content available.</p>`;
  }

  if (field === "Call Chain") {
    const flow = renderCallChainFlow(text);
    if (flow) {
      return flow;
    }
  }

  if (field === "All Affected Files") {
    const filePills = renderAffectedFilePills(text);
    if (filePills) {
      return filePills;
    }
  }

  if (field === "Root Cause Code" && looksLikeCodeSnippet(text)) {
    return renderStructuredCodeBlock(text, {
      eyebrow: "Correlated code path",
      tone: "structured-codeblock-code"
    });
  }

  if (field === "Code Evidence") {
    return renderStructuredCodeBlock(text, {
      eyebrow: "Code Evidence",
      tone: "structured-codeblock-code"
    });
  }

  if (field === "Log Evidence" && looksLikeLogSnippet(text)) {
    return renderStructuredCodeBlock(text, {
      eyebrow: "Runtime evidence",
      tone: "structured-codeblock-log"
    });
  }

  if ((field === "Comment Evidence" || field === "Attachment Evidence" || field === "Audit History") && looksLikeLogSnippet(text)) {
    return renderStructuredCodeBlock(text, {
      eyebrow: field,
      tone: "structured-codeblock-log"
    });
  }

  if (field === "Proposed Diff" && (looksLikeDiffSnippet(text) || /^```/m.test(text))) {
    return renderStructuredCodeBlock(
      text.replace(/^```diff\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim(),
      {
        eyebrow: "Proposed Diff",
        tone: "structured-codeblock-code"
      }
    );
  }

  return renderMarkdownSection(text);
}

function getOrderedSections(sections, rcaFields) {
  const presentation = getReportPresentation();
  const evidenceOnlyMode = presentation.mode === "evidence-first";
  const rootCauseMode = presentation.mode === "product-generic";
  const mergedRcaFields = getNormalizedRcaFields(rcaFields, sections);
  const orderedNames = [
    "Plan",
    "MCP Calls",
    "Result Summary",
    "RCA",
    "Verification Loop",
    "UI Validation",
    "Step-by-Step Solution"
  ];

  return orderedNames
    .map((name) => {
      if (name === "RCA") {
        const rcaMarkdown = String(sections.RCA || "").trim();
        const rcaEntries = evidenceOnlyMode
          ? getEvidenceOnlyRcaFields(mergedRcaFields, sections)
          : Object.entries(mergedRcaFields).filter(([, value]) => value);
        if (!rcaMarkdown && !rcaEntries.length) {
          return null;
        }

        return {
          key: "rca",
          name: presentation.reportSectionName,
          type: evidenceOnlyMode
            ? "fields"
            : rootCauseMode && rcaEntries.length
              ? "root-cause"
              : !rcaMarkdown
                ? "fields"
                : "markdown",
          value: evidenceOnlyMode || rootCauseMode ? "" : rcaMarkdown,
          fields: rcaEntries,
          featured: true
        };
      }

      const value = sections[name];
      if (!value) {
        return null;
      }

      return {
        key: slugifySectionName(name),
        name,
        type: "markdown",
        value
      };
    })
    .filter(Boolean);
}

function getImportantRcaFields(rcaFields, sections, guidanceMode = getActiveGuidanceMode()) {
  if (guidanceMode === "evidence-first") {
    return getEvidenceOnlyRcaFields(rcaFields, sections);
  }

  const preferredOrder = [
        "Subsystem",
        "Culprit",
        "Root Cause Code",
        "Code Evidence",
        "Log Evidence",
        "Why It Fails",
        "Complete Fix",
        "Fix Explanation",
        "Proposed Diff",
        "All Affected Files",
        "Confidence",
        "Remaining Uncertainty"
      ];

  const normalizedFields = getNormalizedRcaFields(rcaFields, sections);
  const entries = [];
  const seen = new Set();

  for (const field of preferredOrder) {
    if (normalizedFields[field]) {
      entries.push([field, normalizedFields[field]]);
      seen.add(field);
    }
  }

  for (const [field, value] of Object.entries(normalizedFields)) {
    if (value && !seen.has(field)) {
      entries.push([field, value]);
    }
  }

  return entries;
}

function renderFieldGrid(fields) {
  const highlightFields = new Set([
    "Comments",
    "Audit History",
    "Attachments",
    "Subsystem",
    "Root Cause Code",
    "Code Evidence",
    "Log Evidence",
    "Reproducible Evidence",
    "Why It Fails",
    "Complete Fix",
    "Proposed Diff",
    "Confidence"
  ]);

  return `
    <div class="field-grid">
      ${fields
        .map(
          ([field, value]) => `
            <article class="field-card ${highlightFields.has(field) ? "field-card-highlight" : ""} ${getStructuredFieldClass(field)}">
              <h5>${escapeHtml(field)}</h5>
              <div class="rich-report rich-report-field">${renderStructuredFieldBody(field, value)}</div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

// BUG-RCA| clinerules-root-cause-layout| render the .clinerules RCA as a structured readable report
function renderRootCauseReport(fields, sections = {}) {
  const entries = Array.isArray(fields) ? fields.filter(([, value]) => value) : [];
  if (!entries.length) {
    return "";
  }

  const fieldMap = Object.fromEntries(entries);
  const resultSummary = String(sections["Result Summary"] || "").trim();
  const affectedFiles = parseAffectedFiles(fieldMap["All Affected Files"] || "");
  const metrics = [
    ["Subsystem", fieldMap.Subsystem || ""],
    ["Investigation Tier", fieldMap["Investigation Tier"] || ""],
    ["Culprit", fieldMap.Culprit || ""],
    ["Confidence", fieldMap.Confidence || ""],
    ["Affected Files", affectedFiles.length ? String(affectedFiles.length) : ""]
  ].filter(([, value]) => cleanMetricText(value, "") !== "");
  const spotlightCards = [
    ["Primary Culprit", fieldMap.Culprit || "", "root-cause-spotlight-analysis"],
    ["Failure Mechanism", fieldMap["Why It Fails"] || fieldMap["Root Cause Code"] || "", "root-cause-spotlight-analysis"],
    ["Complete Fix Scope", fieldMap["Complete Fix"] || fieldMap["Fix Explanation"] || "", "root-cause-spotlight-fix"]
  ].filter(([, value]) => cleanMetricText(value, "") !== "");
  const groups = [
    {
      title: "Evidence",
      className: "root-cause-group-evidence",
      fields: ["Comments", "Comment Evidence", "Audit History", "Attachments", "Attachment Evidence", "Reproducible Evidence", "Log Evidence"]
    },
    {
      title: "Root Cause Analysis",
      className: "root-cause-group-analysis",
      fields: ["Call Chain", "Root Cause Code", "Code Evidence", "Why It Fails"]
    },
    {
      title: "Complete Fix Scope",
      className: "root-cause-group-fix",
      fields: ["Complete Fix", "Fix Explanation", "Proposed Diff", "All Affected Files", "Remaining Uncertainty"]
    }
  ];
  const consumedFields = new Set(["Subsystem", "Investigation Tier", "Culprit", "Confidence"]);

  const groupMarkup = groups
    .map((group) => {
      const groupEntries = group.fields
        .map((field) => [field, fieldMap[field]])
        .filter(([, value]) => value);
      if (!groupEntries.length) {
        return "";
      }
      for (const [field] of groupEntries) {
        consumedFields.add(field);
      }

      return `
        <section class="root-cause-group ${group.className}">
          <div class="root-cause-group-head">
            <h5>${escapeHtml(group.title)}</h5>
          </div>
          <div class="root-cause-card-grid">
            ${groupEntries
              .map(
                ([field, value]) => `
                  <article class="root-cause-card ${getStructuredFieldClass(field)}">
                    <span class="root-cause-card-label">${escapeHtml(field)}</span>
                    <div class="rich-report rich-report-field">${renderStructuredFieldBody(field, value)}</div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .filter(Boolean)
    .join("");

  const additionalEntries = entries.filter(([field]) => !consumedFields.has(field));
  const additionalMarkup = additionalEntries.length
    ? `
      <section class="root-cause-group">
        <div class="root-cause-group-head">
          <h5>Additional RCA Findings</h5>
        </div>
        <div class="root-cause-card-grid">
          ${additionalEntries
            .map(
              ([field, value]) => `
                <article class="root-cause-card ${getStructuredFieldClass(field)}">
                  <span class="root-cause-card-label">${escapeHtml(field)}</span>
                  <div class="rich-report rich-report-field">${renderStructuredFieldBody(field, value)}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `
    : "";

  return `
    <div class="root-cause-report">
      ${resultSummary
        ? `
          <section class="root-cause-summary">
            <span class="root-cause-summary-label">RCA Summary</span>
            <div class="rich-report">${renderMarkdownSection(resultSummary)}</div>
          </section>
        `
        : ""}
      ${spotlightCards.length
        ? `
          <section class="root-cause-spotlight">
            ${spotlightCards
              .map(
                ([label, value, className]) => `
                  <article class="root-cause-spotlight-card ${className}">
                    <span class="root-cause-spotlight-label">${escapeHtml(label)}</span>
                    <p>${escapeHtml(summarizeFieldText(value, 260))}</p>
                  </article>
                `
              )
              .join("")}
          </section>
        `
        : ""}
      ${metrics.length
        ? `
          <section class="root-cause-metrics">
            ${metrics
              .map(
                ([label, value]) => `
                  <article class="root-cause-metric">
                    <span>${escapeHtml(label)}</span>
                    <strong>${escapeHtml(cleanMetricText(value, "-"))}</strong>
                  </article>
                `
              )
              .join("")}
          </section>
        `
        : ""}
      ${groupMarkup}
      ${additionalMarkup}
    </div>
  `;
}

function renderHomeReportPreview() {
  const presentation = getResolvedReportPresentation();
  const normalizedRcaFields = getNormalizedRcaFields(state.latestRcaFields, state.latestSections);
  const fallbackFields = getImportantRcaFields(state.latestRcaFields, state.latestSections, presentation.mode);
  const rootCauseEntries = Object.entries(normalizedRcaFields).filter(([, value]) => value);
  const rcaMarkdown = String(state.latestSections.RCA || "").trim();
  const failureDetails = !rcaMarkdown && !fallbackFields.length ? String(state.latestFinalMessage || "").trim() : "";

  if (!elements.homeDeepRca) {
    return;
  }

  syncReportChrome(presentation.mode);

  if (!rcaMarkdown && !fallbackFields.length) {
    if (failureDetails && ["failed", "cancelled", "interrupted"].includes(String(state.currentSessionStatus || "").toLowerCase())) {
      elements.homeDeepRca.innerHTML = `
        <article class="report-section-card report-section-card-featured home-rca-card">
          <div class="section-header">
            <div>
              <span class="section-tag">${escapeHtml(presentation.reportTag)}</span>
              <h4>${escapeHtml(presentation.homeEmptyTitle)}</h4>
            </div>
          </div>
          <p class="report-focus-copy">${escapeHtml(presentation.homeEmptyCopy)}</p>
          <pre class="markdown-codeblock">${escapeHtml(failureDetails)}</pre>
        </article>
      `;
      return;
    }

    elements.homeDeepRca.innerHTML = `
      <div class="report-empty">
        <h4>${escapeHtml(presentation.homeEmptyTitle)}</h4>
        <p>${escapeHtml(presentation.homeEmptyCopy)}</p>
      </div>
    `;
    return;
  }

  elements.homeDeepRca.innerHTML = `
    <article class="report-section-card report-section-card-featured home-rca-card ${presentation.tagClassName ? "report-section-card-evidence" : ""}">
      <div class="section-header">
        <div>
          <span class="section-tag ${presentation.tagClassName}">${escapeHtml(presentation.reportTag)}</span>
          <h4>${escapeHtml(presentation.homeTitle)}</h4>
        </div>
      </div>
      ${presentation.focusCopy ? `<p class="report-focus-copy">${escapeHtml(presentation.focusCopy)}</p>` : ""}
      ${presentation.mode === "product-generic" && rootCauseEntries.length
        ? renderRootCauseReport(rootCauseEntries, state.latestSections)
        : fallbackFields.length
          ? renderFieldGrid(fallbackFields)
          : `<div class="rich-report">${renderMarkdownSection(rcaMarkdown)}</div>`}
    </article>
  `;
}

function renderReportSectionContent(item) {
  if (item.type === "root-cause") {
    return renderRootCauseReport(item.fields || [], state.latestSections);
  }

  if (item.type === "fields") {
    return renderFieldGrid(item.fields || []);
  }

  return renderMarkdownSection(item.value);
}

function updateSummary(session) {
  const guidanceMode = getActiveGuidanceMode(session);
  const sections = session?.parsed?.sections || state.latestSections;
  const rcaFields = getNormalizedRcaFields(session?.parsed?.rcaFields || state.latestRcaFields, sections);
  const summary = session?.summary || {};
  const affectedFiles = summary.affectedFiles?.length
    ? summary.affectedFiles
    : parseAffectedFiles(rcaFields["All Affected Files"]);
  const preview = summary.preview || sections["Result Summary"] || sections.RCA || state.latestFinalMessage || "No investigation selected.";

  elements.summaryConfidence.textContent = cleanMetricText(rcaFields.Confidence || summary.confidence || "-", "-");
  elements.summarySubsystem.textContent = cleanMetricText(rcaFields.Subsystem || summary.subsystem || "-", "-");
  elements.summaryAffectedFiles.textContent = String(affectedFiles.length);
  elements.summaryVerification.textContent = deriveVerificationLabel(sections, guidanceMode);
  elements.summaryPreview.textContent = plainTextFromMarkdown(preview) || "No investigation selected.";
  elements.reportSectionSummary.textContent = String(Object.values(sections).filter(Boolean).length);
  elements.rcaFieldSummary.textContent = String(Object.values(rcaFields).filter(Boolean).length);
  elements.mcpCallSummary.textContent = String(countMcpCalls(sections));
  renderHomeReportPreview();
}

function renderReport() {
  const presentation = getResolvedReportPresentation();
  const items = getOrderedSections(state.latestSections, state.latestRcaFields);
  const failureDetails = !items.length ? String(state.latestFinalMessage || "").trim() : "";
  syncReportChrome(presentation.mode);

  if (!items.length) {
    elements.activeSectionLabel.textContent = presentation.reportSectionName;
    elements.reportNav.hidden = true;
    elements.reportNav.classList.add("report-nav-hidden");
    elements.reportNav.innerHTML = "";
    if (failureDetails && ["failed", "cancelled", "interrupted"].includes(String(state.currentSessionStatus || "").toLowerCase())) {
      elements.reportBody.innerHTML = `
        <article class="report-section-card report-section-card-featured">
          <div class="section-header">
            <div>
              <span class="section-tag">${escapeHtml(presentation.reportTag)}</span>
              <h4>${escapeHtml(presentation.homeEmptyTitle)}</h4>
            </div>
          </div>
          <p class="report-focus-copy">${escapeHtml(presentation.reportEmptyCopy)}</p>
          <pre class="markdown-codeblock">${escapeHtml(failureDetails)}</pre>
        </article>
      `;
      return;
    }

    elements.reportBody.innerHTML = `
      <div class="report-empty">
        <h4>${escapeHtml(presentation.homeEmptyTitle)}</h4>
        <p>${escapeHtml(presentation.reportEmptyCopy)}</p>
      </div>
    `;
    return;
  }

  const activeItem = items.find((item) => item.key === state.activeReportSection)
    || items.find((item) => item.key === "rca")
    || items[0];
  state.activeReportSection = activeItem.key;
  elements.activeSectionLabel.textContent = activeItem.name;
  elements.reportNav.hidden = false;
  elements.reportNav.classList.remove("report-nav-hidden");
  elements.reportNav.innerHTML = items
    .map(
      (item) => `
        <button type="button" class="report-tab ${item.key === state.activeReportSection ? "active" : ""}" data-section="${escapeHtml(item.key)}">
          ${escapeHtml(item.name)}
        </button>
      `
    )
    .join("");

  elements.reportBody.innerHTML = `
    <div class="report-stack">
      ${items
        .map(
          (item) => `
            <section
              class="report-section-card ${item.featured ? "report-section-card-featured" : ""} ${item.key === state.activeReportSection ? "report-section-card-active" : ""} ${item.key === "rca" && presentation.tagClassName ? "report-section-card-evidence" : ""}"
              data-report-anchor="${escapeHtml(item.key)}"
            >
              <div class="section-header">
                <div>
                  <span class="section-tag ${item.key === "rca" && presentation.tagClassName ? presentation.tagClassName : ""}">
                    ${escapeHtml(item.key === "rca" ? presentation.reportTag : "Pipeline section")}
                  </span>
                  <h4>${escapeHtml(item.name)}</h4>
                </div>
              </div>
              <div class="rich-report">
                ${renderReportSectionContent(item)}
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
}

function updateButtons() {
  const hasSession = Boolean(state.currentSessionId);
  const running = Boolean(state.controller);
  const runtimeBlocked = isRuntimeBlocked();
  const agentConnected = Boolean(state.runtimeConfig.connected);
  if (elements.downloadContextButton) {
    elements.downloadContextButton.disabled = !hasSession;
  }
  elements.runButton.disabled = running || runtimeBlocked;
  if (elements.browseWorkspaceButton) {
    elements.browseWorkspaceButton.disabled = !agentConnected;
  }
  if (elements.refreshSessionsButton) {
    elements.refreshSessionsButton.disabled = !agentConnected;
  }
  if (elements.refreshArtifactsButton) {
    elements.refreshArtifactsButton.disabled = !agentConnected;
  }
  if (elements.connectAgentButton) {
    elements.connectAgentButton.disabled = running;
  }
  if (elements.continueInteractionButton) {
    elements.continueInteractionButton.disabled = runtimeBlocked;
  }
  if (elements.interactionInput) {
    elements.interactionInput.disabled = runtimeBlocked;
  }
  if (elements.steerToggleButton) {
    elements.steerToggleButton.disabled = runtimeBlocked;
  }
  if (runtimeBlocked && state.steerPanelOpen) {
    setSteerPanelOpen(false);
  }
  elements.stopButton.disabled = !running;
  if (elements.liveStopButton) {
    elements.liveStopButton.disabled = !running;
  }
}

function selectSessionCard() {
  elements.sessionList.querySelectorAll(".session-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.sessionCard === state.currentSessionId);
  });
  elements.sessionList.querySelectorAll(".session-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.sessionId === state.currentSessionId);
  });
}

function renderSessionList() {
  elements.savedSessionsCount.textContent = String(state.sessions.length);
  if (elements.deleteAllSessionsButton) {
    const hasDeletableSessions = state.sessions.some((session) => session.status !== "running");
    elements.deleteAllSessionsButton.disabled = !state.sessions.length || !hasDeletableSessions;
  }

  if (!state.sessions.length) {
    elements.sessionList.innerHTML = `
      <article class="session-item empty">
        <strong>No saved sessions yet</strong>
        <p>Completed RCA sessions and any separate local fix sessions will appear here automatically.</p>
      </article>
    `;
    return;
  }

  elements.sessionList.innerHTML = state.sessions
    .map((session) => {
      const summary = session.summary || {};
      const title = session.request?.displayName || summary.displayName || session.request?.ticketId || session.id;
      const subtitle = session.request?.ticketId && session.request?.ticketId !== title ? session.request.ticketId : session.id;
      const isRunning = session.status === "running";
      const guidanceLabel = formatGuidanceModeLabel(getSessionGuidanceMode(session));
      const tags = [
        getSessionProductLabel(session),
        guidanceLabel,
        session.request?.version || "",
        summary.confidence || session.status
      ].filter(Boolean);

      return `
        <article class="session-card ${session.id === state.currentSessionId ? "active" : ""}" data-session-card="${escapeHtml(session.id)}">
          <button type="button" class="session-item ${session.id === state.currentSessionId ? "active" : ""}" data-session-id="${escapeHtml(session.id)}">
            <div class="session-meta">
              <span>${escapeHtml(formatDateTime(session.startedAt))}</span>
              <span>${escapeHtml(formatDuration(session.durationMs))}</span>
            </div>
            <div class="session-title-row">
              <strong>${escapeHtml(title)}</strong>
              <span class="session-id-chip">${escapeHtml(subtitle)}</span>
            </div>
            <p>${escapeHtml(summary.preview || "No preview available.")}</p>
            <div class="session-tags">
              ${tags.map((tag) => `<span class="session-tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </button>
          <div class="session-actions">
            <button
              type="button"
              class="secondary-button session-stop-button"
              data-stop-session-id="${escapeHtml(session.id)}"
              aria-label="Stop ${escapeHtml(title)}"
              ${isRunning ? "" : "disabled"}
            >Stop</button>
            <button
              type="button"
              class="ghost-button session-delete-button"
              data-delete-session-id="${escapeHtml(session.id)}"
              aria-label="Delete ${escapeHtml(title)}"
              ${isRunning ? "disabled" : ""}
            >${isRunning ? "Running" : "Delete"}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function applySession(session) {
  state.currentSessionId = session.id || "";
  state.latestFinalMessage = session?.output?.finalMessage || "";
  state.latestSections = session?.parsed?.sections || {};
  state.latestRcaFields = session?.parsed?.rcaFields || {};
  state.activeReportSection = "rca";

  const product = state.productMap[session?.request?.product] || findProductByInput(session?.request?.productLabel);
  state.selectedProductKey = product?.key || session?.request?.product || "";
  elements.productInput.value = session?.request?.productLabel || product?.family || session?.request?.product || "";

  elements.workspaceInput.value = session?.request?.workspace || "";
  elements.ticketIdInput.value = session?.request?.ticketId || "";
  elements.issueTitleInput.value = session?.request?.issueTitle || session?.request?.derivedIssueTitle || "";
  elements.versionInput.value = session?.request?.version || "";
  elements.extraInstructionsInput.value = session?.request?.extraInstructions || "";
  renderGuidanceSummary();

  updateCurrentSessionSummary(session);
  updateSummary(session);
  renderReport();
  updateFormSummaries();
  updateButtons();

  if (session.durationMs) {
    stopElapsedClock(session.durationMs);
  }

  if (session?.status === "running") {
    startSessionPolling();
  } else if (!state.controller) {
    stopSessionPolling();
  }
}

async function loadSessionDetail(sessionId) {
  const session = await fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(sessionId)}`));
  applySession(session);
  await loadArtifacts();
  selectSessionCard();
}

async function loadSessions(preferredSessionId = "") {
  const payload = await fetchJson(apiUrl("/api/sessions"));
  state.sessions = payload.sessions || [];
  renderSessionList();

  if (preferredSessionId) {
    const found = state.sessions.find((session) => session.id === preferredSessionId);
    if (found) {
      await loadSessionDetail(preferredSessionId);
      return;
    }
  }

  selectSessionCard();
}

async function stopSessionById(sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.status !== "running") {
    appendLive({
      kind: "warning",
      label: "Stop skipped",
      headline: "That session is no longer running.",
      resultSummary: "Refresh Session History if the card state looks stale."
    });
    return;
  }

  const label = session.request?.displayName || session.request?.ticketId || session.id;
  const confirmed = await showConfirmDialog({
    eyebrow: "Stop Session",
    title: "Stop running session?",
    message: `Stop "${label}" now? The run will end and the saved session will be marked as cancelled.`,
    confirmLabel: "Stop Session"
  });
  if (!confirmed) {
    return;
  }

  await fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(sessionId)}/stop`), {
    method: "POST"
  });

  if (state.currentSessionId === sessionId) {
    stopWorkflow();
  }

  await loadSessions(sessionId);
  appendLive({
    kind: "warning",
    label: "Session stop requested",
    headline: `${label} received a stop request.`,
    resultSummary: "The server signalled the running process to end cleanly."
  });
}

async function deleteSessionById(sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.status === "running") {
    appendLive({
      kind: "warning",
      label: "Delete blocked",
      headline: "Currently running sessions cannot be deleted.",
      resultSummary: "Wait for the active run to finish before deleting that session."
    });
    return;
  }

  const label = session.request?.displayName || session.request?.ticketId || session.id;
  const confirmed = await showConfirmDialog({
    eyebrow: "Delete Session",
    title: "Delete saved session?",
    message: `Delete "${label}" from Session History? This removes the saved investigation for that session.`,
    confirmLabel: "Delete Session",
    danger: true
  });
  if (!confirmed) {
    return;
  }

  await fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(sessionId)}`), {
    method: "DELETE"
  });

  if (state.currentSessionId === sessionId) {
    resetToFreshSessionDraft();
  }

  await loadSessions();
  appendLive({
    kind: "success",
    label: "Session deleted",
    headline: `${label} was removed from Session History.`,
    resultSummary: "The session JSON file was deleted from local storage."
  });
}

async function deleteAllSessions() {
  const deletableCount = state.sessions.filter((session) => session.status !== "running").length;
  if (!deletableCount) {
    appendLive({
      kind: "warning",
      label: "Delete blocked",
      headline: "There are no deletable sessions right now.",
      resultSummary: "Running sessions are protected and empty history does not need cleanup."
    });
    return;
  }

  const confirmed = await showConfirmDialog({
    eyebrow: "Delete Sessions",
    title: "Delete saved sessions?",
    message: `Delete ${deletableCount} saved session(s)? Running sessions are protected and will be kept.`,
    confirmLabel: "Delete All",
    danger: true
  });
  if (!confirmed) {
    return;
  }

  const payload = await fetchJson(apiUrl("/api/sessions"), {
    method: "DELETE"
  });

  if (state.currentSessionId && payload.deletedSessionIds?.includes(state.currentSessionId)) {
    resetToFreshSessionDraft();
  }

  await loadSessions();
  appendLive({
    kind: payload.skippedCount ? "warning" : "success",
    label: payload.skippedCount ? "Sessions cleaned" : "Sessions deleted",
    headline: payload.message || "Session cleanup completed.",
    resultSummary: payload.skippedCount
      ? `${payload.deletedCount} deleted, ${payload.skippedCount} running session(s) kept.`
      : `${payload.deletedCount} session(s) deleted.`
  });
}

function resetRunSurfaces() {
  state.receivedEvents = 0;
  state.liveEntries = [];
  elements.eventCount.textContent = "0";
  elements.lastUpdated.textContent = "-";
  elements.commandPreview.textContent = "Codex stream idle";
  renderLiveOutput();
  resetActivityFeed();
  resetReport();
  updateButtons();
}

function updateFormSummaries() {
  const product = getCurrentProductSelection({ allowFallback: false });
  if (!state.currentSessionId && !state.controller) {
    elements.sessionNameSummary.textContent = buildDraftSessionName();
  }
  elements.productSummary.textContent = product?.family || "Not selected";
  elements.workspaceSummary.textContent = elements.workspaceInput.value.trim() || "Not loaded";
  elements.ticketSummary.textContent = elements.ticketIdInput.value.trim() || "Not provided";
  elements.versionSummary.textContent = elements.versionInput.value.trim() || "Not provided";
  renderGuidanceSummary();
}

function compactWhitespace(value) {
  return normalizeReportText(value).replace(/\s+/g, " ").trim();
}

function normalizeReportText(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/\uFFFD/g, "")
    .replaceAll("â†’", "->")
    .replaceAll("â€”", "-")
    .replaceAll("â€“", "-")
    .replaceAll("â‰¤", "<=")
    .replaceAll("â‰¥", ">=")
    .replaceAll("â€œ", "\"")
    .replaceAll("â€�", "\"")
    .replaceAll("â€˜", "'")
    .replaceAll("â€™", "'")
    .replaceAll("â€¦", "...")
    .replaceAll("Â ", " ")
    .replaceAll("Â", "");
}

function shortenForStream(value, maxLength = 180) {
  const compact = compactWhitespace(value);
  if (!compact) {
    return "";
  }

  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function summarizeCommandLabel(command, maxLength = 120) {
  const compact = compactWhitespace(command);
  if (!compact) {
    return "local command";
  }

  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function describeCommandNarrative(command) {
  const normalized = compactWhitespace(command).toLowerCase();

  if (!normalized) {
    return {
      action: "Investigating with a local command",
      detail: "Codex is using a shell command on this machine to gather evidence or verify a change."
    };
  }

  if (/\bgit\s+status\b/.test(normalized)) {
    return {
      action: "Checking local changes",
      detail: "Codex is reading the working tree so it can see what already changed in this source folder."
    };
  }

  if (/\bgit\s+(diff|show|log|blame)\b/.test(normalized)) {
    return {
      action: "Reviewing code history",
      detail: "Codex is looking through earlier code changes to understand when the behavior shifted."
    };
  }

  if (/\b(rg|grep|findstr|select-string)\b/.test(normalized)) {
    return {
      action: "Searching for code evidence",
      detail: "Codex is scanning the selected code locations for keywords, files, or symbols linked to the issue."
    };
  }

  if (/\b(get-content|cat|type|sed|head|tail|more|less|nl)\b/.test(normalized)) {
    return {
      action: "Reading local source files",
      detail: "Codex is opening local files to inspect the current implementation or configuration."
    };
  }

  if (/\b(node\s+--check|tsc\b|eslint\b|dotnet\s+build\b|msbuild\b)\b/.test(normalized)) {
    return {
      action: "Checking code validity",
      detail: "Codex is verifying that the code still parses or builds after the latest change."
    };
  }

  if (/\b((npm|pnpm|yarn)\s+(run\s+)?(test|lint|build)|pytest|vitest|jest|cargo\s+test|dotnet\s+test)\b/.test(normalized)) {
    return {
      action: "Running verification",
      detail: "Codex is executing a validation step to confirm the current code still works as expected."
    };
  }

  if (/\b(invoke-webrequest|curl|wget)\b/.test(normalized)) {
    return {
      action: "Checking a service response",
      detail: "Codex is calling an endpoint to confirm the local service or page is responding correctly."
    };
  }

  if (/\bpython(\.exe)?\s+-m\b/.test(normalized)) {
    return {
      action: "Running a local Python helper",
      detail: "Codex is using a Python utility on this machine to inspect, transform, or verify investigation data."
    };
  }

  if (/\b(\.ps1|\.cmd|\.bat|\.sh)\b/.test(normalized)) {
    return {
      action: "Running a local helper script",
      detail: "Codex is executing a local script that performs a focused investigation or verification step."
    };
  }

  if (/\b(powershell(\.exe)?|pwsh|cmd(\.exe)?)\b/.test(normalized)) {
    return {
      action: "Running a local shell step",
      detail: "Codex is using a shell command on this machine to gather evidence or verify the current state."
    };
  }

  if (/\bcodex\b/.test(normalized)) {
    return {
      action: "Running Codex locally",
      detail: "Codex is executing a local CLI step on this same machine."
    };
  }

  return {
    action: "Running a local investigation command",
    detail: "Codex is using a shell command on this machine to gather evidence or verify a change."
  };
}

function buildCommandHeadline(command, phase) {
  const action = describeCommandNarrative(command).action;
  if (phase === "started") {
    return `${action} started`;
  }

  if (phase === "failed") {
    return `${action} failed`;
  }

  if (phase === "completed-empty") {
    return `${action} finished`;
  }

  return `${action} completed`;
}

function getToolLabel(server, tool) {
  return `${server || "server"} / ${tool || "tool"}`;
}

function getPathLeaf(value) {
  const clean = String(value || "").trim().replace(/^["'`]|["'`]$/g, "");
  const parts = clean.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || clean || "the matched file";
}

function summarizeSearchMatches(output) {
  const lines = String(output || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "The search finished without any matching lines.";
  }

  const files = new Map();
  let firstSnippet = "";

  for (const line of lines) {
    const match = line.match(/^([A-Za-z]:\\[^:]+):(\d+):(.*)$/);
    if (match) {
      const [, filePath, , snippet] = match;
      files.set(filePath, (files.get(filePath) || 0) + 1);
      if (!firstSnippet && compactWhitespace(snippet)) {
        firstSnippet = compactWhitespace(snippet);
      }
      continue;
    }

    if (!firstSnippet) {
      firstSnippet = compactWhitespace(line);
    }
  }

  if (!files.size) {
    return `The search returned ${lines.length} raw match line${lines.length === 1 ? "" : "s"}.`;
  }

  const sortedFiles = [...files.entries()].sort((left, right) => right[1] - left[1]);
  const [topFile, topCount] = sortedFiles[0];
  const summaryParts = [
    `The search found ${lines.length} matching line${lines.length === 1 ? "" : "s"} across ${files.size} file${files.size === 1 ? "" : "s"}.`,
    `The strongest signal is in ${getPathLeaf(topFile)} with ${topCount} match${topCount === 1 ? "" : "es"}.`
  ];

  if (firstSnippet) {
    summaryParts.push(`The first useful clue mentions "${shortenForStream(firstSnippet, 110)}".`);
  }

  return summaryParts.join(" ");
}

function summarizeGitStatus(output) {
  const lines = String(output || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "The working tree looks clean right now.";
  }

  return `Git status shows ${lines.length} changed path${lines.length === 1 ? "" : "s"} that may affect the investigation.`;
}

function summarizeEndpointResult(output) {
  const text = String(output || "").trim();
  if (!text) {
    return "The service call completed without a printed response body.";
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed) {
      if (parsed.ok === true) {
        return "The service responded successfully and reported a healthy state.";
      }

      if (parsed.error || parsed.message) {
        return shortenForStream(parsed.error || parsed.message, 160);
      }
    }
  } catch (error) {
    // Non-JSON response.
  }

  return `The service returned: ${shortenForStream(text, 150)}`;
}

function summarizeReadResult(output) {
  const lines = String(output || "")
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter(Boolean);

  if (!lines.length) {
    return "The file read finished without visible content.";
  }

  return `Codex loaded local file content for inspection. First visible line: "${shortenForStream(lines[0], 120)}".`;
}

function summarizeVerificationResult(output) {
  const text = compactWhitespace(output);
  if (!text) {
    return "The validation step finished without printing any errors.";
  }

  return `The validation step reported: ${shortenForStream(text, 150)}`;
}

function summarizeGenericCommandResult(output) {
  const lines = String(output || "")
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter(Boolean);

  if (!lines.length) {
    return "The command finished without printed output.";
  }

  return `The command returned ${lines.length} visible line${lines.length === 1 ? "" : "s"}. First useful line: "${shortenForStream(lines[0], 120)}".`;
}

function summarizeCommandResult(command, output) {
  const normalized = compactWhitespace(command).toLowerCase();

  if (/\bgit\s+status\b/.test(normalized)) {
    return summarizeGitStatus(output);
  }

  if (/\b(rg|grep|findstr|select-string)\b/.test(normalized)) {
    return summarizeSearchMatches(output);
  }

  if (/\b(invoke-webrequest|curl|wget)\b/.test(normalized)) {
    return summarizeEndpointResult(output);
  }

  if (/\b(get-content|cat|type|sed|head|tail|more|less|nl)\b/.test(normalized)) {
    return summarizeReadResult(output);
  }

  if (/\b(node\s+--check|tsc\b|eslint\b|dotnet\s+build\b|msbuild\b|(npm|pnpm|yarn)\s+(run\s+)?(test|lint|build)|pytest|vitest|jest|cargo\s+test|dotnet\s+test)\b/.test(normalized)) {
    return summarizeVerificationResult(output);
  }

  return summarizeGenericCommandResult(output);
}

function summarizeEmptyCommandResult(command) {
  const normalized = compactWhitespace(command).toLowerCase();

  if (/\b(node\s+--check|tsc\b|eslint\b|dotnet\s+build\b|msbuild\b|(npm|pnpm|yarn)\s+(run\s+)?(test|lint|build)|pytest|vitest|jest|cargo\s+test|dotnet\s+test)\b/.test(normalized)) {
    return "The validation step finished cleanly without printed errors.";
  }

  if (/\b(rg|grep|findstr|select-string)\b/.test(normalized)) {
    return "The search finished without any visible matches.";
  }

  return "The command finished without printed output.";
}

function formatCodexEvent(payload) {
  const parsed = payload?.parsed;
  if (!parsed || typeof parsed !== "object") {
    const text = shortenMultiline(payload?.text || payload?.raw || "", 500);
    return text
      ? {
          kind: "note",
          label: "Live note",
          headline: "The local runner sent a raw output update.",
          resultSummary: summarizeResultText(text),
          detail: text
        }
      : null;
  }

  if (parsed.type === "thread.started" || parsed.type === "turn.started") {
    return null;
  }

  const item = parsed.item || {};
  const itemType = item.type || "";

  if (parsed.type === "item.started") {
    if (itemType === "command_execution") {
      const narrative = describeCommandNarrative(item.command || "");
      return {
        kind: "command",
        label: narrative.action,
        headline: buildCommandHeadline(item.command || "", "started"),
        command: item.command || "",
        resultSummary: narrative.detail,
        timelineTitle: narrative.action,
        timelineDescription: narrative.detail
      };
    }

    if (itemType === "mcp_tool_call") {
      const toolLabel = getToolLabel(item.server, item.tool);
      return {
        kind: "tool",
        label: "Support context",
        headline: `Checking support context with ${toolLabel}`,
        resultSummary: `Codex is gathering related evidence from ${toolLabel}.`,
        detail: shortenMultiline(`${toolLabel} started`, 260),
        timelineTitle: "Checking supporting context",
        timelineDescription: `Codex is gathering extra context from ${toolLabel} before it continues the run.`
      };
    }

    return null;
  }

  if (parsed.type === "item.completed") {
    if (itemType === "agent_message") {
      return {
        kind: "insight",
        label: "RCA insight",
        headline: summarizeResultText(item.text || "", 200),
        detail: shortenMultiline(item.text || "", 560)
      };
    }

    if (itemType === "command_execution") {
      if (item.status === "failed") {
        const narrative = describeCommandNarrative(item.command || "");
        return {
          kind: "error",
          label: `${narrative.action} failed`,
          headline: buildCommandHeadline(item.command || "", "failed"),
          command: item.command || "",
          resultSummary: summarizeCommandResult(item.command || "", item.aggregated_output || item.error || ""),
          timelineTitle: narrative.action,
          timelineDescription: summarizeCommandResult(item.command || "", item.aggregated_output || item.error || ""),
          detail: preserveMultiline(
            [item.aggregated_output ? `Output: ${item.aggregated_output}` : "", item.error ? `Error: ${item.error}` : ""]
              .filter(Boolean)
              .join("\n")
          )
        };
      }

      if (item.aggregated_output) {
        const narrative = describeCommandNarrative(item.command || "");
        return {
          kind: "success",
          label: `${narrative.action} result`,
          headline: buildCommandHeadline(item.command || "", "completed"),
          command: item.command || "",
          resultSummary: summarizeCommandResult(item.command || "", item.aggregated_output),
          timelineTitle: narrative.action,
          timelineDescription: summarizeCommandResult(item.command || "", item.aggregated_output),
          detail: preserveMultiline(item.aggregated_output)
        };
      }

      const narrative = describeCommandNarrative(item.command || "");
      return {
        kind: "command",
        label: `${narrative.action} complete`,
        headline: buildCommandHeadline(item.command || "", "completed-empty"),
        command: item.command || "",
        resultSummary: summarizeEmptyCommandResult(item.command || ""),
        timelineTitle: narrative.action,
        timelineDescription: summarizeEmptyCommandResult(item.command || "")
      };
    }

    if (itemType === "mcp_tool_call") {
      const toolLabel = getToolLabel(item.server, item.tool);
      if (item.status === "failed") {
        return {
          kind: "warning",
          label: "Support context failed",
          headline: `Support lookup failed for ${toolLabel}`,
          resultSummary: summarizeResultText(item.error || `${toolLabel} failed`),
          detail: preserveMultiline(`${toolLabel}${item.error ? `\n${item.error}` : ""}`)
        };
      }

      return {
        kind: "tool",
        label: "Support context ready",
        headline: `Support lookup finished for ${toolLabel}`,
        resultSummary: `The supporting context from ${toolLabel} is ready for the RCA run.`,
        detail: shortenMultiline(toolLabel, 260)
      };
    }

    if (item.text) {
      return {
        kind: "insight",
        label: "RCA note",
        headline: summarizeResultText(item.text, 200),
        detail: shortenMultiline(item.text, 560)
      };
    }
  }

  const fallback = shortenMultiline(payload?.text || payload?.raw || "", 480);
  return fallback
    ? {
        kind: "note",
        label: "Live note",
        headline: summarizeResultText(fallback, 200),
        resultSummary: summarizeResultText(fallback),
        detail: fallback
      }
    : null;
}

function applyInteractionInput(runImmediately) {
  const message = elements.interactionInput.value.trim();
  if (!message) {
    return;
  }

  const merged = elements.extraInstructionsInput.value.trim();
  const nextInstruction = merged ? `${merged}\n\n[Operator Input]\n${message}` : `[Operator Input]\n${message}`;
  elements.extraInstructionsInput.value = nextInstruction;
  elements.interactionInput.value = "";
  renderGuidanceSummary();

  if (runImmediately) {
    runWorkflow("analyze");
  }
}

function handleSseBlock(block) {
  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return;
  }

  state.receivedEvents += 1;
  elements.eventCount.textContent = String(state.receivedEvents);
  const payload = JSON.parse(dataLines.join("\n"));

  if (eventName === "status") {
    state.currentSessionId = payload.sessionId || "";
    state.currentSessionStatus = "running";
    elements.sessionNameSummary.textContent = payload.displayName || "Running";
    elements.currentSessionId.textContent = state.currentSessionId || "Not started";
    elements.commandPreview.textContent = `${payload.command} ${payload.args.join(" ")}`;
    updateButtons();
    appendLive({
      kind: "status",
      label: payload.mode === "fix" ? "Fix run" : "RCA run",
      headline: `${payload.displayName || "Run started"} is now running on this machine.`,
      resultSummary: `Workspace root: ${payload.workspace || "Not provided"}`
    });
    addActivity(
      payload.mode === "fix" ? "Fix run started" : "RCA run started",
      "The local runner accepted the request and the live stream is now showing command-by-command progress."
    );
    startSessionPolling();
    return;
  }

  if (eventName === "codex_event") {
    const formatted = formatCodexEvent(payload);
    if (formatted) {
      appendLive(formatted);
      if (formatted.timelineTitle && formatted.timelineDescription) {
        addActivity(formatted.timelineTitle, formatted.timelineDescription);
      }
    }
    return;
  }

  if (eventName === "heartbeat") {
    elements.lastUpdated.textContent = formatClock();
    return;
  }

  if (eventName === "warning") {
    appendLive({
      kind: "warning",
      label: payload.label || "Runner status",
      headline: payload.headline || "The local runner reported a warning.",
      resultSummary: summarizeResultText(payload.message || payload.detail || ""),
      detail: shortenMultiline(payload.detail || payload.message || "", 560)
    });
    return;
  }

  if (eventName === "stderr") {
    appendLive({
      kind: "warning",
      label: "System note",
      headline: "The local runner printed a warning or low-level message.",
      resultSummary: summarizeResultText(payload.text),
      detail: shortenMultiline(payload.text, 480)
    });
    return;
  }

  if (eventName === "final") {
    state.latestFinalMessage = payload.message || "";
    state.latestSections = payload.sections || {};
    state.latestRcaFields = payload.rcaFields || {};
    if (payload.artifacts) {
      state.artifacts = payload.artifacts;
      updateArtifactView();
    }
    if (payload.session) {
      applySession({
        ...payload.session,
        output: { finalMessage: state.latestFinalMessage },
        parsed: {
          sections: state.latestSections,
          rcaFields: state.latestRcaFields
        }
      });
    } else {
      renderReport();
      updateSummary();
    }
    appendLive({
      kind: "success",
      label: "Report ready",
      headline: "The final RCA report is ready.",
      resultSummary: summarizeResultText(payload.message || "The report was generated."),
      detail: shortenMultiline(payload.message || "", 560)
    });
    addActivity("Final report ready", "The final RCA or fix output has been parsed and the structured navigator has been updated.");
    return;
  }

  if (eventName === "error") {
    state.currentSessionStatus = "failed";
    setStatus("Error", "status-error");
    appendLive({
      kind: "error",
      label: "Run error",
      headline: "The live stream reported a problem.",
      resultSummary: summarizeResultText(payload.message),
      detail: shortenMultiline(payload.message, 460)
    });
    return;
  }

  if (eventName === "done") {
    const ok = payload.code === 0;
    state.currentSessionStatus = ok ? "completed" : "";
    setStatus(ok ? "Completed" : "Stopped", ok ? "status-done" : "status-error");
    state.controller = null;
    stopElapsedClock();
    stopSessionPolling();
    addActivity(
      ok ? "Run finished" : "Run stopped",
      ok ? "The local process finished and the page is refreshing the saved report." : "The process stopped before a clean finish."
    );
    updateButtons();
    Promise.all([loadSessions(state.currentSessionId), loadArtifacts()]).catch(() => {});
  }
}

async function loadConfig() {
  const config = await fetchJson(apiUrl("/api/config"));
  const defaultGuidance = PRODUCT_GENERIC_GUIDANCE;
  const existingProductInput = compactWhitespace(elements.productInput.value);
  state.runtimeConfig = {
    platform: config.platform || "",
    connected: true,
    requireElevatedExecution: Boolean(config.requireElevatedExecution),
    elevated: Boolean(config.elevated),
    serverMode: config.serverMode || ""
  };
  state.products = (config.products || [])
    .map((product) => normalizeProduct(product))
    .filter(Boolean);
  state.productMap = {};
  state.productLookup = {};
  state.products.forEach((product) => rememberProduct(product));
  if (elements.productOptions) {
    elements.productOptions.innerHTML = state.products
      .map((product) => `<option value="${escapeHtml(product.family)}">${escapeHtml(product.label)}</option>`)
      .join("");
  }

  const firstProduct = state.products[0];
  const matchingProduct = findProductByInput(existingProductInput);
  if (matchingProduct) {
    state.selectedProductKey = matchingProduct.key || "";
    elements.productInput.value = matchingProduct.family || "";
  } else if (firstProduct && !existingProductInput) {
    state.selectedProductKey = firstProduct.key;
    elements.productInput.value = firstProduct.family || "";
  } else {
    state.selectedProductKey = "";
  }

  applyPreferredWorkspaceForProduct(getCurrentProductSelection({ allowFallback: false }));

  elements.modelInput.value = config.model || "";
  if (elements.extraInstructionsInput && !elements.extraInstructionsInput.value.trim()) {
    elements.extraInstructionsInput.value = defaultGuidance;
  }
  elements.defaultPrompt.textContent = config.defaultPrompt || "";
  if (elements.runtimeModeTitle) {
    elements.runtimeModeTitle.textContent = config.elevated ? "Local Elevated Runtime" : "Local Agent Runtime";
  }
  if (elements.runtimeModeDetail) {
    elements.runtimeModeDetail.textContent = config.elevated
      ? "This browser is connected to a localhost agent, and Codex runs stay on that user machine with elevated local execution enabled."
      : config.requireElevatedExecution
        ? "The local agent is reachable, but elevated execution is not active yet. Restart the local agent with Administrator or sudo to run Codex."
        : "This browser is connected to the local agent, and each Codex CLI run stays on that user machine.";
  }
  renderAgentConnection();
  renderRuntimeBlocker();

  if (config.requireElevatedExecution && !config.elevated) {
    setStatus("Needs Elevation", "status-error");
  } else {
    setStatus("Idle", "status-idle");
  }

  updateFormSummaries();
  renderGuidanceSummary();
  updateButtons();
}

async function connectAgent(options = {}) {
  const { silent = false } = options;
  const targetAgentBaseUrl = setAgentBaseUrl(elements.agentBaseUrlInput?.value || state.agentBaseUrl || DEFAULT_AGENT_BASE_URL);

  try {
    clearAgentReconnect();
    await loadConfig();
    await Promise.all([loadSessions(state.currentSessionId), loadArtifacts()]);

    if (!silent) {
      appendLive({
        kind: "success",
        label: "Agent connected",
        headline: `The browser is now connected to the local agent at ${targetAgentBaseUrl}.`,
        resultSummary: "RCA runs will execute on that user machine instead of the UI host."
      });
    }
  } catch (error) {
    const fallbackAgentBaseUrl = await findReachableAgentBaseUrl([
      targetAgentBaseUrl === DEFAULT_AGENT_BASE_URL ? "" : DEFAULT_AGENT_BASE_URL
    ]);

    if (fallbackAgentBaseUrl && fallbackAgentBaseUrl !== targetAgentBaseUrl) {
      setAgentBaseUrl(fallbackAgentBaseUrl);
      try {
        await loadConfig();
        await Promise.all([loadSessions(state.currentSessionId), loadArtifacts()]);
        if (!silent) {
          appendLive({
            kind: "success",
            label: "Agent recovered",
            headline: `The browser reconnected to the local agent at ${fallbackAgentBaseUrl}.`,
            resultSummary: `The previous agent endpoint at ${targetAgentBaseUrl} was unavailable, so the page switched to the healthy local fallback automatically.`
          });
        }
        return;
      } catch (fallbackError) {
        error = fallbackError;
      }
    }

    state.runtimeConfig = {
      platform: "",
      connected: false,
      requireElevatedExecution: false,
      elevated: false,
      serverMode: ""
    };
    state.products = [];
    state.productMap = {};
    state.productLookup = {};
    state.sessions = [];
    state.artifacts = {
      aiToolInstruction: "Connect to a local agent to load the current prompt and runtime artifacts.",
      newToolInstruction: "Connect to a local agent to load the latest RCA or fix output.",
      error: "Connect to a local agent to load runtime stderr and error notes."
    };
    state.currentSessionId = "";
    if (elements.productInput) {
      elements.productInput.value = "";
    }
    if (elements.productOptions) {
      elements.productOptions.innerHTML = "";
    }
    if (elements.defaultPrompt) {
      elements.defaultPrompt.textContent = "";
    }
    renderSessionList();
    updateArtifactView();
    resetReport();
    updateCurrentSessionSummary(null);
    updateFormSummaries();
    renderAgentConnection();
    renderRuntimeBlocker();
    setStatus("Agent Offline", "status-error");
    updateButtons();
    scheduleAgentReconnect();

    if (!silent) {
      appendLive({
        kind: "warning",
        label: "Agent offline",
        headline: `The browser could not reach the local agent at ${targetAgentBaseUrl}.`,
        resultSummary: summarizeResultText(error.message),
        detail: shortenMultiline(error.message, 420)
      });
    }
  }
}

async function browseWorkspace() {
  if (!state.runtimeConfig.connected) {
    appendLive({
      kind: "warning",
      label: "Workspace picker",
      headline: "The workspace picker needs a connected local agent.",
      resultSummary: "Reconnect the local client agent, then try Browse Workspace again.",
      detail: "Browse Workspace only opens a folder picker on the user machine. Use it for a local folder or enter a UNC path directly."
    });
    return;
  }

  try {
    const currentWorkspace = elements.workspaceInput.value.trim();
    const current = encodeURIComponent(
      parseSharedWorkspaceDescriptor(currentWorkspace) ? "" : currentWorkspace
    );
    appendLive({
      kind: "note",
      label: "Workspace picker",
      headline: "Opening the local folder picker.",
      resultSummary: "Choose the exact local workspace root on this machine.",
      detail: "This picker comes from the local client agent and only browses folders on the user machine."
    });
    const payload = await fetchJson(apiUrl(`/api/pick-workspace?current=${current}`));
    if (payload.path) {
      elements.workspaceInput.value = payload.path;
      updateFormSummaries();
      elements.workspaceInput.focus();
      appendLive({
        kind: "success",
        label: "Workspace selected",
        headline: "The workspace path was updated from the folder picker.",
        resultSummary: payload.path
      });
      return;
    }

    appendLive({
      kind: "note",
      label: "Workspace picker",
      headline: "The folder picker was closed without selecting a workspace.",
      resultSummary: "No workspace path was changed."
    });
  } catch (error) {
    appendLive({
      kind: "error",
      label: "Workspace picker",
      headline: "The folder picker could not be opened.",
      resultSummary: summarizeResultText(error.message),
      detail: shortenMultiline(error.message, 420)
    });
  }
}

function focusLaunchField(fieldKey) {
  const fieldMap = {
    product: elements.productInput,
    workspace: elements.workspaceInput,
    ticketId: elements.ticketIdInput,
    issueTitle: elements.issueTitleInput,
    version: elements.versionInput,
    extraInstructions: elements.extraInstructionsInput
  };

  const target = fieldMap[fieldKey];
  target?.focus();
}

function validateRunFormInputs() {
  const selectedProduct = getCurrentProductSelection({ allowFallback: false });
  const sharedWorkspace = parseSharedWorkspaceDescriptor(elements.workspaceInput.value);
  const values = {
    product: selectedProduct?.key || "",
    productLabel: elements.productInput.value.trim(),
    workspace: elements.workspaceInput.value.trim(),
    workspaceMode: sharedWorkspace ? "shared-api" : "local",
    sharedWorkspaceApiBaseUrl: sharedWorkspace ? getHostedWorkspaceApiBaseUrl() : "",
    ticketId: elements.ticketIdInput.value.trim(),
    issueTitle: elements.issueTitleInput.value.trim(),
    version: elements.versionInput.value.trim(),
    extraInstructions: elements.extraInstructionsInput.value.trim()
  };

  const errors = [];

  if (!values.productLabel) {
    errors.push({
      field: "product",
      headline: "Enter or search for the product first.",
      resultSummary: "Source Code Select For Products needs a valid product name."
    });
  }

  if (!values.workspace) {
    errors.push({
      field: "workspace",
      headline: "Choose the product workspace before starting RCA.",
      resultSummary: "Use a local folder on this machine or a direct UNC path like \\\\BURVM08103\\simphony\\temp."
    });
  }

  if (!values.ticketId) {
    errors.push({
      field: "ticketId",
      headline: "Enter the Jira Ticket ID or BugDB ID.",
      resultSummary: "The investigation must stay anchored to one ticket or bug."
    });
  }

  if (!values.issueTitle) {
    errors.push({
      field: "issueTitle",
      headline: "Enter the issue title.",
      resultSummary: "The saved session name needs the issue title."
    });
  }

  if (!values.version) {
    errors.push({
      field: "version",
      headline: "Enter the product version.",
      resultSummary: "The RCA run needs the target version or branch."
    });
  }

  if (!values.extraInstructions) {
    errors.push({
      field: "extraInstructions",
      headline: "RCA Guidance cannot be empty.",
      resultSummary: "Choose or write the RCA guidance before starting the run."
    });
  }

  if (sharedWorkspace && inferGuidanceMode(values.extraInstructions) === "fix-from-rca") {
    errors.push({
      field: "extraInstructions",
      headline: `Fix from RCA is disabled for ${sharedWorkspace.descriptor}.`,
      resultSummary: "Use a writable local checkout instead, or switch back to Root Cause Report or Evidence-first guidance."
    });
  }

  return {
    values,
    errors
  };
}

async function runWorkflow(mode) {
  if (isRuntimeBlocked()) {
    const instructions = state.runtimeConfig.connected ? getElevationInstructions(state.runtimeConfig.platform) : getAgentOfflineInstructions();
    setStatus(state.runtimeConfig.connected ? "Needs Elevation" : "Agent Offline", "status-error");
    appendLive({
      kind: "warning",
      label: "Runtime gate",
      headline: instructions.title,
      resultSummary: summarizeResultText(instructions.detail),
      detail: instructions.detail
    });
    return;
  }

  if (mode === "fix" && !state.currentSessionId) {
    appendLive({
      kind: "warning",
      label: "Fix step waiting",
      headline: "Run RCA before the fix step",
      resultSummary: "The fix step needs an RCA session so it knows which files and findings to follow."
    });
    return;
  }

  if (state.controller) {
    state.controller.abort();
  }
  stopSessionPolling();

  const validation = validateRunFormInputs();
  if (validation.errors.length) {
    const firstError = validation.errors[0];
    setStatus("Missing Input", "status-error");
    appendLive({
      kind: "warning",
      label: "Launch check",
      headline: firstError.headline,
      resultSummary: firstError.resultSummary,
      detail: validation.errors.map((error) => `- ${error.headline}`).join("\n")
    });
    focusLaunchField(firstError.field);
    updateButtons();
    return;
  }

  updateFormSummaries();
  state.controller = new AbortController();
  resetRunSurfaces();
  setStatus(mode === "fix" ? "Fixing" : "Running", "status-running");
  updateButtons();
  startElapsedClock();
  addActivity(
    mode === "fix" ? "The fix run was sent" : "The RCA request was sent",
    "The browser has submitted your request to the local wrapper and is waiting for the first live update."
  );

  let response;
  let sharedWorkspaceAccessToken = "";

  try {
    if (validation.values.workspaceMode === "shared-api") {
      sharedWorkspaceAccessToken = await requestHostedWorkspaceAccessToken();
    }

    response = await fetch(apiUrl("/api/run"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify({
        mode,
        continueSession: false,
        product: validation.values.product || validation.values.productLabel,
        productLabel: validation.values.productLabel,
        workspace: validation.values.workspace,
        workspaceMode: validation.values.workspaceMode,
        sharedWorkspaceApiBaseUrl: validation.values.sharedWorkspaceApiBaseUrl,
        sharedWorkspaceAccessToken,
        ticketId: validation.values.ticketId,
        issueTitle: validation.values.issueTitle,
        version: validation.values.version,
        model: elements.modelInput.value,
        extraInstructions: validation.values.extraInstructions,
        previousSessionId: mode === "fix" ? state.currentSessionId : ""
      }),
      signal: state.controller.signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    setStatus("Error", "status-error");
    stopElapsedClock();
    appendLive({
      kind: "error",
      label: "Request failed",
      headline: "The browser could not start the run.",
      resultSummary: summarizeResultText(error.message),
      detail: shortenMultiline(error.message, 420)
    });
    state.controller = null;
    updateButtons();
    return;
  }

  if (!response.ok || !response.body) {
    let message = `Request failed with HTTP ${response.status}`;
    try {
      const body = await response.text();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          message = parsed.error || parsed.message || message;
        } catch (error) {
          message = body;
        }
      }
    } catch (error) {
      // Fall back to the status-only message.
    }

    setStatus("Error", "status-error");
    stopElapsedClock();
    appendLive({
      kind: "error",
      label: "Server response",
      headline: "The server rejected or failed the run request.",
      resultSummary: summarizeResultText(message),
      detail: shortenMultiline(message, 440)
    });
    state.controller = null;
    updateButtons();
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const normalized = buffer.replaceAll("\r\n", "\n");
      const blocks = normalized.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (block.trim()) {
          handleSseBlock(block);
        }
      }
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus("Error", "status-error");
      stopElapsedClock();
      appendLive({
        kind: "error",
        label: "Stream failed",
        headline: "The live connection dropped while the run was in progress.",
        resultSummary: summarizeResultText(error.message),
        detail: shortenMultiline(error.message, 420)
      });
    }
  } finally {
    const needsRecoverySync = Boolean(state.currentSessionId) && isCurrentSessionRunning();
    state.controller = null;
    if (needsRecoverySync) {
      const settled = await syncCurrentSessionFromSavedState({ appendRecoveryNote: true });
      if (!settled && state.currentSessionId) {
        startSessionPolling();
      }
    } else {
      stopSessionPolling();
    }
    updateButtons();
  }
}

function stopWorkflow() {
  if (!state.controller) {
    return;
  }

  state.controller.abort();
  state.controller = null;
  stopSessionPolling();
  setStatus("Stopped", "status-error");
  stopElapsedClock();
  appendLive({
    kind: "warning",
    label: "Stopped by user",
    headline: "The current run was stopped from this page.",
    resultSummary: "No more live output will arrive for this run."
  });
  addActivity("Run stopped", "The current RCA or fix process was stopped from the page.");
  updateButtons();
}

function clearLocalView() {
  state.liveEntries = [];
  renderLiveOutput();
  resetActivityFeed();
}

function sanitizeFilenamePart(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/g, "");

  return (cleaned || fallback).replace(/\s+/g, "-");
}

function buildContextFilename() {
  const ticketId = sanitizeFilenamePart(elements.ticketIdInput.value.trim(), "context");
  const issueTitle = sanitizeFilenamePart(elements.issueTitleInput.value.trim(), "issue");
  const version = sanitizeFilenamePart(elements.versionInput.value.trim() || "current", "current");
  return `${ticketId}-${issueTitle}-${version}.md`;
}

function buildContextMarkdown() {
  const product = getCurrentProductSelection();
  const sections = getOrderedSections(state.latestSections, state.latestRcaFields);
  const lines = [
    `# ${elements.ticketIdInput.value.trim() || "Context"} | ${elements.issueTitleInput.value.trim() || "Current RCA context"}`,
    "",
    "## Session",
    `- Product: ${product?.family || "Oracle Restaurants"}`,
    `- Ticket: ${elements.ticketIdInput.value.trim() || "Not provided"}`,
    `- Issue Title: ${elements.issueTitleInput.value.trim() || "Not provided"}`,
    `- Version: ${elements.versionInput.value.trim() || "Not provided"}`,
    `- Workspace: ${elements.workspaceInput.value.trim() || "Not provided"}`,
    `- Session ID: ${state.currentSessionId || "Not started"}`,
    `- Status: ${elements.finalState.textContent || "No final report yet"}`,
    "",
    "## Current Session Summary",
    plainTextFromMarkdown(state.latestSections["Result Summary"] || state.latestSections.RCA || state.latestFinalMessage || "No final report yet."),
    ""
  ];

  for (const item of sections) {
    lines.push(`## ${item.name}`);
    lines.push("");
    if (item.type === "fields") {
      for (const [field, value] of item.fields || []) {
        lines.push(`### ${field}`);
        lines.push("");
        lines.push(String(value || "").trim() || "Not available.");
        lines.push("");
      }
    } else {
      lines.push(String(item.value || "").trim() || "Not available.");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function downloadContext() {
  if (!state.currentSessionId) {
    return;
  }

  const blob = new Blob([buildContextMarkdown()], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = buildContextFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function handleProductChange() {
  const product = findProductByInput(elements.productInput.value);
  state.selectedProductKey = product?.key || "";
  if (product) {
    applyPreferredWorkspaceForProduct(product);
  }
  updateFormSummaries();
  renderGuidanceSummary();
}

function bindTemplateChips() {
  document.querySelectorAll(".template-chip").forEach((button) => {
    if (button.dataset.templateTarget === "interaction") {
      return;
    }

    button.addEventListener("click", () => {
      const blockedReason = button.dataset.guidanceMode === "fix-from-rca"
        ? getFixFromRcaBlockedReason()
        : "";
      if (blockedReason) {
        renderGuidanceSummary();
        elements.extraInstructionsInput.focus();
        return;
      }

      const template = button.dataset.template || "";
      elements.extraInstructionsInput.value = template;
      renderGuidanceSummary();
      elements.extraInstructionsInput.focus();
    });
  });
}

function bindPromptSuggestions() {
  document.querySelectorAll(".template-chip[data-template-target='interaction']").forEach((button) => {
    button.addEventListener("click", () => {
      elements.interactionInput.value = button.dataset.template || "";
      elements.interactionInput.focus();
    });
  });
}

function bindViewNav() {
  elements.viewNav?.addEventListener("click", (event) => {
    const button = event.target.closest(".view-tab[data-view]");
    if (!button) {
      return;
    }

    setActiveView(button.dataset.view || "home");
  });

  window.addEventListener("popstate", () => {
    setActiveView(getViewFromLocation(), { syncHistory: false });
  });
}

function bindSessionList() {
  elements.sessionList.addEventListener("click", (event) => {
    const stopButton = event.target.closest("[data-stop-session-id]");
    if (stopButton) {
      event.preventDefault();
      event.stopPropagation();
      stopSessionById(stopButton.dataset.stopSessionId).catch((error) => {
        appendLive({
          kind: "error",
          label: "Stop failed",
          headline: "The session could not be stopped.",
          resultSummary: summarizeResultText(error.message),
          detail: shortenMultiline(error.message, 420)
        });
      });
      return;
    }

    const deleteButton = event.target.closest("[data-delete-session-id]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      deleteSessionById(deleteButton.dataset.deleteSessionId).catch((error) => {
        appendLive({
          kind: "error",
          label: "Delete failed",
          headline: "The session could not be deleted.",
          resultSummary: summarizeResultText(error.message),
          detail: shortenMultiline(error.message, 420)
        });
      });
      return;
    }

    const button = event.target.closest(".session-item[data-session-id]");
    if (!button) {
      return;
    }

    event.preventDefault();
    loadSessionDetail(button.dataset.sessionId).catch(() => {});
  });
}

function bindReportTabs() {
  elements.reportNav.addEventListener("click", (event) => {
    const target = event.target.closest(".report-tab[data-section]");
    if (!target) {
      return;
    }

    state.activeReportSection = target.dataset.section || "rca";
    renderReport();
    const anchor = Array.from(elements.reportBody.querySelectorAll("[data-report-anchor]")).find(
      (node) => node.dataset.reportAnchor === state.activeReportSection
    );
    anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function bindArtifactTabs() {
  if (!elements.artifactTabs) {
    return;
  }

  elements.artifactTabs.addEventListener("click", (event) => {
    const target = event.target.closest(".report-tab[data-artifact]");
    if (!target) {
      return;
    }

    state.activeArtifact = target.dataset.artifact || "aiToolInstruction";
    updateArtifactView();
  });
}

async function boot() {
  bindViewNav();
  bindTemplateChips();
  bindPromptSuggestions();
  bindSessionList();
  bindReportTabs();
  bindArtifactTabs();
  elements.confirmDialogCancel?.addEventListener("click", () => resolveConfirmDialog(false));
  elements.confirmDialogConfirm?.addEventListener("click", () => resolveConfirmDialog(true));
  elements.confirmDialogBackdrop?.addEventListener("click", () => resolveConfirmDialog(false));
  window.addEventListener("keydown", handleConfirmDialogKeydown);
  setAgentBaseUrl(await resolveInitialAgentBaseUrl(), { persist: false });
  renderAgentConnection();
  await loadAuthenticatedUser();

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runWorkflow("analyze");
  });

  elements.stopButton.addEventListener("click", stopWorkflow);
  elements.liveStopButton?.addEventListener("click", stopWorkflow);
  elements.clearStreamButton.addEventListener("click", clearLocalView);
  elements.steerToggleButton?.addEventListener("click", toggleSteerPanel);
  elements.downloadContextButton?.addEventListener("click", downloadContext);
  elements.refreshSessionsButton.addEventListener("click", () => loadSessions(state.currentSessionId).catch(() => {}));
  elements.connectAgentButton?.addEventListener("click", () => {
    connectAgent().catch(() => {});
  });
  elements.deleteAllSessionsButton?.addEventListener("click", () => {
    deleteAllSessions().catch((error) => {
      appendLive({
        kind: "error",
        label: "Delete failed",
        headline: "The session cleanup request failed.",
        resultSummary: summarizeResultText(error.message),
        detail: shortenMultiline(error.message, 420)
      });
    });
  });
  elements.refreshArtifactsButton?.addEventListener("click", () => loadArtifacts().catch(() => {}));
  elements.browseWorkspaceButton.addEventListener("click", browseWorkspace);
  elements.continueInteractionButton.addEventListener("click", () => applyInteractionInput(true));
  elements.interactionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyInteractionInput(true);
    }
  });
  elements.productInput.addEventListener("input", handleProductChange);
  elements.productInput.addEventListener("change", handleProductChange);
  elements.agentBaseUrlInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      connectAgent().catch(() => {});
    }
  });
  elements.workspaceInput.addEventListener("input", () => {
    updateFormSummaries();
    renderGuidanceSummary();
  });
  elements.ticketIdInput.addEventListener("input", updateFormSummaries);
  elements.issueTitleInput.addEventListener("input", updateFormSummaries);
  elements.versionInput.addEventListener("input", updateFormSummaries);
  elements.extraInstructionsInput.addEventListener("input", renderGuidanceSummary);
  setSteerPanelOpen(false);
  renderTemplateChipSelection();

  await Promise.all([
    loadHostedWorkspaceRoots(),
    connectAgent({ silent: true })
  ]);
  if (window.location.hash) {
    const legacyView = normalizeView(
      String(window.location.hash)
        .replace(/^#\/?/, "")
        .trim() || "home"
    );
    setActiveView(legacyView, { syncHistory: true, replaceHistory: true });
  } else {
    setActiveView(getViewFromLocation(), {
      syncHistory: true,
      replaceHistory: normalizePathname(window.location.pathname) === "/"
    });
  }
  renderLiveOutput();
  renderGuidanceSummary();
  updateButtons();
}

boot().catch((error) => {
  setStatus("Agent Offline", "status-error");
  appendLive({
    kind: "error",
    label: "Startup error",
    summary: "The page could not finish loading.",
    detail: shortenMultiline(error.message, 420)
  });
});
