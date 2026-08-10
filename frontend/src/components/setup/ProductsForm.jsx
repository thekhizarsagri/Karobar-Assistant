import { productCategories } from "./constants";

function ProductsForm({ products, onChange, onAdd, onRemove }) {
  const set = (index, field, event) => onChange(index, field, event.target.value);

  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill">Step 2</span>
        <h2>Products</h2>
      </div>
      <div className="products-list">
        {products.map((product, index) => (
          <div className="product-card" key={`product-${index}`}>
            <div className="product-row">
              <label className="form-field small">
                <span>Product Name</span>
                <input type="text" value={product.name} onChange={(e) => set(index, "name", e)} />
              </label>
              <label className="form-field small">
                <span>Category</span>
                <select value={product.category} onChange={(e) => set(index, "category", e)}>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="product-row">
              <label className="form-field small">
                <span>Selling Price (per unit)</span>
                <input type="number" value={product.sellingPrice} onChange={(e) => set(index, "sellingPrice", e)} />
              </label>
              <label className="form-field small">
                <span>Cost Price (per unit)</span>
                <input type="number" value={product.costPrice} onChange={(e) => set(index, "costPrice", e)} />
              </label>
            </div>

            <div className="product-row">
              <label className="form-field small">
                <span>Available Stock</span>
                <input type="number" min="0" value={product.stockAvailable} onChange={(e) => set(index, "stockAvailable", e)} />
              </label>
            </div>

            <div className="product-actions">
              <button type="button" className="remove-product-btn" onClick={() => onRemove(index)}>Remove product</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="add-product-btn" onClick={onAdd}>+ Add another product</button>
    </div>
  );
}

export default ProductsForm;