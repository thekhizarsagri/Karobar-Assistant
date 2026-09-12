import { useState } from "react";
import { formatNumber as fmt } from "../../utils/formatNumber";
import { useCountUp } from "./reportUtils";

function CoverageBar({ revenue, target }) {
  const rev = Number(revenue) || 0;
  const tgt = Number(target) || 0;
  const pct = tgt > 0 ? Math.min(100, (rev / tgt) * 100) : 0;
  const animated = useCountUp(pct);
  const covered = tgt > 0 && rev >= tgt;
  return (
    <div className="rep-coverage">
      <div className="rep-coverage-head">
        <span>Revenue vs break-even target</span>
        <strong className={covered ? "rep-metric--green" : "rep-metric--amber"}>
          {fmt(animated, 1)}% covered
        </strong>
      </div>
      <div className="rep-coverage-track">
        <div
          className={`rep-coverage-fill ${covered ? "rep-coverage-fill--done" : ""}`}
          style={{ width: `${animated}%` }}
        />
      </div>
      <div className="rep-coverage-foot">
        <span>{fmt(rev, 2)} earned</span>
        <span>{tgt > 0 ? fmt(tgt, 2) + " to break even" : "no fixed costs to cover"}</span>
      </div>
    </div>
  );
}

export default function BreakEvenSection({ breakEven, revenue }) {
  const [query, setQuery] = useState("");
  const be = breakEven || {};
  const products = be.products || [];
  const q = query.trim().toLowerCase();
  const visible = q ? products.filter((p) => String(p.product || "").toLowerCase().includes(q)) : products;

  return (
    <section className="analytics-section rep-section">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--breakeven" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <path d="M5 7l14 10" />
            <path d="M19 7L5 17" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Break-even analysis</h2>
          <p className="analytics-section-sub">The sales needed before profit begins</p>
        </span>
      </div>

      <div className="rep-metric-grid rep-metric-grid--4">
        <div className="rep-metric">
          <span className="rep-metric-text">
            <span className="rep-metric-value">{be.revenue != null ? fmt(be.revenue) : "—"}</span>
            <span className="rep-metric-label">Break-even revenue</span>
          </span>
        </div>
        <div className="rep-metric">
          <span className="rep-metric-text">
            <span className="rep-metric-value">{be.units != null ? fmt(be.units) : "—"}</span>
            <span className="rep-metric-label">Break-even units</span>
          </span>
        </div>
        <div className="rep-metric">
          <span className="rep-metric-text">
            <span className="rep-metric-value rep-metric--blue">{fmt(Number(be.cm_ratio ?? 0) * 100, 1)}%</span>
            <span className="rep-metric-label">Contribution margin ratio</span>
          </span>
        </div>
        <div className="rep-metric">
          <span className="rep-metric-text">
            <span className="rep-metric-value">{fmt(be.total_expenses, 2)}</span>
            <span className="rep-metric-label">Fixed expenses to cover</span>
          </span>
        </div>
      </div>

      <CoverageBar revenue={revenue} target={be.revenue} />

      <div className="rep-table-toolbar">
        <span className="rep-table-count">
          {visible.length === products.length
            ? `${products.length} products`
            : `${visible.length} of ${products.length} shown`}
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
            aria-label="Search break-even products"
          />
        </label>
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Contribution / unit</th>
              <th>Margin</th>
              <th>Units to break even</th>
              <th>Revenue at break-even</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, idx) => (
              <tr key={p.product ?? `be-${idx}`} className="inv-row-animated" style={{ animationDelay: `${Math.min(idx, 11) * 30}ms` }}>
                <td><span className="inv-product-name">{p.product || "Unnamed product"}</span></td>
                <td>{fmt(p.contribution, 2)}</td>
                <td>{fmt(p.margin_pct, 1)}%</td>
                <td>{p.units != null ? fmt(p.units) : <span className="inv-muted">—</span>}</td>
                <td>{p.revenue != null ? fmt(p.revenue) : <span className="inv-muted">—</span>}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan="5" className="inv-empty-cell">
                  {products.length === 0 ? "No break-even data yet." : "No products match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
