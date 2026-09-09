import { useState, useEffect } from "react";
import ModalPortal from "./ModalPortal";

function ExpenseFormModal({ expense, isOpen, onClose, onSuccess, existingKeys = [], currency = "₹" }) {
  const isEdit = !!expense;

  const [form, setForm] = useState({
    key: "",
    label: "",
    amount: "",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setForm({
          key: expense.key,
          label: expense.label,
          amount: String(expense.amount || ""),
          enabled: expense.enabled,
        });
      } else {
        setForm({ key: "", label: "", amount: "", enabled: true });
      }
      setError("");
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const generateKey = (label) => {
    const base =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "") || "expense";
    if (!existingKeys.includes(base)) return base;
    let suffix = 2;
    while (existingKeys.includes(`${base}_${suffix}`)) suffix += 1;
    return `${base}_${suffix}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const label = form.label.trim();
    const amount = Math.round((parseFloat(form.amount) || 0) * 100) / 100;

    if (!label) {
      setError("Expense name is required.");
      return;
    }
    if (amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/expenses/${form.key}` : "/api/expenses";
      const method = isEdit ? "PUT" : "POST";
      const body = {
        key: isEdit ? form.key : generateKey(label),
        label,
        amount,
        enabled: form.enabled,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(
          data.error === "no_profile"
            ? "Business data not found on the server. Reload the page — if this persists, please complete setup again."
            : data.message || "Something went wrong."
        );
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="stock-modal-backdrop">
        <div className="expense-form-modal">
          <div className="expense-form-header">
            <div className="expense-form-header-left">
              <div className="expense-form-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isEdit ? (
                    <>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </>
                  ) : (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </>
                  )}
                </svg>
              </div>
              <div>
                <h2 className="expense-form-title">{isEdit ? "Edit Expense" : "Add Expense"}</h2>
                <p className="expense-form-subtitle">
                  {isEdit ? "Update the expense details below" : "Add a new recurring monthly expense"}
                </p>
              </div>
            </div>
            <button type="button" className="expense-sched-close" onClick={onClose}>×</button>
          </div>

          <form className="expense-form-body" onSubmit={handleSubmit}>
            {error && (
              <div className="expense-form-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="expense-form-fields">
              <div className="expense-form-field">
                <label className="expense-form-label">Expense Name</label>
                <input
                  type="text"
                  className="expense-form-input"
                  placeholder="e.g. Office Rent"
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  disabled={isEdit}
                />
                {isEdit && (
                  <span className="expense-form-hint">Name cannot be changed after creation</span>
                )}
              </div>

              <div className="expense-form-field">
                <label className="expense-form-label">Monthly Amount</label>
                <div className="expense-form-amount-wrap">
                  <span className="expense-form-currency">{currency}</span>
                  <input
                    type="number"
                    className="expense-form-input expense-form-input--amount"
                    placeholder="0.00"
                    min="0"
                    step="any"
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
                  />
                </div>
              </div>

              <div className="expense-form-field">
                <label className="expense-form-label">Status</label>
                <div className="expense-form-toggle-row">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={() => set("enabled", !form.enabled)}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <span className="expense-form-toggle-label">
                    {form.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="expense-form-actions">
              <button type="button" className="demo-back-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="register-btn" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Update Expense" : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ExpenseFormModal;
