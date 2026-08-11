import { useState } from "react";

function StockModal({ products, isOpen, onClose, onSubmit, initialMode = "oneTime" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    productName: products[0]?.name || "",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
    dayOfMonth: 1,
    hour: "09",
    minute: "00",
    ampm: "AM",
  });

  if (!isOpen) return null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="stock-modal-backdrop">
      <div className="stock-modal">
        <div className="stock-modal-header">
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

        <form className="stock-modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, mode }); }}>
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
            <input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </label>

          {mode === "oneTime" ? (
            <label className="form-field">
              <span>Addition date</span>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </label>
          ) : (
            <>
              <label className="form-field">
                <span>Day of Month (1 to 28)</span>
                <select value={form.dayOfMonth} onChange={(e) => set("dayOfMonth", Number(e.target.value))}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Time (12-hour HH:MM AM/PM)</span>
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
              <p className="stock-modal-note">
                On day {form.dayOfMonth} at {form.hour}:{form.minute} {form.ampm} of every month, {form.quantity} units will be added automatically.
              </p>
            </>
          )}

          <div className="stock-modal-actions">
            <button type="button" className="demo-back-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="register-btn">
              {mode === "oneTime" ? "Add stock" : "Confirm automatic add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockModal;
