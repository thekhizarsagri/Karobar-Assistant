export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return { valid: false, error: "Email is required." };
  }
  if (trimmed.length > 254) {
    return { valid: false, error: "Email looks too long." };
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, error: "Email cannot contain spaces." };
  }
  if (!trimmed.includes("@")) {
    return { valid: false, error: "Email must contain @, e.g. you@company.com" };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: "Enter a valid email ending with a domain, e.g. you@company.com",
    };
  }
  return { valid: true, error: "" };
}

export function validateUsername(value) {
  const raw = String(value || "");
  if (!raw) {
    return { valid: true, error: "" };
  }
  if (/\s/.test(raw)) {
    return { valid: false, error: "Username cannot contain spaces." };
  }
  return { valid: true, error: "" };
}

export function getPasswordStrength(password) {
  const value = String(password || "");
  const checks = {
    length8: value.length >= 8,
    length12: value.length >= 12,
    mixedCase: /[a-z]/.test(value) && /[A-Z]/.test(value),
    digit: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  let score = 0;
  if (checks.length8) score += 1;
  if (checks.length12) score += 1;
  if (checks.mixedCase) score += 1;
  if (checks.digit) score += 1;
  if (checks.special) score += 1;

  let level = "weak";
  let label = "Weak";
  if (value.length === 0) {
    score = 0;
    level = "empty";
    label = "Enter a password";
  } else if (score <= 2) {
    level = "weak";
    label = "Weak";
  } else if (score === 3) {
    level = "medium";
    label = "Medium";
  } else if (score === 4) {
    level = "strong";
    label = "Strong";
  } else {
    level = "very-strong";
    label = "Very strong";
  }

  return {
    score,
    level,
    label,
    checks,
    meetsMinimum: score >= 3 && checks.length8,
  };
}

export function validatePassword(password) {
  const value = String(password || "");
  if (!value) {
    return { valid: false, error: "Password is required." };
  }
  const strength = getPasswordStrength(value);
  if (value.length < 8) {
    return { valid: false, error: "Use at least 8 characters.", strength };
  }
  if (!strength.meetsMinimum) {
    return {
      valid: false,
      error: "Password is too weak — reach at least Medium strength.",
      strength,
    };
  }
  return { valid: true, error: "", strength };
}
