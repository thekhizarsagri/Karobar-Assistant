import { useState } from "react";
import ExpenseScheduleModal from "./ExpenseScheduleModal";
import ExpenseFormModal from "./ExpenseFormModal";

function MonthlyExpensesPage({ expenses, metrics, nextDeductions, recentDeductions, currency, onRefresh }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const activeExpenses = expenses.filter((e) => e.enabled);

  const totalExpenses = activeExpenses
    .reduce((sum, e) => sum + e.amount, 0);

  const availableBalance = metrics?.available_balance ?? 0;

  const handleAdd = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = async (expense) => {
    if (!confirm(`Delete "${expense.label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/expenses/${expense.key}`, { method: "DELETE" });
      if (res.ok) onRefresh?.();
    } catch {}
  };

  return (
    <div className="expenses-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Monthly Expenses</h1>
          <p className="analytics-subtitle">Track and automate your recurring business expenses</p>
        </div>
        <div className="expenses-header-actions">
          <button type="button" className="add-stock-btn" onClick={() => setScheduleOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Set Auto-Deduction
          </button>
          <button type="button" className="expenses-add-btn" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Expense
          </button>
        </div>
      </div>

      <div className="expenses-page-stats">
        <div className="expenses-stat-card">
          <span className="expenses-stat-label">Total Monthly Expenses</span>
          <span className="expenses-stat-value">{currency}{totalExpenses.toLocaleString()}</span>
        </div>
        <div className="expenses-stat-card">
          <span className="expenses-stat-label">Available Balance</span>
          <span className={`expenses-stat-value ${availableBalance >= 0 ? "positive" : "negative"}`}>
            {currency}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="expenses-stat-card">
          <span className="expenses-stat-label">Active Expenses</span>
          <span className="expenses-stat-value">{activeExpenses.length}</span>
        </div>
      </div>

      <div className="expenses-page-section">
        <div className="expenses-section-header">
          <h2 className="expenses-section-title">All Expenses</h2>
        </div>
        <div className="expenses-page-list">
          {activeExpenses.length === 0 && (
            <div className="expenses-empty">
              <p>No expenses configured yet.</p>
              <p>Click "Add Expense" to create your first one.</p>
            </div>
          )}
          {activeExpenses.map((expense) => (
            <div key={expense.key} className="expenses-page-item active">
              <div className="expenses-page-item-left">
                <div className="expenses-page-dot on" />
                <div className="expenses-page-item-info">
                  <span className="expenses-page-item-name">{expense.label}</span>
                  <span className="expenses-page-item-status">
                    Active
                    {expense.deduction_day > 0 && (
                      <> · Day {expense.deduction_day} at {expense.deduction_time}</>
                    )}
                  </span>
                </div>
              </div>
              <div className="expenses-page-item-right">
                <span className="expenses-page-item-amount">
                  {currency}{expense.amount.toLocaleString()}
                </span>
                <div className="expenses-page-item-actions">
                  <button
                    type="button"
                    className="expenses-action-btn"
                    onClick={() => handleEdit(expense)}
                    title="Edit expense"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="expenses-action-btn expenses-action-btn--danger"
                    onClick={() => handleDelete(expense)}
                    title="Delete expense"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {nextDeductions.length > 0 && (
        <div className="expenses-page-section">
          <h2 className="expenses-section-title">Upcoming Deductions</h2>
          <div className="expenses-page-list">
            {nextDeductions.map((d) => (
              <div key={d.key} className="expenses-page-item active">
                <div className="expenses-page-item-left">
                  <div className="expenses-page-dot on" />
                  <div className="expenses-page-item-info">
                    <span className="expenses-page-item-name">{d.label}</span>
                    <span className="expenses-page-item-status">Scheduled</span>
                  </div>
                </div>
                <div className="expenses-page-item-right">
                  <span className="expenses-page-item-amount negative">
                    -{currency}{d.amount.toLocaleString()}
                  </span>
                  <span className="expenses-page-item-schedule">
                    Day {d.deduction_day} at {d.deduction_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentDeductions.length > 0 && (
        <div className="expenses-page-section">
          <h2 className="expenses-section-title">Recent Deductions</h2>
          <div className="expenses-page-list">
            {recentDeductions.map((d, i) => (
              <div key={i} className="expenses-page-item completed">
                <div className="expenses-page-item-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div className="expenses-page-item-info">
                    <span className="expenses-page-item-name">{d.expense_label}</span>
                    <span className="expenses-page-item-status">
                      Deducted {new Date(d.deducted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="expenses-page-item-right">
                  <span className="expenses-page-item-amount negative">
                    -{currency}{d.amount.toLocaleString()}
                  </span>
                  <span className="expenses-page-item-schedule">
                    {currency}{d.balance_before.toLocaleString()} → {currency}{d.balance_after.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExpenseScheduleModal
        expenses={expenses}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSuccess={onRefresh}
      />

      <ExpenseFormModal
        expense={editingExpense}
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export default MonthlyExpensesPage;
