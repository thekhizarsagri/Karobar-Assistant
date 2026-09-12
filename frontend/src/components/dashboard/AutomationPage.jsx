import { useState } from "react";
import StockModal from "./StockModal";
import { formatStat } from "../../utils/formatNumber";

function initialsOf(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(rule) {
  const h = String(rule.hour ?? "").padStart(2, "0");
  const m = String(rule.minute ?? "").padStart(2, "0");
  return `${h}:${m} ${rule.ampm || ""}`.trim();
}

function AutomationPage({ products, rules, onRun, onRemove, onSubmit }) {
  const [modalOpen, setModalOpen] = useState(false);

  const safeRules = rules || [];
  const monthlyUnits = safeRules.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  return (
    <div className="automation-page">
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--automation" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Automation</h1>
            <p className="analytics-subtitle">Set up automatic stock additions for your products</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
            <span>
              <span className="analytics-summary-label">Scheduled restock</span>
              <span className="analytics-summary-value">
                {formatStat(monthlyUnits)} units / month · {safeRules.length} rule{safeRules.length === 1 ? "" : "s"}
              </span>
            </span>
          </span>
          <button type="button" className="automation-add-btn" onClick={() => setModalOpen(true)}>
            <span aria-hidden="true">+</span> Add automatic schedule
          </button>
        </div>
      </div>

      {safeRules.length === 0 ? (
        <div className="analytics-empty automation-empty-card">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          <p className="analytics-empty-title">No automatic schedules yet</p>
          <p className="analytics-empty-sub">Add one to auto-restock your products every month.</p>
          <button type="button" className="automation-add-btn automation-add-btn--center" onClick={() => setModalOpen(true)}>
            <span aria-hidden="true">+</span> Add automatic schedule
          </button>
        </div>
      ) : (
        <div className="scheduled-rules-list">
          {safeRules.map((rule, idx) => (
            <div
              key={rule.id ?? `rule-${idx}`}
              className="scheduled-rule-card analytics-card-animated"
              style={{ animationDelay: `${Math.min(idx, 11) * 45}ms` }}
            >
              <div className="scheduled-rule-top">
                <span className="scheduled-rule-avatar" aria-hidden="true">
                  {initialsOf(rule.productName)}
                </span>
                <div className="scheduled-rule-info">
                  <span className="scheduled-rule-product" title={rule.productName}>{rule.productName}</span>
                  <span className="scheduled-rule-chip">
                    <span className="scheduled-rule-dot" aria-hidden="true" />
                    Active · Monthly
                  </span>
                </div>
                <button
                  type="button"
                  className="rule-remove-btn"
                  onClick={() => onRemove(rule.id)}
                  title="Remove this schedule"
                  aria-label={`Remove schedule for ${rule.productName}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="scheduled-rule-meta">
                <span className="scheduled-rule-pill">
                  <strong>+{formatStat(rule.quantity)}</strong> units
                </span>
                <span className="scheduled-rule-pill">Day {rule.dayOfMonth}</span>
                <span className="scheduled-rule-pill">{formatTime(rule)}</span>
              </div>
              <div className="scheduled-rule-actions">
                <button
                  type="button"
                  className="rule-test-btn"
                  onClick={() => onRun(rule)}
                  title="Run this schedule now to test"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                  Run Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StockModal
        products={products}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => {
          setModalOpen(false);
          onSubmit(payload);
        }}
        initialMode="automatic"
      />
    </div>
  );
}

export default AutomationPage;
