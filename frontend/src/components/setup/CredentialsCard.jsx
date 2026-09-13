import { getPasswordStrength } from "../../utils/validation";

function CredentialsCard({
  value,
  onInput,
  onBlur,
  errors = {},
  showPassword,
  onTogglePassword,
}) {
  const emailInvalid = Boolean(errors.email);
  const passwordInvalid = Boolean(errors.password);
  const usernameInvalid = Boolean(errors.username);
  const strength = getPasswordStrength(value.password || "");
  const strengthWidth =
    strength.level === "empty"
      ? "0%"
      : strength.level === "weak"
        ? "25%"
        : strength.level === "medium"
          ? "55%"
          : strength.level === "strong"
            ? "80%"
            : "100%";
  return (
    <div className="setup-card">
      <div className="card-header">
        <div className="card-icon-box blue-gradient">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h3 className="card-title">Owner Credentials & Login Setup</h3>
          <p className="card-desc">Personal details used for administrative access and security.</p>
        </div>
      </div>

      <div className="card-form-grid">
        <label className="form-field">
          <span className="field-label">
            Full Name <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              name="ownerName"
              value={value.ownerName || ""}
              onChange={onInput}
              placeholder="e.g. Alex Harrison"
              required
            />
          </div>
        </label>

        <label className="form-field">
          <span className="field-label">
            Username <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon">
              <span style={{ fontWeight: 700, fontSize: "14px" }}>@</span>
            </span>
            <input
              type="text"
              name="username"
              value={value.username || ""}
              onChange={onInput}
              onBlur={onBlur}
              placeholder="e.g. alex_harrison"
              autoComplete="username"
              aria-invalid={usernameInvalid}
              className={usernameInvalid ? "input-invalid" : ""}
            />
          </div>
          {usernameInvalid ? (
            <p className="field-error" role="alert">
              {errors.username}
            </p>
          ) : (
            <p className="field-hint">No spaces allowed, e.g. alex_harrison</p>
          )}
        </label>

        <label className="form-field">
          <span className="field-label">
            Business Email <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              value={value.email || ""}
              onChange={onInput}
              onBlur={onBlur}
              placeholder="e.g. alex@bottlefactory.com"
              required
              inputMode="email"
              autoComplete="email"
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "email-error" : "email-hint"}
              className={emailInvalid ? "input-invalid" : ""}
            />
          </div>
          {emailInvalid ? (
            <p className="field-error" id="email-error" role="alert">
              {errors.email}
            </p>
          ) : (
            <p className="field-hint" id="email-hint">
              Must end with a valid domain, e.g. you@company.com
            </p>
          )}
        </label>

        <label className="form-field">
          <span className="field-label">
            Setup Password <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={value.password || ""}
              onChange={onInput}
              onBlur={onBlur}
              placeholder="Create master password"
              autoComplete="new-password"
              aria-invalid={passwordInvalid}
              aria-describedby="password-strength-text"
              className={passwordInvalid ? "input-invalid" : ""}
            />
            <button
              type="button"
              className="pwd-toggle-btn"
              onClick={onTogglePassword}
              title={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="pwd-strength" aria-live="polite">
            <div className="pwd-strength-track" aria-hidden="true">
              <div
                className={`pwd-strength-fill pwd-${strength.level}`}
                style={{ width: strengthWidth }}
              />
            </div>
            <div className="pwd-strength-row">
              <span
                id="password-strength-text"
                className={`pwd-level pwd-${strength.level}`}
              >
                {strength.label}
              </span>
              <span className="pwd-required-note">At least Medium required</span>
            </div>
            {passwordInvalid ? (
              <p className="field-error" role="alert">
                {errors.password}
              </p>
            ) : null}
            <ul className="pwd-checks">
              <li className={strength.checks.length8 ? "met" : ""}>
                {strength.checks.length8 ? "✓" : "○"} 8+ characters
              </li>
              <li className={strength.checks.mixedCase ? "met" : ""}>
                {strength.checks.mixedCase ? "✓" : "○"} Upper + lower case
              </li>
              <li className={strength.checks.digit ? "met" : ""}>
                {strength.checks.digit ? "✓" : "○"} Number
              </li>
              <li className={strength.checks.special ? "met" : ""}>
                {strength.checks.special ? "✓" : "○"} Symbol
              </li>
            </ul>
          </div>
        </label>
      </div>
    </div>
  );
}

export default CredentialsCard;
