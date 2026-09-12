import { useState } from "react";
import { getProductColor } from "../analytics/constants";
import { buildProductColorMap } from "../analytics/selectors";
import { formatStat } from "../../utils/formatNumber";

function initialsOf(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function HistoryTab({ salesSummary, products, onOpenProduct }) {
  const [query, setQuery] = useState("");
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const colorMap = buildProductColorMap(productOrder, products);

  const names = new Set(productOrder);
  (products || []).forEach((p) => {
    if (p.name) names.add(p.name);
  });
  Object.keys(productHistory).forEach((name) => names.add(name));
  Object.keys(stockHistory).forEach((name) => names.add(name));
  const productNames = Array.from(names);

  const totalUnits = salesSummary?.total_units ?? 0;

  const q = query.trim().toLowerCase();
  const visibleNames = q
    ? productNames.filter((n) => n.toLowerCase().includes(q))
    : productNames;

  return (
    <div className="history-page">
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--history" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Product History</h1>
            <p className="analytics-subtitle">Track every sale and stock addition for your products</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
            <span>
              <span className="analytics-summary-label">Tracked sales</span>
              <span className="analytics-summary-value">
                {formatStat(totalUnits)} units · {productNames.length} product{productNames.length === 1 ? "" : "s"}
              </span>
            </span>
          </span>
        </div>
      </div>

      {/* ── Products section ── */}
      <section className="analytics-section history-section">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--history" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Products</h2>
            <p className="analytics-section-sub">
              Tap a product to open its full sales and stock timeline
              {visibleNames.length !== productNames.length
                ? ` · ${visibleNames.length} of ${productNames.length} shown`
                : ` · ${productNames.length} items`}
            </p>
          </span>
          <label className="analytics-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              className="analytics-search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </label>
        </div>

        {productNames.length === 0 ? (
          <div className="analytics-empty">
            <span className="analytics-empty-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                <path d="M3 8l9 5 9-5M12 13v8" />
              </svg>
            </span>
            <p className="analytics-empty-title">No products yet</p>
            <p className="analytics-empty-sub">Add products in the setup form to start tracking history.</p>
          </div>
        ) : visibleNames.length === 0 ? (
          <p className="history-inline-empty">No products match “{query}”.</p>
        ) : (
          <div className="history-product-grid">
            {visibleNames.map((name, idx) => {
              const color = colorMap[name] || getProductColor(idx);
              const sold = productHistory[name]?.total_quantity ?? 0;
              const saleEntries = productHistory[name]?.entries?.length ?? 0;
              const stockEntries = (stockHistory[name] || []).length;
              return (
                <button
                  key={name}
                  type="button"
                  className="history-product-card analytics-card-animated"
                  style={{ animationDelay: `${Math.min(idx, 11) * 40}ms` }}
                  onClick={() => onOpenProduct(name)}
                  title={`Open history for ${name}`}
                >
                  <span className="history-product-avatar" style={{ "--product-color": color }} aria-hidden="true">
                    {initialsOf(name)}
                  </span>
                  <span className="history-product-info">
                    <span className="history-product-name" title={name}>{name}</span>
                    <span className="history-product-meta">
                      {formatStat(sold)} sold · {saleEntries + stockEntries} entries
                    </span>
                  </span>
                  <span className="history-product-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default HistoryTab;
