import { useState } from "react";
import { productCategories, productUnits } from "./constants";

const MAX_VALUE = 1_000_000_000_000;

function ProductsForm({
  products,
  onChange,
  onAdd,
  onRemove,
  currency = "₹",
}) {
  // New product draft state for clean entry
  const [draftProduct, setDraftProduct] = useState({
    name: "",
    category: productCategories[0],
    sku: "",
    sellingPrice: "",
    costPrice: "",
    stockAvailable: "",
    unit: "pcs",
    reorderPoint: "10",
  });

  const [filterQuery, setFilterQuery] = useState("");
  const [formError, setFormError] = useState("");

  const handleDraftChange = (field, value) => {
    if (["sellingPrice", "costPrice", "stockAvailable", "reorderPoint"].includes(field)) {
      const num = Number(value);
      if (value !== "" && (num < 0 || num > MAX_VALUE)) return;
    }
    setDraftProduct((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleAddDraftProduct = (e) => {
    e?.preventDefault();
    if (!draftProduct.name.trim()) {
      setFormError("Please enter a product name.");
      return;
    }
    if (!draftProduct.sellingPrice || Number(draftProduct.sellingPrice) <= 0) {
      setFormError("Please enter a valid selling price greater than 0.");
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

    // Reset draft
    setDraftProduct({
      name: "",
      category: productCategories[0],
      sku: "",
      sellingPrice: "",
      costPrice: "",
      stockAvailable: "",
      unit: "pcs",
      reorderPoint: "10",
    });
    setFormError("");
  };

  // Calculations for live metrics
  const totalStockUnits = products.reduce(
    (acc, p) => acc + (Number(p.stockAvailable) || 0),
    0
  );

  const totalCatalogValue = products.reduce(
    (acc, p) => acc + (Number(p.sellingPrice) || 0) * (Number(p.stockAvailable) || 0),
    0
  );

  const calculateMargin = (sell, cost) => {
    const s = Number(sell) || 0;
    const c = Number(cost) || 0;
    if (s <= 0) return { profit: 0, marginPercent: 0, status: "neutral" };
    const profit = s - c;
    const marginPercent = ((profit / s) * 100).toFixed(1);
    const status = profit > 0 ? (marginPercent >= 25 ? "good" : "fair") : "loss";
    return { profit, marginPercent, status };
  };

  const draftMargin = calculateMargin(draftProduct.sellingPrice, draftProduct.costPrice);

  const filteredProducts = products.filter((p) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="setup-right-column">
      {/* Column Header */}
      <div className="column-header">
        <h2 className="column-title">Product Catalog & Stock Management</h2>
        <p className="column-subtitle">
          Add items, configure unit pricing, track profit margins, and manage initial inventory.
        </p>
      </div>

      {/* Live Metrics Row */}
      <div className="metrics-strip">
        <div className="metric-chip">
          <div className="metric-chip-icon blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <span className="metric-chip-label">Catalog Items</span>
            <strong className="metric-chip-val">{products.length} Products</strong>
          </div>
        </div>

        <div className="metric-chip">
          <div className="metric-chip-icon emerald">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <span className="metric-chip-label">Total Stock Units</span>
            <strong className="metric-chip-val">{totalStockUnits.toLocaleString()} Units</strong>
          </div>
        </div>

        <div className="metric-chip">
          <div className="metric-chip-icon purple">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span className="metric-chip-label">Est. Inventory Value</span>
            <strong className="metric-chip-val">
              {currency}
              {totalCatalogValue.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Card 1: Add New Product Form */}
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
              onChange={(e) => handleDraftChange("name", e.target.value)}
              placeholder="e.g. Glass Bottle 500ml / Premium Cotton Shirt"
              required
            />
          </label>

          <label className="form-field">
            <span className="field-label">Product Category</span>
            <select
              value={draftProduct.category}
              onChange={(e) => handleDraftChange("category", e.target.value)}
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
              onChange={(e) => handleDraftChange("sku", e.target.value)}
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
                onChange={(e) => handleDraftChange("costPrice", e.target.value)}
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
                onChange={(e) => handleDraftChange("sellingPrice", e.target.value)}
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
              onChange={(e) => handleDraftChange("unit", e.target.value)}
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
              onChange={(e) => handleDraftChange("stockAvailable", e.target.value)}
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
              onChange={(e) => handleDraftChange("reorderPoint", e.target.value)}
              placeholder="e.g. 15"
            />
          </label>
        </div>

        <div className="card-actions-right">
          <button
            type="button"
            className="add-to-catalog-btn"
            onClick={handleAddDraftProduct}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product to Catalog
          </button>
        </div>
      </div>

      {/* Card 2: Current Configured Product Catalog */}
      <div className="setup-card">
        <div className="card-header catalog-list-header">
          <div className="card-icon-box teal-gradient">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title-row">
              <h3 className="card-title">Active Products List ({products.length})</h3>
              {products.length > 2 && (
                <div className="catalog-search-box">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search products..."
                    className="catalog-search-input"
                  />
                </div>
              )}
            </div>
            <p className="card-desc">Review and manage all products that will be loaded into your dashboard.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="empty-catalog-state">
            <div className="empty-icon">📦</div>
            <h4>No products added yet</h4>
            <p>Use the form above to add your first product.</p>
          </div>
        ) : (
          <div className="configured-products-list">
            {filteredProducts.map((product, index) => {
              const originalIndex = products.findIndex((p) => p === product);
              const margin = calculateMargin(product.sellingPrice, product.costPrice);

              return (
                <div key={`configured-prod-${index}`} className="configured-product-card">
                  <div className="product-card-top">
                    <div className="product-identity">
                      <div className="product-name-row">
                        <span className="product-index-badge">#{originalIndex + 1}</span>
                        <h4 className="product-name">{product.name || "Untitled Product"}</h4>
                      </div>
                      <div className="product-tags">
                        <span className="category-tag">{product.category}</span>
                        {product.sku && <span className="sku-tag">{product.sku}</span>}
                        {product.unit && <span className="unit-tag">{product.unit}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-card-btn"
                      onClick={() => onRemove(originalIndex)}
                      title="Remove product"
                      aria-label="Remove product"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div className="product-card-stats-grid">
                    <div className="product-stat-box">
                      <span className="stat-label">Selling Price</span>
                      <strong className="stat-value font-mono">
                        {currency}
                        {Number(product.sellingPrice || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div className="product-stat-box">
                      <span className="stat-label">Cost Price</span>
                      <strong className="stat-value font-mono">
                        {currency}
                        {Number(product.costPrice || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div className="product-stat-box">
                      <span className="stat-label">Profit Margin</span>
                      <strong className={`stat-value margin-pill ${margin.status}`}>
                        +{margin.marginPercent}%
                      </strong>
                    </div>

                    <div className="product-stat-box">
                      <span className="stat-label">Stock Available</span>
                      <strong className="stat-value font-bold">
                        {product.stockAvailable} {product.unit || "pcs"}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsForm;