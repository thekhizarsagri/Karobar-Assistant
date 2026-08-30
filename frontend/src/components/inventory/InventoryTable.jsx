import { SUPPLY_TARGET_DAYS } from "./inventoryConstants";

const STATUS_META = {
  out: { label: "Out of stock", className: "inv-status--out" },
  reorder: { label: "Reorder", className: "inv-status--reorder" },
  ok: { label: "In stock", className: "inv-status--ok" },
};

function fmt(value, fractionDigits = 0) {
  const num = Number(value || 0);
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

export default function InventoryTable({
  filtered,
  categories,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onRestock,
}) {
  return (
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
                      onClick={() => onRestock(item.name)}
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
  );
}
