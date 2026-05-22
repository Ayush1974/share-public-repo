(async function bootLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const loginChoiceRow = document.getElementById("loginChoiceRow");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const passwordToggle = document.getElementById("loginPasswordToggle");
  const passwordField = document.getElementById("passwordField");
  const loginSubmitButton = document.getElementById("loginSubmitButton");
  const oracleSsoChoiceButton = document.getElementById("oracleSsoChoiceButton");
  const passwordChoiceButton = document.getElementById("passwordChoiceButton");
  const registerNowButton = document.getElementById("registerNowButton");
  const registerLinks = document.getElementById("registerLinks");
  const messageBox = document.getElementById("loginMessage");
  const errorBox = document.getElementById("loginError");
  const subcopy = document.getElementById("loginSubcopy");
  let passwordFlowVisible = false;

  let authState = {
    authMode: "local",
    enabled: false,
    configured: true,
    registrationUrl: "",
    localAuthEnabled: true
  };

  const searchParams = new URLSearchParams(window.location.search);

  function showMessage(element, value) {
    if (!element) {
      return;
    }

    const text = String(value || "").trim();
    element.hidden = !text;
    element.textContent = text;
  }

  function attachPasswordToggle(button, input) {
    if (!button || !input) {
      return;
    }

    button.addEventListener("click", () => {
      const nextVisible = input.type === "password";
      input.type = nextVisible ? "text" : "password";
      button.textContent = nextVisible ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(nextVisible));
      input.focus({ preventScroll: true });
      try {
        const valueLength = input.value.length;
        input.setSelectionRange(valueLength, valueLength);
      } catch (error) {
        // Selection restore is best-effort only.
      }
    });
  }

  function setPasswordFlowVisible(nextVisible) {
    passwordFlowVisible = Boolean(nextVisible) && authState.localAuthEnabled;
    loginForm.hidden = !passwordFlowVisible;
    loginForm.setAttribute("aria-hidden", String(!passwordFlowVisible));
    if (registerLinks) {
      registerLinks.hidden = !passwordFlowVisible || !authState.localAuthEnabled;
      registerLinks.setAttribute("aria-hidden", String(registerLinks.hidden));
    }
    if (passwordField) {
      passwordField.hidden = !passwordFlowVisible;
    }
    if (passwordChoiceButton) {
      passwordChoiceButton.classList.toggle("login-choice-button-active", passwordFlowVisible);
      passwordChoiceButton.disabled = !authState.localAuthEnabled;
    }
    if (oracleSsoChoiceButton) {
      oracleSsoChoiceButton.classList.toggle("login-choice-button-active", !passwordFlowVisible);
    }
    if (passwordFlowVisible) {
      passwordInput?.focus();
    }
  }

  function syncAuthModeUi() {
    if (loginSubmitButton) {
      loginSubmitButton.textContent = "Sign in";
    }
    if (subcopy) {
      subcopy.textContent = authState.authMode === "oracle-sso"
        ? "Continue with Oracle SSO, or switch to password sign-in only if local auth is enabled on this host."
        : "Choose how you want to continue into the issue investigation workspace.";
    }
    if (oracleSsoChoiceButton) {
      oracleSsoChoiceButton.disabled = false;
    }
    if (loginChoiceRow) {
      loginChoiceRow.classList.toggle("login-choice-row-single", !authState.localAuthEnabled);
    }
    setPasswordFlowVisible(authState.authMode === "local" ? false : passwordFlowVisible);
  }

  function buildLoginUrl() {
    const loginUrl = new URL("/auth/login", window.location.origin);
    const email = String(emailInput?.value || "").trim();
    if (email) {
      loginUrl.searchParams.set("login_hint", email);
    }
    return loginUrl.toString();
  }

  try {
    const response = await fetch("/auth/me", {
      headers: {
        Accept: "application/json"
      }
    });

    if (response.ok) {
      const payload = await response.json();
      authState = {
        authMode: String(payload.authMode || "local").trim() || "local",
        enabled: Boolean(payload.enabled),
        configured: Boolean(payload.configured),
        registrationUrl: String(payload.registrationUrl || "").trim(),
        localAuthEnabled: payload.localAuthEnabled !== false
      };
    }
  } catch (error) {
    authState = {
      authMode: "local",
      enabled: false,
      configured: true,
      registrationUrl: "",
      localAuthEnabled: true
    };
  }

  syncAuthModeUi();
  setPasswordFlowVisible(false);
  attachPasswordToggle(passwordToggle, passwordInput);

  showMessage(messageBox, searchParams.get("message"));
  showMessage(errorBox, searchParams.get("error"));

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!searchParams.get("message")) {
      showMessage(messageBox, "");
    }
    showMessage(errorBox, "");

    const email = String(emailInput?.value || "").trim();
    const password = String(passwordInput?.value || "").trim();
    if (!email || !password) {
      showMessage(errorBox, "Enter both login id and password.");
      return;
    }

    if (!authState.localAuthEnabled) {
      showMessage(errorBox, "Password sign-in is disabled on this host.");
      return;
    }

    try {
      const response = await fetch("/auth/login/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          loginId: email,
          password
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showMessage(errorBox, payload.error || "Unable to sign in.");
        return;
      }

      window.location.assign("/home");
    } catch (error) {
      showMessage(errorBox, "Unable to sign in right now.");
    }
  });

  oracleSsoChoiceButton?.addEventListener("click", () => {
    showMessage(errorBox, "");
    if (!authState.enabled || !authState.configured) {
      showMessage(errorBox, "Oracle SSO details are not filled on this host yet.");
      return;
    }

    window.location.assign(buildLoginUrl());
  });

  passwordChoiceButton?.addEventListener("click", () => {
    showMessage(errorBox, "");
    if (!authState.localAuthEnabled) {
      showMessage(errorBox, "Password sign-in is disabled on this host.");
      return;
    }

    setPasswordFlowVisible(true);
    emailInput?.focus();
  });

  registerNowButton?.addEventListener("click", () => {
    showMessage(errorBox, "");

    if (authState.registrationUrl) {
      window.location.assign(authState.registrationUrl);
      return;
    }

    window.location.assign("/register");
  });
}());
