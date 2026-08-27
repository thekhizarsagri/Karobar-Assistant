import { useEffect, useState } from "react";

const SALES_PERIODS = ["day", "month"];
const MAX_QUANTITY = 1_000_000_000_000;

function RecordSalesTab({ products, submitSale }) {
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
    const quantity = Math.min(Number(form.quantity || 1), MAX_QUANTITY);
    submitSale(form.productName, quantity, selectedPeriod, entryValueForPeriod(), "manual");
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "" || (Number(val) >= 0 && Number(val) <= MAX_QUANTITY)) {
      setForm((prev) => ({ ...prev, quantity: val }));
    }
  };

  return (
    <div className="sales-panel">
      <div className="sales-card">
        <h3>Add sales record</h3>
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
            <input type="number" min="1" max={MAX_QUANTITY} value={form.quantity} onChange={handleQuantityChange} />
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