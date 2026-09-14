import { useEffect, useState } from "react";
import ModalPortal from "./ModalPortal";

const MAX_QUANTITY = 1_000_000_000_000;

function makeFormState(products, initialProduct, initialMode) {
  return {
    productName: initialProduct || products[0]?.name || "",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
    dayOfMonth: 1,
    hour: "09",
    minute: "00",
    ampm: "AM",
  };
}

function StockModal({ products, isOpen, onClose, onSubmit, initialMode = "oneTime", initialProduct }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(() => makeFormState(products, initialProduct, initialMode));

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setForm(makeFormState(products, initialProduct, initialMode));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (field, value) => {
    if (field === "quantity") {
      const num = Number(value);
      if (value !== "" && (num < 0 || num > MAX_QUANTITY)) return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Math.min(Number(form.quantity || 1), MAX_QUANTITY);
    onSubmit({ ...form, quantity: qty, mode });
  };

  return (
    <ModalPortal>
      <div className="stock-modal-backdrop">
        <div className="stock-modal">
        <div className="stock-modal-header stock-modal-head">
          <span className="modal-head-icon modal-head-icon--blue" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <div>
            <h2>Add stock</h2>
            <p className="stock-modal-subtitle">Choose one-time or automatic stock addition.</p>
          </div>
          <button type="button" className="stock-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="stock-modal-tabs">
          <button type="button" className={`stock-modal-tab ${mode === "oneTime" ? "active" : ""}`} onClick={() => setMode("oneTime")}>One-time add</button>
          <button type="button" className={`stock-modal-tab ${mode === "automatic" ? "active" : ""}`} onClick={() => setMode("automatic")}>Automatic add</button>
        </div>

        <form className="stock-modal-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Product</span>
            <select value={form.productName} onChange={(e) => set("productName", e.target.value)}>
              {products.map((product) => (
                <option key={product.name} value={product.name}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Quantity</span>
            <input type="number" min="1" max={MAX_QUANTITY} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </label>

          {mode === "oneTime" ? (
            <label className="form-field">
              <span>Addition date</span>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </label>
          ) : (
            <>
              <div className="stock-modal-grid">
                <label className="form-field">
                  <span>Day of Month (1 to 28)</span>
                  <select value={form.dayOfMonth} onChange={(e) => set("dayOfMonth", Number(e.target.value))}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>{day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Time (AM/PM)</span>
                  <div className="time-select-grid">
                    <select value={form.hour} onChange={(e) => set("hour", e.target.value)}>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hh) => (
                        <option key={hh} value={hh}>{hh}</option>
                      ))}
                    </select>
                    <span className="time-colon">:</span>
                    <select value={form.minute} onChange={(e) => set("minute", e.target.value)}>
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((mm) => (
                        <option key={mm} value={mm}>{mm}</option>
                      ))}
                    </select>
                    <select value={form.ampm} onChange={(e) => set("ampm", e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
              </div>
              <p className="stock-modal-note">
                On day {form.dayOfMonth} at {form.hour}:{form.minute} {form.ampm} of every month, {form.quantity} units will be added automatically.
              </p>
            </>
          )}

          <div className="stock-modal-actions">
            <button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn modal-btn--blue">
              {mode === "oneTime" ? "Add stock" : "Confirm automatic add"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  );
}

export default StockModal;
