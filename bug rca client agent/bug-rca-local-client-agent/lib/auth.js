const crypto = require("crypto");
const { constants } = require("crypto");

const { parseRequestBody, sendJson } = require("./http-utils");
const { getAuthState } = require("./auth-config");
const {
  LOCAL_ACCOUNT_PROVIDER,
  authenticateLocalAccount,
  buildConciseUserProfile,
  clearAuthUserData,
  createLocalAccount,
  createAuthSession,
  deleteAuthSession,
  ensureAuthStorage,
  getAuthSession,
  getAuthUserRetentionDays,
  upsertAuthUser
} = require("./auth-store");

const SESSION_COOKIE_NAME = "bug_rca_ui_session";
const FLOW_COOKIE_NAME = "bug_rca_ui_auth_flow";

let discoveryCache = null;
let jwksCache = null;

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function randomToken(bytes = 24) {
  return encodeBase64Url(crypto.randomBytes(bytes));
}

function parseCookies(req) {
  const source = String(req.headers.cookie || "");
  if (!source) {
    return {};
  }

  return source.split(/;\s*/).reduce((accumulator, part) => {
    const index = part.indexOf("=");
    if (index <= 0) {
      return accumulator;
    }

    const key = decodeURIComponent(part.slice(0, index).trim());
    const value = decodeURIComponent(part.slice(index + 1).trim());
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function appendCookie(res, serializedCookie) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", serializedCookie);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, serializedCookie]);
    return;
  }

  res.setHeader("Set-Cookie", [current, serializedCookie]);
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  segments.push(`Path=${options.path || "/"}`);

  if (options.httpOnly !== false) {
    segments.push("HttpOnly");
  }

  segments.push(`SameSite=${options.sameSite || "Lax"}`);

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}

function clearCookie(res, name) {
  appendCookie(
    res,
    serializeCookie(name, "", {
      maxAge: 0
    })
  );
}

function setCookie(res, name, value, options = {}) {
  appendCookie(res, serializeCookie(name, value, options));
}

function redirect(res, location) {
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store"
  });
  res.end();
}

function signPayload(payload, secret) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = encodeBase64Url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${signature}`;
}

function verifySignedPayload(value, secret) {
  const [body, signature] = String(value || "").split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = encodeBase64Url(crypto.createHmac("sha256", secret).update(body).digest());
  if (signature.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(body).toString("utf8"));
  } catch (error) {
    return null;
  }
}

function resolveSecureCookie(req) {
  return Boolean(req.socket?.encrypted || String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `HTTP ${response.status}`);
  }

  return response.json();
}

async function getDiscoveryDocument() {
  const authState = getAuthState();
  if (!authState.issuer) {
    throw new Error("OIDC issuer is not configured.");
  }

  const cacheKey = authState.issuer;
  if (discoveryCache?.cacheKey === cacheKey) {
    return discoveryCache.document;
  }

  const discoveryUrl = `${authState.issuer}/.well-known/openid-configuration`;
  const document = await fetchJson(discoveryUrl);
  discoveryCache = {
    cacheKey,
    document
  };
  return document;
}

async function getSigningKey(kid) {
  const discovery = await getDiscoveryDocument();
  const jwksUri = discovery.jwks_uri;
  if (!jwksUri) {
    throw new Error("OIDC discovery document did not include jwks_uri.");
  }

  if (!jwksCache || jwksCache.uri !== jwksUri) {
    jwksCache = {
      uri: jwksUri,
      document: await fetchJson(jwksUri)
    };
  }

  const key = (jwksCache.document.keys || []).find((entry) => entry.kid === kid);
  if (!key) {
    jwksCache = {
      uri: jwksUri,
      document: await fetchJson(jwksUri)
    };
  }

  return (jwksCache.document.keys || []).find((entry) => entry.kid === kid) || null;
}

function verifyJwtSignature(token, key) {
  const [headerEncoded, payloadEncoded, signatureEncoded] = token.split(".");
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  const header = JSON.parse(decodeBase64Url(headerEncoded).toString("utf8"));
  const publicKey = crypto.createPublicKey({
    key,
    format: "jwk"
  });
  const signature = decodeBase64Url(signatureEncoded);

  if (header.alg === "PS256") {
    return crypto.verify("sha256", Buffer.from(signingInput), {
      key: publicKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    }, signature);
  }

  if (header.alg === "RS256") {
    return crypto.verify("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
  }

  throw new Error(`Unsupported ID token signing algorithm: ${header.alg}`);
}

async function verifyIdToken(idToken, expectedNonce) {
  const authState = getAuthState();
  const discovery = await getDiscoveryDocument();
  const [headerEncoded, payloadEncoded] = String(idToken || "").split(".");
  if (!headerEncoded || !payloadEncoded) {
    throw new Error("OIDC token response did not include a valid id_token.");
  }

  const header = JSON.parse(decodeBase64Url(headerEncoded).toString("utf8"));
  const claims = JSON.parse(decodeBase64Url(payloadEncoded).toString("utf8"));
  const key = await getSigningKey(header.kid);
  if (!key) {
    throw new Error("Unable to find the ID token signing key.");
  }

  if (!verifyJwtSignature(idToken, key)) {
    throw new Error("ID token signature verification failed.");
  }

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(authState.clientId)) {
    throw new Error("ID token audience does not match the configured client.");
  }

  const expectedIssuer = discovery.issuer || authState.issuer;
  if (claims.iss !== expectedIssuer) {
    throw new Error("ID token issuer does not match the configured issuer.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && Number(claims.exp) <= now) {
    throw new Error("ID token has expired.");
  }

  if (expectedNonce && claims.nonce !== expectedNonce) {
    throw new Error("OIDC nonce validation failed.");
  }

  return claims;
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    return null;
  }

  const session = getAuthSession(sessionId);
  return session?.user || null;
}

function requireAuthenticatedUser(req, res) {
  const user = getCurrentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Authentication required." });
    return null;
  }

  return user;
}

function getLoginPageState(req) {
  const authState = getAuthState();
  const currentUser = getCurrentUser(req);
  const params = new URL(req.url || "/", "http://localhost").searchParams;
  return {
    enabled: authState.enabled,
    configured: authState.configured,
    providerName: authState.providerName,
    missingFields: authState.missingFields,
    error: params.get("error") || "",
    message: params.get("message") || "",
    currentUser
  };
}

async function handleLogin(req, res) {
  const authState = getAuthState();
  if (!authState.enabled) {
    redirect(res, "/home");
    return;
  }

  if (!authState.configured) {
    redirect(res, `/login?error=${encodeURIComponent(`OIDC is enabled but not configured. Missing: ${authState.missingFields.join(", ")}`)}`);
    return;
  }

  const discovery = await getDiscoveryDocument();
  if (!discovery.authorization_endpoint) {
    throw new Error("OIDC discovery document did not include authorization_endpoint.");
  }

  const requestUrl = new URL(req.url || "/", "http://localhost");
  const loginHint = String(requestUrl.searchParams.get("login_hint") || "").trim();

  const state = randomToken();
  const nonce = randomToken();
  const signedFlowState = signPayload({
    state,
    nonce,
    createdAt: Date.now()
  }, authState.cookieSecret);

  setCookie(res, FLOW_COOKIE_NAME, signedFlowState, {
    httpOnly: true,
    sameSite: "Lax",
    secure: resolveSecureCookie(req),
    maxAge: 15 * 60
  });

  const loginUrl = new URL(discovery.authorization_endpoint);
  loginUrl.searchParams.set("response_type", "code");
  loginUrl.searchParams.set("client_id", authState.clientId);
  loginUrl.searchParams.set("redirect_uri", authState.redirectUri);
  loginUrl.searchParams.set("scope", authState.scope);
  loginUrl.searchParams.set("state", state);
  loginUrl.searchParams.set("nonce", nonce);
  if (loginHint) {
    loginUrl.searchParams.set("login_hint", loginHint);
  }

  redirect(res, loginUrl.toString());
}

function createSessionForLocalUser(req, res, user) {
  const authState = getAuthState();
  const session = createAuthSession({
    ...user,
    provider: user.provider || LOCAL_ACCOUNT_PROVIDER,
    issuer: user.issuer || "local"
  }, authState.sessionTtlHours);

  upsertAuthUser(session.user);
  setCookie(res, SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "Lax",
    secure: resolveSecureCookie(req),
    maxAge: authState.sessionTtlHours * 60 * 60
  });

  return session;
}

function handleLocalLogin(req, res) {
  const authState = getAuthState();
  if (!authState.localAuthEnabled) {
    sendJson(res, 403, { error: "Local sign-in is disabled on this host." });
    return;
  }

  parseRequestBody(req, (parseError, payload) => {
    if (parseError) {
      sendJson(res, 400, { error: "Invalid login payload." });
      return;
    }

    try {
      const user = authenticateLocalAccount(payload?.loginId || payload?.email || "", payload?.password || "");
      clearCookie(res, FLOW_COOKIE_NAME);
      const session = createSessionForLocalUser(req, res, user);
      sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: session.user
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to sign in." });
    }
  });
}

function handleLocalRegister(req, res) {
  const authState = getAuthState();
  if (!authState.localAuthEnabled) {
    sendJson(res, 403, { error: "Local registration is disabled on this host." });
    return;
  }

  parseRequestBody(req, (parseError, payload) => {
    if (parseError) {
      sendJson(res, 400, { error: "Invalid registration payload." });
      return;
    }

    try {
      const name = String(payload?.name || "").trim();
      const email = String(payload?.email || "").trim();
      const password = String(payload?.password || "");
      const confirmPassword = String(payload?.confirmPassword || "");

      if (!name || !email || !password || !confirmPassword) {
        sendJson(res, 400, { error: "Complete all registration fields." });
        return;
      }

      if (password !== confirmPassword) {
        sendJson(res, 400, { error: "Passwords do not match." });
        return;
      }

      const user = createLocalAccount({
        name,
        email,
        password
      });
      clearCookie(res, FLOW_COOKIE_NAME);
      const session = createSessionForLocalUser(req, res, user);
      sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: session.user
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to create the account." });
    }
  });
}

async function handleCallback(req, res) {
  const authState = getAuthState();
  if (!authState.enabled) {
    redirect(res, "/home");
    return;
  }

  if (!authState.configured) {
    redirect(res, `/login?error=${encodeURIComponent("OIDC is enabled but not fully configured on the server.")}`);
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const code = String(url.searchParams.get("code") || "").trim();
  const state = String(url.searchParams.get("state") || "").trim();
  const providerError = String(url.searchParams.get("error") || "").trim();
  const providerErrorDescription = String(url.searchParams.get("error_description") || "").trim();

  if (providerError) {
    redirect(res, `/login?error=${encodeURIComponent(providerErrorDescription || providerError)}`);
    return;
  }

  const cookies = parseCookies(req);
  const flowState = verifySignedPayload(cookies[FLOW_COOKIE_NAME], authState.cookieSecret);
  if (!flowState || !code || !state || flowState.state !== state) {
    clearCookie(res, FLOW_COOKIE_NAME);
    redirect(res, `/login?error=${encodeURIComponent("OIDC callback state validation failed.")}`);
    return;
  }

  const discovery = await getDiscoveryDocument();
  if (!discovery.token_endpoint) {
    throw new Error("OIDC discovery document did not include token_endpoint.");
  }

  const tokenResponse = await fetchJson(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: authState.redirectUri,
      client_id: authState.clientId,
      client_secret: authState.clientSecret
    })
  });

  const idTokenClaims = await verifyIdToken(tokenResponse.id_token, flowState.nonce);

  let userClaims = idTokenClaims;
  if (tokenResponse.access_token && discovery.userinfo_endpoint) {
    try {
      userClaims = await fetchJson(discovery.userinfo_endpoint, {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`
        }
      });
    } catch (error) {
      userClaims = idTokenClaims;
    }
  }

  const conciseUser = buildConciseUserProfile(userClaims);
  const session = createAuthSession({
    ...conciseUser,
    provider: authState.providerName,
    issuer: authState.issuer
  }, authState.sessionTtlHours);

  upsertAuthUser(session.user);

  clearCookie(res, FLOW_COOKIE_NAME);
  setCookie(res, SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "Lax",
    secure: resolveSecureCookie(req),
    maxAge: authState.sessionTtlHours * 60 * 60
  });

  redirect(res, "/home");
}

function handleLogout(req, res) {
  const authState = getAuthState();
  const cookies = parseCookies(req);
  deleteAuthSession(cookies[SESSION_COOKIE_NAME]);
  clearCookie(res, SESSION_COOKIE_NAME);
  clearCookie(res, FLOW_COOKIE_NAME);

  if (authState.postLogoutRedirectUri) {
    redirect(res, authState.postLogoutRedirectUri);
    return;
  }

  redirect(res, "/login?message=You%20have%20been%20signed%20out.");
}

function handleAuthMe(req, res) {
  const authState = getAuthState();
  const user = getCurrentUser(req);

  sendJson(res, 200, {
    authMode: authState.authMode,
    enabled: authState.enabled,
    configured: authState.configured,
    providerName: authState.providerName,
    registrationUrl: authState.registrationUrl || "",
    supportUrl: authState.supportUrl || "",
    localAuthEnabled: authState.localAuthEnabled,
    missingFields: authState.missingFields,
    retentionDays: getAuthUserRetentionDays(),
    authenticated: Boolean(user),
    canClearStoredProfile: Boolean(user),
    user: user || null
  });
}

function ensureAuthRuntimeFiles() {
  ensureAuthStorage();
}

function handleClearStoredProfile(req, res) {
  const user = requireAuthenticatedUser(req, res);
  if (!user) {
    return;
  }

  const cookies = parseCookies(req);
  deleteAuthSession(cookies[SESSION_COOKIE_NAME]);
  clearCookie(res, SESSION_COOKIE_NAME);
  clearCookie(res, FLOW_COOKIE_NAME);

  const result = clearAuthUserData(user);
  sendJson(res, 200, {
    ok: true,
    cleared: result.cleared,
    deletedSessions: result.deletedSessions,
    message: "Stored sign-in data was cleared for this user."
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  handleClearStoredProfile,
  ensureAuthRuntimeFiles,
  getCurrentUser,
  getLoginPageState,
  handleAuthMe,
  handleCallback,
  handleLogin,
  handleLocalLogin,
  handleLocalRegister,
  handleLogout,
  redirect,
  requireAuthenticatedUser
};
