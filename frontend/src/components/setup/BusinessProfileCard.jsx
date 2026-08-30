import { businessTypes, currencies } from "./constants";

function BusinessProfileCard({ value, onInput, currentCurrency }) {
  return (
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
              onChange={onInput}
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
            <select name="businessType" value={value.businessType} onChange={onInput}>
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
              onChange={onInput}
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
              onChange={onInput}
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
              onChange={onInput}
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
              onChange={onInput}
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
            onChange={onInput}
            placeholder="Provide a brief summary of what your company offers, core specialties, or mission..."
          />
        </label>
      </div>
    </div>
  );
}

export default BusinessProfileCard;
