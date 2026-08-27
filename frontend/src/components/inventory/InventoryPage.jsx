import { useEffect, useMemo, useState } from "react";
import StockModal from "../dashboard/StockModal";
import { DonutChart } from "../analytics/Charts";
import { getProductColor } from "../analytics/constants";
import { formatFull, formatCompact } from "../../utils/formatNumber";

const STATUS_META = {
  out: { label: "Out of stock", className: "inv-status--out" },
  reorder: { label: "Reorder", className: "inv-status--reorder" },
  ok: { label: "In stock", className: "inv-status--ok" },
};

const SOURCE_LABELS = {
  form: "Initial setup",
  oneTime: "Manual add",
  automatic: "Automatic",
};

const SUPPLY_TARGET_DAYS = 14;

function fmt(value, fractionDigits = 0) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, fractionDigits > 0 ? 1 : 0);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function supplyPct(item) {
  if (item.days_of_supply == null) return null;
  return Math.min(100, Math.max(0, (item.days_of_supply / SUPPLY_TARGET_DAYS) * 100));
}

function supplyClass(item) {
  const pct = supplyPct(item);
  if (pct == null) return "inv-bar--none";
  if (item.days_of_supply >= SUPPLY_TARGET_DAYS) return "inv-bar--good";
  if (item.days_of_supply >= SUPPLY_TARGET_DAYS / 2) return "inv-bar--medium";
  return "inv-bar--low";
}

function InventoryPage({ products, onSubmit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [initialProduct, setInitialProduct] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, products]);

  const summary = useMemo(() => data?.summary || {}, [data]);
  const items = useMemo(() => data?.items || [], [data]);
  const movements = useMemo(() => data?.movements || [], [data]);
  const categories = useMemo(() => data?.categories || [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter, categoryFilter]);

  const attentionItems = items.filter((item) => item.status !== "ok");

  const categoryChart = useMemo(
    () =>
      categories.map((cat, index) => ({
        label: cat.category,
        value: cat.retail_value,
        color: getProductColor(index),
      })),
    [categories]
  );

  const openAdd = (productName = "") => {
    setInitialProduct(productName);
    setModalOpen(true);
  };

  const handleSubmit = (payload) => {
    setModalOpen(false);
    onSubmit(payload);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="inventory-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Inventory</h1>
          <p className="analytics-subtitle">
            Detailed stock overview, valuation, and replenishment suggestions
          </p>
        </div>
        <button type="button" className="add-stock-btn" onClick={() => openAdd()}>
          <span className="add-stock-icon">+</span> Add stock
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="inv-stats">
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_units)}</span>
          <span className="inv-stat-label">Total units in stock</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_cost_value, 2)}</span>
          <span className="inv-stat-label">Stock value (cost)</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_retail_value, 2)}</span>
          <span className="inv-stat-label">Stock value (retail)</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value inv-stat-value--profit">
            {fmt(summary.potential_profit, 2)}
          </span>
          <span className="inv-stat-label">Potential profit</span>
        </div>
      </div>

      {/* Health strip */}
      <div className="inv-health-strip">
        <span className="inv-health-chip inv-health-chip--ok">
          {fmt(summary.healthy)} healthy
        </span>
        <span className="inv-health-chip inv-health-chip--reorder">
          {fmt(summary.needs_reorder)} need reorder
        </span>
        <span className="inv-health-chip inv-health-chip--out">
          {fmt(summary.out_of_stock)} out of stock
        </span>
      </div>

      {loading ? (
        <div className="inv-loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="automation-empty">
          <p>No products yet.</p>
          <p>Add products in the setup form to start tracking your inventory.</p>
        </div>
      ) : (
        <>
          {/* Needs attention */}
          {attentionItems.length > 0 && (
            <section className="inv-section">
              <h2 className="inv-section-title">Needs attention</h2>
              <div className="inv-attention-grid">
                {attentionItems.map((item) => {
                  const meta = STATUS_META[item.status] || STATUS_META.ok;
                  return (
                    <div key={item.name} className="inv-attention-card">
                      <div className="inv-attention-head">
                        <span className="inv-attention-name">{item.name}</span>
                        <span className={`inv-status ${meta.className}`}>{meta.label}</span>
                      </div>
                      <div className="inv-attention-row">
                        <span>In stock</span>
                        <strong>{fmt(item.stock)} units</strong>
                      </div>
                      {item.suggested_reorder > 0 && (
                        <div className="inv-attention-row">
                          <span>Suggested order</span>
                          <strong>{fmt(item.suggested_reorder)} units</strong>
                        </div>
                      )}
                      <button
                        type="button"
                        className="inv-restock-btn"
                        onClick={() => openAdd(item.name)}
                      >
                        + Restock {item.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Detailed table */}
          <section className="inv-section">
            <div className="inv-table-toolbar">
              <h2 className="inv-section-title">Stock overview</h2>
              <div className="inv-toolbar-controls">
                <input
                  type="search"
                  className="inv-search"
                  placeholder="Search products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="inv-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="ok">In stock</option>
                  <option value="reorder">Needs reorder</option>
                  <option value="out">Out of stock</option>
                </select>
                <select
                  className="inv-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>In stock</th>
                    <th>Days of supply</th>
                    <th>Stock value (cost)</th>
                    <th>Margin</th>
                    <th>Suggested reorder</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.ok;
                    const pct = supplyPct(item);
                    const barClass = supplyClass(item);
                    const rop = item.reorder_point || item.reorder_point_recommended;
                    return (
                      <tr key={item.name}>
                        <td>
                          <div className="inv-product-cell">
                            <span className="inv-product-name">{item.name}</span>
                            <span className="inv-product-category">{item.category}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`inv-status ${meta.className}`}>{meta.label}</span>
                        </td>
                        <td>
                          <span className="inv-stock-num">{fmt(item.stock)}</span>
                          {pct != null ? (
                            <div className="inv-bar-track">
                              <div
                                className={`inv-bar-fill ${barClass}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          ) : (
                            <div className="inv-bar-none">no sales data</div>
                          )}
                        </td>
                        <td>
                          {item.days_of_supply != null ? (
                            <span className="inv-supply">
                              {fmt(item.days_of_supply, 1)} days
                            </span>
                          ) : (
                            <span className="inv-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className="inv-value">{fmt(item.stock_value_cost, 2)}</span>
                          {rop > 0 && (
                            <div className="inv-sub">ROP {fmt(rop)}</div>
                          )}
                        </td>
                        <td>
                          <span className="inv-margin">
                            {fmt(item.unit_margin, 2)}
                          </span>
                          <div className="inv-sub">
                            {fmt(item.margin_pct, 1)}% margin
                          </div>
                        </td>
                        <td>
                          {item.suggested_reorder > 0 ? (
                            <span className="inv-reorder-qty">{fmt(item.suggested_reorder)}</span>
                          ) : (
                            <span className="inv-muted">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="inv-restock-btn inv-restock-btn--small"
                            onClick={() => openAdd(item.name)}
                          >
                            + Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="8" className="inv-empty-cell">
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Breakdown + movements */}
          <div className="inv-bottom-grid">
            <section className="inv-section">
              <h2 className="inv-section-title">Stock value by category</h2>
              {categoryChart.length > 0 ? (
                <DonutChart data={categoryChart} centerTextLabel="Retail value" />
              ) : (
                <p className="inv-muted">No category data yet.</p>
              )}
            </section>

            <section className="inv-section">
              <h2 className="inv-section-title">Valuation summary</h2>
              <div className="inv-valuation">
                <div className="inv-valuation-row">
                  <span>Cost value</span>
                  <strong>{fmt(summary.total_cost_value, 2)}</strong>
                </div>
                <div className="inv-valuation-row">
                  <span>Retail value</span>
                  <strong>{fmt(summary.total_retail_value, 2)}</strong>
                </div>
                <div className="inv-valuation-row inv-valuation-row--total">
                  <span>Potential profit</span>
                  <strong>{fmt(summary.potential_profit, 2)}</strong>
                </div>
              </div>
            </section>

            <section className="inv-section inv-movements">
              <h2 className="inv-section-title">Recent stock movements</h2>
              {movements.length === 0 ? (
                <p className="inv-muted">No stock movements yet.</p>
              ) : (
                <ul className="inv-movement-list">
                  {movements.map((move, index) => (
                    <li key={`${move.product}-${move.created_at}-${index}`} className="inv-movement-item">
                      <span className="inv-movement-qty">+{fmt(move.quantity)}</span>
                      <span className="inv-movement-detail">
                        <span className="inv-movement-product">{move.product}</span>
                        <span className="inv-movement-meta">
                          {SOURCE_LABELS[move.source] || move.source}
                          {move.created_at ? ` • ${formatDate(move.created_at)}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <StockModal
        products={products}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialProduct={initialProduct}
      />
    </div>
  );
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default InventoryPage;