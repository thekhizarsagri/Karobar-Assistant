import { productCategories, productUnits } from "./constants";

const MAX_VALUE = 1_000_000_000_000;

function calculateMargin(sell, cost) {
  const s = Number(sell) || 0;
  const c = Number(cost) || 0;
  if (s <= 0) return { profit: 0, marginPercent: 0, status: "neutral" };
  const profit = s - c;
  const marginPercent = ((profit / s) * 100).toFixed(1);
  const status = profit > 0 ? (marginPercent >= 25 ? "good" : "fair") : "loss";
  return { profit, marginPercent, status };
}

function ProductDraftForm({ draftProduct, onDraftChange, onAdd, currency, formError }) {
  const draftMargin = calculateMargin(draftProduct.sellingPrice, draftProduct.costPrice);

  const handleChange = (field, value) => {
    if (["sellingPrice", "costPrice", "stockAvailable", "reorderPoint"].includes(field)) {
      const num = Number(value);
      if (value !== "" && (num < 0 || num > MAX_VALUE)) return;
    }
    onDraftChange(field, value);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!draftProduct.name.trim()) {
      onDraftChange("_error", "Please enter a product name.");
      return;
    }
    if (!draftProduct.sellingPrice || Number(draftProduct.sellingPrice) <= 0) {
      onDraftChange("_error", "Please enter a valid selling price greater than 0.");
      return;
    }

    const newProd = {
      ...draftProduct,
      sku: draftProduct.sku || `KB-${Math.floor(1000 + Math.random() * 9000)}`,
      sellingPrice: draftProduct.sellingPrice || "0",
      costPrice: draftProduct.costPrice || "0",
      stockAvailable: draftProduct.stockAvailable || "0",
      reorderPoint: draftProduct.reorderPoint || "10",
      unit: draftProduct.unit || "pcs",
    };

    onAdd(newProd);
  };

  return (
    <div className="setup-card product-builder-card">
      <div className="card-header">
        <div className="card-icon-box amber-gradient">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <h3 className="card-title">Add New Product to Catalog</h3>
          <p className="card-desc">Enter your product details, pricing, and initial stock quantities below.</p>
        </div>
      </div>

      {formError && (
        <div className="form-error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <div className="card-form-grid">
        <label className="form-field full-width">
          <span className="field-label">
            Product Name <span className="req-star">*</span>
          </span>
          <input
            type="text"
            value={draftProduct.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Glass Bottle 500ml / Premium Cotton Shirt"
            required
          />
        </label>

        <label className="form-field">
          <span className="field-label">Product Category</span>
          <select
            value={draftProduct.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="field-label">Item Code</span>
          <input
            type="text"
            value={draftProduct.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            placeholder="e.g. ITM-001"
          />
        </label>

        <label className="form-field">
          <span className="field-label">
            Cost Price (Buying / Unit) <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon font-mono">{currency}</span>
            <input
              type="number"
              min="0"
              value={draftProduct.costPrice}
              onChange={(e) => handleChange("costPrice", e.target.value)}
              placeholder="e.g. 70"
            />
          </div>
        </label>

        <label className="form-field">
          <span className="field-label">
            Selling Price (Retail / Unit) <span className="req-star">*</span>
          </span>
          <div className="input-with-icon">
            <span className="input-icon font-mono">{currency}</span>
            <input
              type="number"
              min="0"
              value={draftProduct.sellingPrice}
              onChange={(e) => handleChange("sellingPrice", e.target.value)}
              placeholder="e.g. 120"
            />
          </div>
        </label>

        {/* Dynamic Profit Margin Box (Left) */}
        <div className="margin-indicator-box">
          <div className="margin-header">
            <span className="margin-title">Calculated Unit Margin:</span>
            <span className={`margin-badge ${draftMargin.status}`}>
              {draftMargin.profit >= 0 ? `+${draftMargin.marginPercent}% Margin` : `${draftMargin.marginPercent}% Loss`}
            </span>
          </div>
          <div className="margin-details">
            <span>
              Profit per unit:{" "}
              <strong className={draftMargin.profit >= 0 ? "text-emerald" : "text-rose"}>
                {currency}
                {draftMargin.profit.toFixed(2)}
              </strong>
            </span>
            <span className="margin-sub">
              ({currency}{draftProduct.sellingPrice || 0} vs {currency}{draftProduct.costPrice || 0})
            </span>
          </div>
        </div>

        {/* Unit of Measure (Right of Margin Box) */}
        <label className="form-field">
          <span className="field-label">Unit of Measure</span>
          <select
            value={draftProduct.unit}
            onChange={(e) => handleChange("unit", e.target.value)}
          >
            {productUnits.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        {/* Initial Stock Quantity (Below Margin Box) */}
        <label className="form-field">
          <span className="field-label">Initial Stock Quantity</span>
          <input
            type="number"
            min="0"
            value={draftProduct.stockAvailable}
            onChange={(e) => handleChange("stockAvailable", e.target.value)}
            placeholder="e.g. 150"
          />
        </label>

        {/* Low Stock Threshold (Right of Initial Stock) */}
        <label className="form-field">
          <span className="field-label">Low Stock Threshold</span>
          <input
            type="number"
            min="0"
            value={draftProduct.reorderPoint}
            onChange={(e) => handleChange("reorderPoint", e.target.value)}
            placeholder="e.g. 15"
          />
        </label>
      </div>

      <div className="card-actions-right">
        <button
          type="button"
          className="add-to-catalog-btn"
          onClick={handleSubmit}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product to Catalog
        </button>
      </div>
    </div>
  );
}

export default ProductDraftForm;
