function ProductCatalogList({ products, filteredProducts, filterQuery, onFilterChange, onRemove, currency, calculateMargin }) {
  return (
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
                  onChange={(e) => onFilterChange(e.target.value)}
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
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
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
  );
}

export default ProductCatalogList;
