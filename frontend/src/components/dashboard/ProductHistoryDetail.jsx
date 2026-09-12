import { useState } from "react";
import { getProductColor } from "../analytics/constants";
import { buildProductColorMap } from "../analytics/selectors";
import ModalPortal from "./ModalPortal";
import { clearProductHistory } from "./api";
import { formatStat } from "../../utils/formatNumber";

const EXPORT_DATASETS = [
  ["sales", "Sales history"],
  ["stock", "Stock history"],
];

function initialsOf(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProductHistoryDetail({ productName, salesSummary, products, onBack, onClearHistory }) {
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const colorMap = buildProductColorMap(productOrder, products);

  const color = colorMap[productName] || getProductColor(0);
  const sales = productHistory[productName]?.entries || [];
  const stockEntries = stockHistory[productName] || [];
  const totalSold = productHistory[productName]?.total_quantity ?? 0;

  const [clearing, setClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      {/* ── Header ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <button type="button" className="history-back-btn" onClick={onBack} aria-label="Back to history">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="history-detail-avatar" style={{ "--product-color": color }} aria-hidden="true">
            {initialsOf(productName)}
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title history-detail-title" title={productName}>{productName}</h1>
            <p className="analytics-subtitle">
              Total sold: <strong>{formatStat(totalSold)} units</strong> · {sales.length} sale{sales.length === 1 ? "" : "s"} · {stockEntries.length} stock {stockEntries.length === 1 ? "entry" : "entries"}
            </p>
          </span>
        </div>
        <div className="analytics-head-right">
          <div className="export-menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
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
        </div>
      </div>

      {/* ── Sales timeline ── */}
      <section className="analytics-section history-timeline-section">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--sales" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l1.7-5h14.6L21 9" />
              <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
              <path d="M3 9h18" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Sales</h2>
            <p className="analytics-section-sub">{sales.length === 0 ? "No sales recorded yet." : `${sales.length} sale${sales.length === 1 ? "" : "s"} recorded`}</p>
          </span>
        </div>
        {sales.length === 0 ? (
          <p className="history-inline-empty">No sales recorded yet.</p>
        ) : (
          <ul className="history-timeline">
            {sales.map((entry, index) => (
              <li key={`${productName}-sale-${index}`} className="history-timeline-item analytics-card-animated" style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}>
                <span className="history-timeline-dot history-timeline-dot--sale" aria-hidden="true" />
                <span className="history-timeline-body">
                  <span className="history-timeline-main">
                    <strong>{formatStat(entry.quantity)}</strong> units · {entry.period || "day"} · {entry.entry_date || "No date"}
                  </span>
                  {entry.created_at ? (
                    <span className="history-entry-meta">recorded on {formatDateTime(entry.created_at)}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Stock timeline ── */}
      <section className="analytics-section history-timeline-section">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--stock" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Stock added</h2>
            <p className="analytics-section-sub">{stockEntries.length === 0 ? "No stock entries recorded yet." : `${stockEntries.length} stock ${stockEntries.length === 1 ? "entry" : "entries"}`}</p>
          </span>
        </div>
        {stockEntries.length === 0 ? (
          <p className="history-inline-empty">No stock entries recorded yet.</p>
        ) : (
          <ul className="history-timeline">
            {stockEntries.map((entry, index) => (
              <li key={`${productName}-stock-${index}`} className="history-timeline-item analytics-card-animated" style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}>
                <span className="history-timeline-dot history-timeline-dot--stock" aria-hidden="true" />
                <span className="history-timeline-body">
                  <span className="history-timeline-main"><strong>{stockLabel(entry)}</strong></span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showConfirmModal && (
        <ModalPortal>
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
        </ModalPortal>
      )}
    </div>
  );
}

export default ProductHistoryDetail;
