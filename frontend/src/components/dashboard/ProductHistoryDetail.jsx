import React from "react";
import { getProductColor } from "../analytics/constants";
import { buildProductColorMap } from "../analytics/selectors";
import { clearProductHistory } from "./api";
import { formatStat } from "../../utils/formatNumber";

const EXPORT_DATASETS = [
  ["sales", "Sales history"],
  ["stock", "Stock history"],
];

function ProductHistoryDetail({ productName, salesSummary, products, onBack, onClearHistory }) {
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const colorMap = buildProductColorMap(productOrder, products);

  const color = colorMap[productName] || getProductColor(0);
  const sales = productHistory[productName]?.entries || [];
  const stockEntries = stockHistory[productName] || [];

  const [clearing, setClearing] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearProductHistory(productName);
      setShowConfirmModal(false);
      if (onClearHistory) onClearHistory();
    } catch (err) {
      console.error("Failed to clear history:", err);
    } finally {
      setClearing(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stockLabel = (entry) =>
    entry.source === "form"
      ? `${entry.quantity} stock added in form`
      : `${entry.quantity} stock added on ${formatDate(entry.created_at)}`;

  return (
    <div className="history-detail-page">
      <div className="history-detail-header">
        <div className="history-detail-title-block">
          <h1 style={{ color }}>{productName}</h1>
          <p className="history-detail-subtitle">
            Total sold: {formatStat(productHistory[productName]?.total_quantity ?? 0)} units
          </p>
        </div>
        <div className="history-detail-actions">
          <div className="export-menu">
            <span className="export-label">Export CSV</span>
            {EXPORT_DATASETS.map(([ds, label]) => (
              <a
                key={ds}
                className="export-link"
                href={`/api/history/export?dataset=${ds}&product=${encodeURIComponent(productName)}`}
                download={`karobar-history-${ds}.csv`}
              >
                {label}
              </a>
            ))}
          </div>
          <button
            type="button"
            className="history-detail-clear-btn"
            onClick={() => setShowConfirmModal(true)}
          >
            Clear History
          </button>
          <button type="button" className="history-detail-back-btn" onClick={onBack}>Back to history</button>
        </div>
      </div>

      <div className="history-detail-section">
        <h4>Sales</h4>
        {sales.length === 0 ? (
          <p className="history-empty">No sales recorded yet.</p>
        ) : (
          <ul className="history-entry-list">
            {sales.map((entry, index) => (
              <li key={`${productName}-sale-${index}`}>
                <strong>{entry.quantity}</strong> units • {entry.period} •{" "}
                {entry.entry_date || "No date"}
                {entry.created_at ? (
                  <span className="history-entry-meta">
                    {" "}recorded on {formatDateTime(entry.created_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="history-detail-section">
        <h4>Stock added</h4>
        {stockEntries.length === 0 ? (
          <p className="history-empty">No stock entries recorded yet.</p>
        ) : (
          <ul className="history-entry-list">
            {stockEntries.map((entry, index) => (
              <li key={`${productName}-stock-${index}`}>
                <strong>{stockLabel(entry)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showConfirmModal && (
        <div className="stock-modal-backdrop">
          <div className="stock-modal confirm-modal">
            <div className="stock-modal-header">
              <div>
                <h2>Clear History</h2>
                <p className="stock-modal-subtitle">This action cannot be undone.</p>
              </div>
              <button type="button" className="stock-modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="confirm-modal-body">
              <p>Are you sure you want to clear all sales and stock history for <strong>"{productName}"</strong>?</p>
            </div>
            <div className="stock-modal-actions">
              <button type="button" className="confirm-cancel-btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button type="button" className="confirm-delete-btn" onClick={handleClearHistory} disabled={clearing}>
                {clearing ? "Clearing..." : "Yes, Clear History"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductHistoryDetail;