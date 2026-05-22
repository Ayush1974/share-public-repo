(function bootRegisterPage() {
  const registerForm = document.getElementById("registerForm");
  const nameInput = document.getElementById("registerName");
  const emailInput = document.getElementById("registerEmail");
  const passwordInput = document.getElementById("registerPassword");
  const passwordToggle = document.getElementById("registerPasswordToggle");
  const confirmPasswordInput = document.getElementById("registerConfirmPassword");
  const confirmPasswordToggle = document.getElementById("registerConfirmPasswordToggle");
  const confirmPasswordHint = document.getElementById("confirmPasswordHint");
  const messageBox = document.getElementById("registerMessage");
  const errorBox = document.getElementById("registerError");
  const strengthLabel = document.getElementById("passwordStrengthLabel");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthHint = document.getElementById("passwordStrengthHint");
  const checklist = {
    length: document.getElementById("passwordCheckLength"),
    uppercase: document.getElementById("passwordCheckUppercase"),
    lowercase: document.getElementById("passwordCheckLowercase"),
    number: document.getElementById("passwordCheckNumber"),
    special: document.getElementById("passwordCheckSpecial"),
    personalInfo: document.getElementById("passwordCheckPersonalInfo")
  };

  function showMessage(element, value) {
    if (!element) {
      return;
    }

    const text = String(value || "").trim();
    element.hidden = !text;
    element.textContent = text;
  }

  function showConfirmPasswordHint(value, isError = false) {
    if (!confirmPasswordHint) {
      return;
    }

    const text = String(value || "").trim();
    confirmPasswordHint.hidden = !text;
    confirmPasswordHint.textContent = text;
    confirmPasswordHint.classList.toggle("password-confirm-hint-error", Boolean(text) && isError);
    confirmPasswordHint.classList.toggle("password-confirm-hint-success", Boolean(text) && !isError);
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

  function evaluatePassword(password, profile) {
    const candidate = String(password || "");
    const rawTokens = [
      String(profile.email || "").toLowerCase(),
      String(profile.email || "").split("@")[0].toLowerCase()
    ];
    const tokens = rawTokens
      .flatMap((value) => value.split(/[^a-z0-9]+/))
      .filter((token) => token.length >= 3);
    const normalizedCandidate = candidate.toLowerCase();
    const checks = {
      length: candidate.length >= 8,
      uppercase: /[A-Z]/.test(candidate),
      lowercase: /[a-z]/.test(candidate),
      number: /\d/.test(candidate),
      special: /[^A-Za-z0-9]/.test(candidate),
      personalInfo: !tokens.some((token) => normalizedCandidate.includes(token))
    };
    const score = Object.values(checks).filter(Boolean).length;
    const label = score >= 6 ? "Strong" : score >= 4 ? "Medium" : "Weak";
    return {
      score,
      label,
      checks,
      valid: checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special && checks.personalInfo
    };
  }

  function updateChecklistState(checks) {
    for (const [key, element] of Object.entries(checklist)) {
      if (!element) {
        continue;
      }

      element.classList.toggle("password-check-item-passed", Boolean(checks[key]));
    }
  }

  function updateStrengthUi() {
    const evaluation = evaluatePassword(String(passwordInput?.value || ""), {
      displayName: String(nameInput?.value || ""),
      email: String(emailInput?.value || "")
    });
    updateChecklistState(evaluation.checks);

    if (strengthLabel) {
      strengthLabel.textContent = evaluation.label;
      strengthLabel.className = `password-strength-value password-strength-${evaluation.label.toLowerCase()}`;
    }

    if (strengthBar) {
      strengthBar.className = `password-strength-bar-fill password-strength-${evaluation.label.toLowerCase()}`;
      strengthBar.style.width = `${Math.max(12, (evaluation.score / 6) * 100)}%`;
    }

    if (strengthHint) {
      strengthHint.textContent = evaluation.valid
        ? "Password meets the current local sign-in policy."
        : "Use 8+ characters with uppercase, lowercase, number, special character, and avoid personal details.";
    }

    return evaluation;
  }

  function updateConfirmPasswordState() {
    const password = String(passwordInput?.value || "");
    const confirmPassword = String(confirmPasswordInput?.value || "");

    if (!confirmPassword) {
      confirmPasswordInput?.setCustomValidity("");
      showConfirmPasswordHint("");
      return true;
    }

    if (password !== confirmPassword) {
      confirmPasswordInput?.setCustomValidity("Passwords do not match.");
      showConfirmPasswordHint("Passwords do not match.", true);
      return false;
    }

    confirmPasswordInput?.setCustomValidity("");
    showConfirmPasswordHint("Passwords match.");
    return true;
  }

  nameInput?.addEventListener("input", updateStrengthUi);
  emailInput?.addEventListener("input", updateStrengthUi);
  passwordInput?.addEventListener("input", () => {
    updateStrengthUi();
    updateConfirmPasswordState();
  });
  confirmPasswordInput?.addEventListener("input", updateConfirmPasswordState);
  attachPasswordToggle(passwordToggle, passwordInput);
  attachPasswordToggle(confirmPasswordToggle, confirmPasswordInput);
  updateStrengthUi();
  updateConfirmPasswordState();

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(messageBox, "");
    showMessage(errorBox, "");

    const name = String(nameInput?.value || "").trim();
    const email = String(emailInput?.value || "").trim().toLowerCase();
    const password = String(passwordInput?.value || "");
    const confirmPassword = String(confirmPasswordInput?.value || "");

    if (!name || !email || !password || !confirmPassword) {
      showMessage(errorBox, "Complete all registration fields.");
      return;
    }

    if (!/@oracle\.com$/i.test(email)) {
      showMessage(errorBox, "Use a valid Oracle email address.");
      return;
    }

    const evaluation = updateStrengthUi();

    if (!evaluation.valid) {
      showMessage(errorBox, "Password must be 8+ characters and include uppercase, lowercase, number, special character, and no personal details.");
      return;
    }

    if (!updateConfirmPasswordState()) {
      showMessage(errorBox, "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/auth/register/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showMessage(errorBox, payload.error || "Unable to create the account.");
        return;
      }

      showMessage(messageBox, "Registration complete. Redirecting to Home...");
      window.setTimeout(() => {
        window.location.assign("/home");
      }, 250);
    } catch (error) {
      showMessage(errorBox, "Unable to create the account right now.");
    }
  });
}());
