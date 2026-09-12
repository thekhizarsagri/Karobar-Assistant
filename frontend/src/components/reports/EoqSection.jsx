import { useState } from "react";
import { formatNumber as fmt } from "../../utils/formatNumber";

export default function EoqSection({ eoq }) {
  const [query, setQuery] = useState("");
  const rows = eoq || [];
  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((e) => String(e.product || "").toLowerCase().includes(q)) : rows;
  const best = visible.reduce((acc, e) => (Number(e.order_qty || 0) > Number(acc?.order_qty || 0) ? e : acc), null);

  return (
    <section className="analytics-section rep-section">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--eoq" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
            <path d="M7.5 10.5l2 2 3.5-3.5" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Economic order quantity (EOQ)</h2>
          <p className="analytics-section-sub">Optimal order sizes that minimize holding + ordering cost</p>
        </span>
      </div>
      <p className="rep-note">
        Estimated optimal order size: <strong>√(2 × annual demand × order cost ÷ holding cost)</strong>.
        Order cost {fmt(50, 0)} and a {Math.round(20)}% annual holding rate are assumed.
      </p>
      {rows.length === 0 ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <p className="analytics-empty-title">No EOQ data yet</p>
          <p className="analytics-empty-sub">Add sales history to compute optimal order quantities.</p>
        </div>
      ) : (
        <>
          <div className="rep-table-toolbar">
            <span className="rep-table-count">
              {visible.length === rows.length
                ? `${rows.length} products`
                : `${visible.length} of ${rows.length} shown`}
            </span>
            <label className="analytics-search-wrap rep-table-search">
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
                aria-label="Search EOQ products"
              />
            </label>
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Annual demand</th>
                  <th>Unit cost</th>
                  <th>Holding cost / unit</th>
                  <th>EOQ (per order)</th>
                  <th>Orders / year</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e, idx) => (
                  <tr key={e.product ?? `eoq-${idx}`} className="inv-row-animated" style={{ animationDelay: `${Math.min(idx, 11) * 30}ms` }}>
                    <td>
                      <span className="inv-product-name">{e.product || "Unnamed product"}</span>
                      {best && e.product === best.product && (
                        <span className="rep-best-pill">largest order</span>
                      )}
                    </td>
                    <td>{fmt(e.annual_demand)}</td>
                    <td>{fmt(e.cost_price, 2)}</td>
                    <td>{fmt(e.holding_cost, 2)}</td>
                    <td>{Number(e.order_qty) > 0 ? <strong>{fmt(e.order_qty)}</strong> : <span className="inv-muted">—</span>}</td>
                    <td>{Number(e.orders_per_year) > 0 ? fmt(e.orders_per_year, 1) : <span className="inv-muted">—</span>}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan="6" className="inv-empty-cell">No products match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
