import { useState } from "react";
import { businessTypes, currencies, fixedExpenseItems } from "./constants";

function BusinessInfoForm({
  value,
  onChange,
  expenses,
  onToggleExpense,
  onChangeExpense,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (event) => {
    const { name, value: raw } = event.target;
    const next = name === "phoneNumber" ? raw.replace(/[^0-9+\s-]/g, "") : raw;
    onChange(name, next);
  };

  // Calculate total monthly active expenses
  const totalMonthlyExpenses = fixedExpenseItems.reduce((acc, item) => {
    if (expenses?.[item.key]?.enabled) {
      return acc + (Number(expenses[item.key]?.amount) || 0);
    }
    return acc;
  }, 0);

  const activeExpenseCount = fixedExpenseItems.filter(
    (item) => expenses?.[item.key]?.enabled
  ).length;

  const currentCurrency =
    currencies.find((c) => c.symbol === value.currency || c.code === value.currency) ||
    currencies[0];

  return (
    <div className="setup-left-column">
      {/* Column Header */}
      <div className="column-header">
        <h2 className="column-title">Company Profile & Owner Access</h2>
        <p className="column-subtitle">
          Configure your business identity, manager credentials, and monthly operating costs.
        </p>
      </div>

      {/* Card 1: Account & Credentials */}
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
                onChange={handleInput}
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
                onChange={handleInput}
                placeholder="e.g. alex_harrison"
              />
            </div>
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
                onChange={handleInput}
                placeholder="e.g. alex@bottlefactory.com"
                required
              />
            </div>
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
                onChange={handleInput}
                placeholder="Create master password"
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
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
          </label>
        </div>
      </div>

      {/* Card 2: Business Information */}
      <div className="setup-card">
        <div className="card-header">
          <div className="card-icon-box emerald-gradient">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h3 className="card-title">Business & Enterprise Profile</h3>
            <p className="card-desc">Commercial details displayed on invoices and financial reports.</p>
          </div>
        </div>

        <div className="card-form-grid">
          <label className="form-field full-width">
            <span className="field-label">
              Business Name <span className="req-star">*</span>
            </span>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <input
                type="text"
                name="businessName"
                value={value.businessName || ""}
                onChange={handleInput}
                placeholder="e.g. Apex Glass & Packaging Co."
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span className="field-label">Business Category / Industry</span>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <select name="businessType" value={value.businessType} onChange={handleInput}>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="form-field">
            <span className="field-label">Preferred Currency</span>
            <div className="input-with-icon">
              <span className="input-icon font-mono font-bold">{currentCurrency.symbol}</span>
              <select
                name="currency"
                value={value.currency || "₹"}
                onChange={handleInput}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.symbol}>
                    {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="form-field">
            <span className="field-label">Contact Phone Number</span>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <input
                type="text"
                name="phoneNumber"
                value={value.phoneNumber || ""}
                onChange={handleInput}
                placeholder="+91 98765 43210"
              />
            </div>
          </label>

          <label className="form-field">
            <span className="field-label">Tax ID / GSTIN / NTN (Optional)</span>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
              <input
                type="text"
                name="taxId"
                value={value.taxId || ""}
                onChange={handleInput}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
            </div>
          </label>

          <label className="form-field full-width">
            <span className="field-label">Business Operating Location / City</span>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <input
                type="text"
                name="location"
                value={value.location || ""}
                onChange={handleInput}
                placeholder="e.g. Industrial Area Phase 2, Mumbai, Maharashtra"
              />
            </div>
          </label>

          <label className="form-field full-width">
            <div className="field-label-row">
              <span className="field-label">Business Description & Tagline</span>
              <span className="field-counter">{value.description?.length || 0}/300</span>
            </div>
            <textarea
              rows="3"
              maxLength="300"
              name="description"
              value={value.description || ""}
              onChange={handleInput}
              placeholder="Provide a brief summary of what your company offers, core specialties, or mission..."
            />
          </label>
        </div>
      </div>

      {/* Card 3: Monthly Fixed Operating Expenses (Static & Non-minimizable) */}
      <div className="setup-card">
        <div className="card-header">
          <div className="card-icon-box purple-gradient">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title-row">
              <h3 className="card-title">Fixed Monthly Operating Expenses</h3>
              <span className="badge-pill">
                {activeExpenseCount} active • {currentCurrency.symbol}
                {totalMonthlyExpenses.toLocaleString()} / mo
              </span>
            </div>
            <p className="card-desc">
              Track overhead costs like rent, utilities, and payroll for accurate profit margins.
            </p>
          </div>
        </div>

        <div className="expenses-container">
          <div className="expenses-mini-grid">
            {fixedExpenseItems.map((item) => {
              const isEnabled = !!expenses?.[item.key]?.enabled;
              const amountVal = expenses?.[item.key]?.amount ?? item.amount;
              return (
                <div
                  key={item.key}
                  className={`expense-item-row ${isEnabled ? "active" : "inactive"}`}
                >
                  <label className="expense-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => onToggleExpense(item.key)}
                      className="custom-checkbox"
                    />
                    <span className="expense-label-text">{item.label}</span>
                  </label>
                  <div className="expense-input-wrapper">
                    <span className="currency-prefix">{currentCurrency.symbol}</span>
                    <input
                      type="number"
                      min="0"
                      disabled={!isEnabled}
                      value={amountVal}
                      onChange={(e) => onChangeExpense(item.key, e.target.value)}
                      placeholder="0"
                      className="expense-amount-input"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="expenses-summary-bar">
            <span className="summary-text">Total Monthly Overhead:</span>
            <span className="summary-amount">
              {currentCurrency.symbol}
              {totalMonthlyExpenses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessInfoForm;