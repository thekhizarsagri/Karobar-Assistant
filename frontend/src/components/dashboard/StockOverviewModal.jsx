import { formatStat } from "../../utils/formatNumber";
import ModalPortal from "./ModalPortal";

function StockOverviewModal({ products, isOpen, onClose }) {
  if (!isOpen) return null;

  const totalStock = (products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0);

  return (
    <ModalPortal>
      <div className="stock-modal-backdrop">
        <div className="stock-modal stock-overview-modal">
          <div className="stock-modal-header stock-modal-head">
            <span className="modal-head-icon modal-head-icon--blue" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
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
    </ModalPortal>
  );
}

export default StockOverviewModal;
