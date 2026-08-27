import { getProductColor } from "./constants";
import { formatStat } from "../../utils/formatNumber";

function YearlyView({ years, total, onOpenYear, colorMap }) {
  return (
    <div className="analytics-panel yearly-view">
      <div className="view-header">
        <div className="view-summary">
          <span className="summary-total">Total: {formatStat(total)} units</span>
          <span className="summary-products">{years.length} years</span>
        </div>
      </div>

      {years.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No sales data yet</p>
        </div>
      ) : (
        <div className="years-grid">
          {years.map(({ year, total: yearTotal, data }) => (
            <div
              key={year}
              className="year-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenYear(year)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenYear(year);
              }}
            >
              <div className="year-card-header">
                <span className="year-card-name">{year}</span>
                <span className="year-card-total">{formatStat(yearTotal)} units</span>
              </div>
              <div className="year-card-products">
                {Object.entries(data)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pName, qty], i) => (
                    <span key={pName} className="year-month-product" style={{ background: colorMap[pName] || getProductColor(i) }}>
                      {pName}: {formatStat(qty)}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YearlyView;