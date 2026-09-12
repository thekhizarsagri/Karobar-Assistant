import { useState } from "react";
import ExpenseScheduleModal from "./ExpenseScheduleModal";
import ExpenseFormModal from "./ExpenseFormModal";

function formatMoney(currency, value) {
  return `${currency}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initialOf(label) {
  return String(label || "?").trim().charAt(0).toUpperCase();
}

function MonthlyExpensesPage({ expenses, metrics, nextDeductions, recentDeductions, currency, onRefresh }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [pageError, setPageError] = useState("");
  const [needsRecovery, setNeedsRecovery] = useState(false);

  const safeExpenses = expenses || [];
  const safeNext = nextDeductions || [];
  const safeRecent = recentDeductions || [];
  const activeExpenses = safeExpenses.filter((e) => e.enabled);

  const totalExpenses = activeExpenses
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const availableBalance = metrics?.available_balance ?? 0;

  const handleServerError = (data, fallback) => {
    if (data && data.error === "no_profile") {
      setNeedsRecovery(true);
      return "Business data not found on the server. It may have been lost — try reloading below.";
    }
    return (data && data.message) || fallback;
  };

  const handleReload = async () => {
    setPageError("");
    try {
      await onRefresh?.();
      setNeedsRecovery(false);
    } catch {
      setPageError("Could not reload data. Please try again.");
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setPageError("");
    setNeedsRecovery(false);
    setFormOpen(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setPageError("");
    setFormOpen(true);
  };

  const handleDelete = async (expense) => {
    if (!confirm(`Delete "${expense.label}"? This cannot be undone.`)) return;
    setPageError("");
    try {
      const res = await fetch(`/api/expenses/${expense.key}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setPageError(handleServerError(data, "Could not delete expense."));
        return;
      }
      onRefresh?.();
    } catch {
      setPageError("Could not delete expense. Please try again.");
    }
  };

  return (
    <div className="expenses-page">
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--expenses" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Monthly Expenses</h1>
            <p className="analytics-subtitle">Track and automate your recurring business expenses</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <button type="button" className="add-stock-btn" onClick={() => setScheduleOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Set Auto-Deduction
          </button>
          <button type="button" className="expenses-add-btn" onClick={handleAdd}>
            <span aria-hidden="true">+</span> Add Expense
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="analytics-stats expenses-page-stats">
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--amber" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className="analytics-stat-value">{formatMoney(currency, totalExpenses)}</strong>
            <span className="analytics-stat-label">Total monthly expenses</span>
            <span className="analytics-stat-sub">{activeExpenses.length} active expense{activeExpenses.length === 1 ? "" : "s"}</span>
          </span>
        </div>
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--green" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2.5" />
              <path d="M2 10h20" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className={`analytics-stat-value ${availableBalance >= 0 ? "expenses-balance--pos" : "expenses-balance--neg"}`}>
              {formatMoney(currency, availableBalance)}
            </strong>
            <span className="analytics-stat-label">Available balance</span>
            <span className="analytics-stat-sub">After planned expenses</span>
          </span>
        </div>
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--blue" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className="analytics-stat-value">{safeNext.length}</strong>
            <span className="analytics-stat-label">Upcoming deductions</span>
            <span className="analytics-stat-sub">Scheduled auto-deductions</span>
          </span>
        </div>
      </div>

      {(pageError || needsRecovery) && (
        <div className="expenses-page-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{pageError || "Business data not found on the server."}</p>
          {needsRecovery && (
            <button type="button" onClick={handleReload}>Reload data</button>
          )}
        </div>
      )}

      {/* ── All expenses ── */}
      <section className="analytics-section expenses-section-card">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--expenses" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">All Expenses</h2>
            <p className="analytics-section-sub">
              {activeExpenses.length === 0 ? "No expenses configured yet." : `${activeExpenses.length} active expense${activeExpenses.length === 1 ? "" : "s"}`}
            </p>
          </span>
        </div>
        <div className="expenses-page-list">
          {activeExpenses.length === 0 && (
            <div className="analytics-empty">
              <span className="analytics-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <p className="analytics-empty-title">No expenses configured yet</p>
              <p className="analytics-empty-sub">Click “Add Expense” to create your first one.</p>
            </div>
          )}
          {activeExpenses.map((expense, idx) => (
            <div key={expense.key ?? `expense-${idx}`} className="expenses-page-item active analytics-card-animated" style={{ animationDelay: `${Math.min(idx, 11) * 35}ms` }}>
              <div className="expenses-page-item-left">
                <span className="expenses-item-avatar" aria-hidden="true">{initialOf(expense.label)}</span>
                <div className="expenses-page-item-info">
                  <span className="expenses-page-item-name">{expense.label}</span>
                  <span className="expenses-page-item-status">
                    <span className="expenses-status-pill">Active</span>
                    {expense.deduction_day > 0 && (
                      <> · Day {expense.deduction_day} at {expense.deduction_time}</>
                    )}
                  </span>
                </div>
              </div>
              <div className="expenses-page-item-right">
                <span className="expenses-page-item-amount">
                  {currency}{Number(expense.amount || 0).toLocaleString()}
                </span>
                <div className="expenses-page-item-actions">
                  <button
                    type="button"
                    className="expenses-action-btn"
                    onClick={() => handleEdit(expense)}
                    title="Edit expense"
                    aria-label={`Edit ${expense.label}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="expenses-action-btn expenses-action-btn--danger"
                    onClick={() => handleDelete(expense)}
                    title="Delete expense"
                    aria-label={`Delete ${expense.label}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {safeNext.length > 0 && (
        <section className="analytics-section expenses-section-card">
          <div className="analytics-section-head">
            <span className="analytics-section-icon analytics-section-icon--calendar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2.5" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <span className="analytics-section-titles">
              <h2 className="analytics-section-title">Upcoming Deductions</h2>
              <p className="analytics-section-sub">{safeNext.length} scheduled deduction{safeNext.length === 1 ? "" : "s"}</p>
            </span>
          </div>
          <div className="expenses-page-list">
            {safeNext.map((d, idx) => (
              <div key={d.key ?? `next-${idx}`} className="expenses-page-item active analytics-card-animated" style={{ animationDelay: `${Math.min(idx, 11) * 35}ms` }}>
                <div className="expenses-page-item-left">
                  <span className="expenses-item-avatar expenses-item-avatar--amber" aria-hidden="true">{initialOf(d.label)}</span>
                  <div className="expenses-page-item-info">
                    <span className="expenses-page-item-name">{d.label}</span>
                    <span className="expenses-page-item-status">
                      <span className="expenses-status-pill expenses-status-pill--warn">Scheduled</span>
                    </span>
                  </div>
                </div>
                <div className="expenses-page-item-right">
                  <span className="expenses-page-item-amount negative">
                    -{currency}{Number(d.amount || 0).toLocaleString()}
                  </span>
                  <span className="expenses-page-item-schedule">
                    Day {d.deduction_day} at {d.deduction_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {safeRecent.length > 0 && (
        <section className="analytics-section expenses-section-card">
          <div className="analytics-section-head">
            <span className="analytics-section-icon analytics-section-icon--check" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="analytics-section-titles">
              <h2 className="analytics-section-title">Recent Deductions</h2>
              <p className="analytics-section-sub">{safeRecent.length} completed deduction{safeRecent.length === 1 ? "" : "s"}</p>
            </span>
          </div>
          <div className="expenses-page-list">
            {safeRecent.map((d, i) => (
              <div key={d.key ?? `recent-${i}`} className="expenses-page-item completed analytics-card-animated" style={{ animationDelay: `${Math.min(i, 11) * 35}ms` }}>
                <div className="expenses-page-item-left">
                  <span className="expenses-item-avatar expenses-item-avatar--green" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="expenses-page-item-info">
                    <span className="expenses-page-item-name">{d.expense_label}</span>
                    <span className="expenses-page-item-status">
                      Deducted {d.deducted_at ? new Date(d.deducted_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <div className="expenses-page-item-right">
                  <span className="expenses-page-item-amount negative">
                    -{currency}{Number(d.amount || 0).toLocaleString()}
                  </span>
                  <span className="expenses-page-item-schedule">
                    {currency}{Number(d.balance_before || 0).toLocaleString()} → {currency}{Number(d.balance_after || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ExpenseScheduleModal
        expenses={safeExpenses}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSuccess={onRefresh}
      />

      <ExpenseFormModal
        expense={editingExpense}
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSuccess={onRefresh}
        existingKeys={safeExpenses.map((e) => e.key)}
        currency={currency}
      />
    </div>
  );
}

export default MonthlyExpensesPage;
