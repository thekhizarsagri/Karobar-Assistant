import { useEffect, useState } from "react";

const MAX_QUANTITY = 1_000_000_000_000;

function RecordSalesTab({ products, submitSale }) {
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [form, setForm] = useState({
    productName: products[0]?.name || "",
    quantity: 1,
    entryDate: new Date().toISOString().split("T")[0],
    entryMonth: new Date().toISOString().slice(0, 7),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (products.length) {
      setForm((prev) => ({ ...prev, productName: prev.productName || products[0].name }));
    }
  }, [products]);

  const entryValueForPeriod = () =>
    selectedPeriod === "month" ? form.entryMonth : form.entryDate;

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const quantity = Math.min(Number(form.quantity || 1), MAX_QUANTITY);
    if (!form.productName || quantity <= 0) return;
    setSaving(true);
    try {
      await submitSale(form.productName, quantity, selectedPeriod, entryValueForPeriod(), "manual");
    } finally {
      setSaving(false);
    }
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "" || (Number(val) >= 0 && Number(val) <= MAX_QUANTITY)) {
      setForm((prev) => ({ ...prev, quantity: val }));
    }
  };



  return (
    <div className="add-sales-card dash-card">
      <div className="dash-card-header">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="add-sales-plus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <div className="dash-card-title" style={{ fontSize: 13 }}>Add sales record</div>
            <div className="dash-card-subtitle">Quickly add a new sales entry</div>
          </div>
        </div>
      </div>
      <div className="add-sales-body">
        <div className="add-sales-tabs">
          <button type="button" className={`add-sales-tab ${selectedPeriod === "day" ? "active" : ""}`} onClick={() => setSelectedPeriod("day")}>Day</button>
          <button type="button" className={`add-sales-tab ${selectedPeriod === "month" ? "active" : ""}`} onClick={() => setSelectedPeriod("month")}>Month</button>
        </div>

        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div className="add-sales-field">
            <span className="add-sales-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>
              Product
            </span>
            <select className="add-sales-select" value={form.productName} onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}>
              {products.length === 0 && <option value="">No products</option>}
              {products.map((product) => (
                <option key={product.name} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="add-sales-field">
            <span className="add-sales-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Quantity
            </span>
            <input className="add-sales-input" type="number" min="1" max={MAX_QUANTITY} value={form.quantity} onChange={handleQuantityChange} placeholder="Enter quantity" />
          </div>

          <div className="add-sales-field">
            <span className="add-sales-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Date
            </span>
            <div className="add-sales-input-wrap">
              {selectedPeriod === "month" ? (
                <input className="add-sales-input" type="month" value={form.entryMonth} onChange={(e) => setForm((prev) => ({ ...prev, entryMonth: e.target.value }))} />
              ) : (
                <input className="add-sales-input" type="date" value={form.entryDate} onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))} />
              )}
              <span className="add-sales-input-icon" style={{ pointerEvents: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
            </div>
          </div>

          <button type="submit" className="add-sales-save" disabled={saving || products.length===0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {saving ? 'Saving...' : 'Save Sales'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RecordSalesTab;
