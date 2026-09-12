import { getProductColor } from "./constants";
import { formatStat } from "../../utils/formatNumber";

function YearlyView({ years, total, onOpenYear, colorMap }) {
  const maxYear = Math.max(1, ...years.map((y) => y.total));

  return (
    <div className="analytics-panel yearly-view">
      <section className="analytics-section">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--years" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18l6-8 4 4 8-10" />
              <path d="M17 4h4v4" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Yearly overview</h2>
            <p className="analytics-section-sub">
              Total: <strong>{formatStat(total)} units</strong> across {years.length} year{years.length === 1 ? "" : "s"} · tap a year for months
            </p>
          </span>
        </div>

        {years.length === 0 ? (
          <div className="analytics-empty">
            <span className="analytics-empty-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <p className="analytics-empty-title">No sales data yet</p>
            <p className="analytics-empty-sub">Record sales to see year-by-year performance here.</p>
          </div>
        ) : (
          <div className="years-grid">
            {years.map(({ year, total: yearTotal, data }, idx) => (
              <div
                key={year}
                className="year-card analytics-card-animated"
                style={{ animationDelay: `${Math.min(idx, 11) * 50}ms` }}
                role="button"
                tabIndex={0}
                onClick={() => onOpenYear(year)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpenYear(year);
                }}
                title={`Open ${year} monthly breakdown`}
              >
                <div className="year-card-header">
                  <span className="year-card-name">{year}</span>
                  <span className="year-card-total">{formatStat(yearTotal)} units</span>
                </div>
                <div className="year-card-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(6, (yearTotal / maxYear) * 100)}%` }} />
                </div>
                <div className="year-card-products">
                  {Object.entries(data)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([pName, qty], i) => (
                      <span
                        key={pName}
                        className="year-month-product"
                        style={{ "--product-color": colorMap[pName] || getProductColor(i) }}
                        title={`${pName}: ${qty} units`}
                      >
                        <span className="year-month-product-dot" aria-hidden="true" />
                        <span className="year-month-product-name">{pName}</span>
                        <span className="year-month-product-qty">{formatStat(qty)}</span>
                      </span>
                    ))}
                </div>
                <span className="year-card-cta" aria-hidden="true">View months →</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default YearlyView;
