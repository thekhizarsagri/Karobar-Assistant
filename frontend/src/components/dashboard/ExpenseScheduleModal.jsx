import { useState } from "react";
import ModalPortal from "./ModalPortal";

function ExpenseScheduleModal({ expenses, isOpen, onClose, onSuccess }) {
  const [schedules, setSchedules] = useState(() => {
    const init = {};
    expenses.forEach((e) => {
      init[e.key] = {
        enabled: e.enabled && e.deduction_day > 0,
        day: e.deduction_day || 1,
        hour: "09",
        minute: "00",
        ampm: "AM",
      };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const enabledExpenses = expenses.filter((e) => e.enabled);

  if (!isOpen) return null;

  const toggle = (key) => {
    setSchedules((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updateField = (key, field, value) => {
    setSchedules((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const to24Hour = (hour, ampm) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return String(h).padStart(2, "0");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        schedules: Object.entries(schedules)
          .filter(([, s]) => s.enabled)
          .map(([key, s]) => ({
            key,
            deduction_day: Number(s.day),
            deduction_time: `${to24Hour(s.hour, s.ampm)}:${s.minute}`,
          })),
      };
      const res = await fetch("/api/expenses/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setError(
          data.error === "no_profile"
            ? "Business data not found on the server. Reload the page — if this persists, please complete setup again."
            : data.message || "Could not save schedule."
        );
        return;
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Could not save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = Object.values(schedules).filter((s) => s.enabled).length;

  return (
    <ModalPortal>
      <div className="stock-modal-backdrop">
        <div className="expense-sched-modal">
          <div className="expense-sched-header">
            <div className="expense-sched-header-left">
              <div className="expense-sched-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 className="expense-sched-title">Auto-Deduction Schedule</h2>
                <p className="expense-sched-subtitle">
                  Toggle expenses and set when they should be deducted each month
                </p>
              </div>
            </div>
            <button type="button" className="expense-sched-close" onClick={onClose}>×</button>
          </div>

          <div className="expense-sched-summary">
            <span className="expense-sched-summary-text">
              {activeCount} of {enabledExpenses.length} expenses scheduled
            </span>
          </div>

          <form className="expense-sched-form" onSubmit={handleSubmit}>
            <div className="expense-sched-list">
              {enabledExpenses.length === 0 && (
                <div className="expenses-empty" style={{ padding: "24px", margin: 0 }}>
                  <p>No active expenses to schedule.</p>
                </div>
              )}
              {enabledExpenses.map((expense) => {
                const sched = schedules[expense.key] || { enabled: false, day: 1, hour: "09", minute: "00", ampm: "AM" };
                return (
                  <div key={expense.key} className={`expense-sched-row ${sched.enabled ? "active" : ""}`}>
                    <div className="expense-sched-row-top">
                      <div className="expense-sched-row-info">
                        <span className="expense-sched-row-name">{expense.label}</span>
                        <span className="expense-sched-row-amount">
                          {expense.amount.toLocaleString()}/mo
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={sched.enabled}
                          onChange={() => toggle(expense.key)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {sched.enabled && (
                      <div className="expense-sched-row-controls">
                        <div className="expense-sched-field">
                          <label className="expense-sched-field-label">Day of Month</label>
                          <select
                            className="expense-sched-select"
                            value={sched.day}
                            onChange={(e) => updateField(expense.key, "day", e.target.value)}
                          >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                              <option key={day} value={day}>
                                {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="expense-sched-field">
                          <label className="expense-sched-field-label">Time</label>
                          <div className="expense-sched-time">
                            <select
                              className="expense-sched-select expense-sched-select--sm"
                              value={sched.hour}
                              onChange={(e) => updateField(expense.key, "hour", e.target.value)}
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hh) => (
                                <option key={hh} value={hh}>{hh}</option>
                              ))}
                            </select>
                            <span className="expense-sched-colon">:</span>
                            <select
                              className="expense-sched-select expense-sched-select--sm"
                              value={sched.minute}
                              onChange={(e) => updateField(expense.key, "minute", e.target.value)}
                            >
                              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((mm) => (
                                <option key={mm} value={mm}>{mm}</option>
                              ))}
                            </select>
                            <select
                              className="expense-sched-select expense-sched-select--sm"
                              value={sched.ampm}
                              onChange={(e) => updateField(expense.key, "ampm", e.target.value)}
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="expense-sched-preview">
                          Deducts on day <strong>{sched.day}</strong> at{' '}
                          <strong>{sched.hour}:{sched.minute} {sched.ampm}</strong> every month
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="expense-sched-actions">
              <button type="button" className="demo-back-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="register-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
            {error && (
              <div className="expense-form-error" style={{ margin: "0 0 4px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ExpenseScheduleModal;
