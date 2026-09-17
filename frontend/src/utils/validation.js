export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fail = (error) => ({ valid: false, error });
const ok = (extra = {}) => ({ valid: true, error: "", ...extra });

export function validateEmail(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return fail("Email is required.");
  if (trimmed.length > 254) return fail("Email looks too long.");
  if (/\s/.test(trimmed) || !trimmed.includes("@")) return fail("Email must contain @, e.g. you@company.com");
  if (!EMAIL_PATTERN.test(trimmed)) return fail("Enter a valid email ending with a domain, e.g. you@company.com");
  return ok();
}

export function validateUsername(value) {
  const raw = String(value || "");
  return /\s/.test(raw) ? fail("Username cannot contain spaces.") : ok();
}

export function getPasswordStrength(password) {
  const value = String(password || "");
  if (!value) return { score: 0, level: "empty", label: "Enter a password", checks: {}, meetsMinimum: false };
  const checks = {
    length8: value.length >= 8,
    length12: value.length >= 12,
    mixedCase: /[a-z]/.test(value) && /[A-Z]/.test(value),
    digit: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const [level, label] =
    score <= 2 ? ["weak", "Weak"] : score === 3 ? ["medium", "Medium"] : score === 4 ? ["strong", "Strong"] : ["very-strong", "Very strong"];
  return { score, level, label, checks, meetsMinimum: score >= 3 && checks.length8 };
}

export function validatePassword(password) {
  const value = String(password || "");
  if (!value) return fail("Password is required.");
  if (value.length < 8) return { ...fail("Use at least 8 characters."), strength: getPasswordStrength(value) };
  const strength = getPasswordStrength(value);
  if (!strength.meetsMinimum)
    return { ...fail("Password is too weak — reach at least Medium strength."), strength };
  return ok({ strength });
}
