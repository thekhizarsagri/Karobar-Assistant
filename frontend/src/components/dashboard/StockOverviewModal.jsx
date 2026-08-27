import { formatStat } from "../../utils/formatNumber";

function StockOverviewModal({ products, isOpen, onClose }) {
  if (!isOpen) return null;

  const totalStock = (products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0);

  return (
    <div className="stock-modal-backdrop">
      <div className="stock-modal stock-overview-modal">
        <div className="stock-modal-header">
          <div>
            <h2>Stock Overview</h2>
            <p className="stock-modal-subtitle">Current stock levels across all products.</p>
          </div>
          <button type="button" className="stock-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="stock-overview-summary">
          <span className="stock-overview-summary-label">Total available stock</span>
          <span className="stock-overview-summary-value">{formatStat(totalStock)}</span>
        </div>

        <div className="stock-overview-list">
          {(products || []).map((product) => (
            <div key={product.name} className="stock-overview-row">
              <span className="stock-overview-product">{product.name}</span>
              <span className="stock-overview-units">{formatStat(Number(product.stockAvailable || 0))} units</span>
            </div>
          ))}
          {(products || []).length === 0 && (
            <p className="stock-overview-empty">No products with stock yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockOverviewModal;
