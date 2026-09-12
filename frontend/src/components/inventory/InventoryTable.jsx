import { useEffect, useRef, useState } from "react";
import { STATUS_META } from "./inventoryConstants";
import { formatNumber as fmt } from "../../utils/formatNumber";

function RowMenu({ name, onRestock }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <span className="inv-kebab-wrap" ref={ref}>
      <button
        type="button"
        className="inv-icon-btn inv-icon-btn--row"
        aria-label={`Actions for ${name}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <span className="inv-menu inv-menu--right" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRestock(name);
            }}
          >
            + Add stock
          </button>
          <button type="button" role="menuitem" onClick={copy}>
            Copy name
          </button>
        </span>
      )}
    </span>
  );
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
  sortDir,
  setSortDir,
  onRestock,
}) {
  const [compact, setCompact] = useState(false);

  return (
    <section className={`inv-section inv-stock-section ${compact ? "inv-stock-section--compact" : ""}`}>
      <div className="inv-section-head inv-stock-head">
        <span className="inv-section-icon inv-section-icon--stock" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
        </span>
        <span className="inv-section-titles">
          <h2 className="inv-section-title">Stock overview</h2>
          <p className="inv-section-sub">Browse and manage all products in your inventory.</p>
        </span>
        <div className="inv-toolbar-controls">
          <label className="inv-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              className="inv-search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="inv-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
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
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`inv-density-btn ${compact ? "active" : ""}`}
            onClick={() => setCompact((v) => !v)}
            title={compact ? "Comfortable view" : "Compact view"}
            aria-label="Toggle table density"
            aria-pressed={compact}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
              <circle cx="19" cy="16" r="2.2" />
              <path d="M20.5 14.5v3M19 16h3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className="inv-sort-btn"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  title="Sort by product name"
                >
                  Product
                  <span aria-hidden="true" className="inv-sort-arrow">
                    {sortDir === "asc" ? " ◆" : " ◇"}
                  </span>
                </button>
              </th>
              <th>Status</th>
              <th>In stock</th>
              <th>Days of supply</th>
              <th>Stock value (cost)</th>
              <th>Margin</th>
              <th>Suggested reorder</th>
              <th className="inv-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody key={`${query}-${statusFilter}-${categoryFilter}-${sortDir}`}>
            {filtered.map((item, index) => {
              const meta = STATUS_META[item.status] || STATUS_META.ok;
              const rop = item.reorder_point || item.reorder_point_recommended;
              const marginNeg = Number(item.unit_margin) < 0;
              return (
                <tr
                  key={item.name}
                  className="inv-row-animated"
                  style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
                >
                  <td>
                    <div className="inv-product-cell">
                      <span className="inv-product-text">
                        <span className="inv-product-name">{item.name}</span>
                        <span className="inv-product-category">{item.category}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`inv-pill ${meta.className}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2 1 21h22L12 2zm0 6 7 12H5l7-12zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
                      </svg>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <span className="inv-stock-num">{fmt(item.stock)}</span>
                    <span className="inv-sub inv-sub--block">no sales data</span>
                  </td>
                  <td>
                    <span className="inv-muted">—</span>
                  </td>
                  <td>
                    <span className="inv-value">{fmt(item.stock_value_cost, 2)}</span>
                    {rop > 0 && <span className="inv-sub inv-sub--block">ROP {fmt(rop)}</span>}
                  </td>
                  <td>
                    <span className={`inv-margin ${marginNeg ? "inv-margin--neg" : ""}`}>
                      {fmt(item.unit_margin, 2)}
                    </span>
                    <span className="inv-sub inv-sub--block">
                      {fmt(item.margin_pct, 1)}% margin
                    </span>
                  </td>
                  <td>
                    <span className="inv-muted">—</span>
                  </td>
                  <td>
                    <span className="inv-row-actions">
                      <button
                        type="button"
                        className="inv-stock-btn"
                        onClick={() => onRestock(item.name)}
                      >
                        + Stock
                      </button>
                      <RowMenu name={item.name} onRestock={onRestock} />
                    </span>
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
