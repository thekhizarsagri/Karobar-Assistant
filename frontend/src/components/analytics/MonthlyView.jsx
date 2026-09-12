import { getProductColor, SHORT_MONTHS } from "./constants";
import { formatStat } from "../../utils/formatNumber";

function ProductChip({ name, qty, color }) {
  return (
    <span className="year-month-product" style={{ "--product-color": color }} title={`${name}: ${qty} units`}>
      <span className="year-month-product-dot" aria-hidden="true" />
      <span className="year-month-product-name">{name}</span>
      <span className="year-month-product-qty">{formatStat(qty)}</span>
    </span>
  );
}

function MonthlyView({ analytics, selectedYear, availableYears, yearTotal, onYearChange, colorMap }) {
  const months = Array.from({ length: 12 }, (_, m) => {
    const monthKey = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
    const monthData = (analytics.monthly || {})[monthKey] || {};
    const monthTotal = Object.values(monthData).reduce((a, b) => a + b, 0);
    const products = Object.entries(monthData).sort((a, b) => b[1] - a[1]);
    return { monthKey, monthTotal, products, label: SHORT_MONTHS[m] };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.monthTotal));

  return (
    <div className="analytics-panel monthly-view">
      <section className="analytics-section">
        <div className="analytics-section-head analytics-section-head--wrap">
          <span className="analytics-section-icon analytics-section-icon--calendar" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Monthly breakdown</h2>
            <p className="analytics-section-sub">
              Total: <strong>{formatStat(yearTotal)} units</strong> in {selectedYear}
            </p>
          </span>
          <label className="analytics-year-select">
            <span>Year</span>
            <select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} aria-label="Select year">
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>

        {yearTotal === 0 ? (
          <div className="analytics-empty">
            <span className="analytics-empty-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <p className="analytics-empty-title">No sales data for {selectedYear}</p>
            <p className="analytics-empty-sub">Record sales to see the monthly breakdown here.</p>
          </div>
        ) : (
          <div className="yearly-breakdown">
            {months.map(({ monthKey, monthTotal, products, label }, m) => (
              <div
                key={monthKey}
                className="year-month-card analytics-card-animated"
                style={{ animationDelay: `${Math.min(m, 11) * 40}ms` }}
              >
                <div className="year-month-header">
                  <span className="year-month-name">{label}</span>
                  <span className="year-month-total">{formatStat(monthTotal)}</span>
                </div>
                <div className="year-month-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(monthTotal > 0 ? 6 : 0, (monthTotal / maxMonth) * 100)}%` }} />
                </div>
                <div className="year-month-products">
                  {products.length === 0 ? (
                    <span className="year-month-none">No sales</span>
                  ) : (
                    products.map(([pName, qty], i) => (
                      <ProductChip key={pName} name={pName} qty={qty} color={colorMap[pName] || getProductColor(i)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MonthlyView;
