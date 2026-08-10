import { useEffect, useState } from "react";

const SALES_PERIODS = ["day", "month"];

function RecordSalesTab({ products, notify, submitSale }) {
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [form, setForm] = useState({
    productName: products[0]?.name || "",
    quantity: 1,
    entryDate: new Date().toISOString().split("T")[0],
    entryMonth: new Date().toISOString().slice(0, 7),
  });

  useEffect(() => {
    if (products.length) {
      setForm((prev) => ({ ...prev, productName: prev.productName || products[0].name }));
    }
  }, [products]);

  const entryValueForPeriod = () =>
    selectedPeriod === "month" ? form.entryMonth : form.entryDate;

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const available = Number((products.find((p) => p.name === form.productName) || {}).stockAvailable || 0);
    const quantity = Number(form.quantity || 1);

    if (available <= 0) {
      notify(`⚠️ Cannot sell ${form.productName} — no stock available. Please add stock first.`);
      return;
    }
    if (quantity > available) {
      notify(`⚠️ Not enough stock for ${form.productName}. You tried to sell ${quantity} but only ${available} unit${available !== 1 ? "s are" : " is"} available.`);
      return;
    }
    submitSale(form.productName, quantity, selectedPeriod, entryValueForPeriod(), "manual");
  };

  return (
    <div className="sales-panel">
      <div className="sales-card">
        <h3>Manual entry</h3>
        <div className="sales-periods">
          {SALES_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={`frequency-pill ${selectedPeriod === period ? "active" : ""}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>

        <form className="sales-form" onSubmit={handleManualSubmit}>
          <label className="form-field">
            <span>Product</span>
            <select value={form.productName} onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}>
              {products.map((product) => (
                <option key={product.name} value={product.name}>{product.name}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Quantity</span>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} />
          </label>

          <label className="form-field">
            <span>{selectedPeriod === "month" ? "Month & Year" : "Date"}</span>
            {selectedPeriod === "month" ? (
              <input type="month" value={form.entryMonth} onChange={(e) => setForm((prev) => ({ ...prev, entryMonth: e.target.value }))} />
            ) : (
              <input type="date" value={form.entryDate} onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))} />
            )}
          </label>

          <button type="submit" className="register-btn">Save sales</button>
        </form>
      </div>
    </div>
  );
}

export default RecordSalesTab;