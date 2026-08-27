import { productCategories } from "./constants";

const MAX_VALUE = 1_000_000_000_000;

function ProductsForm({ products, onChange, onAdd, onRemove }) {
  const set = (index, field, event) => {
    const val = event.target.value;
    if (["sellingPrice", "costPrice", "stockAvailable"].includes(field)) {
      const num = Number(val);
      if (val !== "" && (num < 0 || num > MAX_VALUE)) return;
    }
    onChange(index, field, val);
  };

  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill active">Step 2</span>
        <h2>Products</h2>
      </div>
      <div className="products-list">
        {products.map((product, index) => (
          <div
            className="product-card"
            key={`product-${index}`}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              background: "#fff",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
          >
            <div className="product-row">
              <label className="form-field small">
                <span>Product Name</span>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => set(index, "name", e)}
                />
              </label>
              <label className="form-field small">
                <span>Category</span>
                <select
                  value={product.category}
                  onChange={(e) => set(index, "category", e)}
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="product-row">
              <label className="form-field small">
                <span>Selling Price (per unit)</span>
                <input
                  type="number"
                  min="0"
                  max={MAX_VALUE}
                  value={product.sellingPrice}
                  onChange={(e) => set(index, "sellingPrice", e)}
                />
              </label>
              <label className="form-field small">
                <span>Cost Price (per unit)</span>
                <input
                  type="number"
                  min="0"
                  max={MAX_VALUE}
                  value={product.costPrice}
                  onChange={(e) => set(index, "costPrice", e)}
                />
              </label>
            </div>

            <div className="product-row">
              <label className="form-field small">
                <span>Available Stock</span>
                <input
                  type="number"
                  min="0"
                  max={MAX_VALUE}
                  value={product.stockAvailable}
                  onChange={(e) => set(index, "stockAvailable", e)}
                />
              </label>
            </div>

            <div className="product-actions">
              <button
                type="button"
                className="remove-product-btn"
                onClick={() => onRemove(index)}
                style={{
                  marginTop: 12,
                  padding: "8px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Remove product
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="add-product-btn"
        onClick={onAdd}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          border: "none",
          borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        + Add another product
      </button>
    </div>
  );
}

export default ProductsForm;