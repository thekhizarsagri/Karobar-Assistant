import { getProductColor, SHORT_MONTHS } from "./constants";

function MonthlyView({ analytics, selectedYear, availableYears, yearTotal, onYearChange }) {
  return (
    <div className="analytics-panel monthly-view">
      <div className="view-header">
        <div className="view-selector">
          <label>
            <span>Year</span>
            <select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))}>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="view-summary">
          <span className="summary-total">Total: {yearTotal} units</span>
          <span className="summary-products">per month</span>
        </div>
      </div>

      <div className="yearly-breakdown">
        {yearTotal === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p>No sales data for {selectedYear}</p>
          </div>
        ) : (
          Array.from({ length: 12 }, (_, m) => {
            const monthKey = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
            const monthData = analytics.monthly[monthKey] || {};
            const monthTotal = Object.values(monthData).reduce((a, b) => a + b, 0);
            const products = Object.entries(monthData).sort((a, b) => b[1] - a[1]);
            return (
              <div key={monthKey} className="year-month-card">
                <div className="year-month-header">
                  <span className="year-month-name">{SHORT_MONTHS[m]}</span>
                  <span className="year-month-total">{monthTotal} units</span>
                </div>
                <div className="year-month-products">
                  {products.slice(0, 3).map(([pName, qty], i) => (
                    <span key={pName} className="year-month-product" style={{ background: getProductColor(i) }}>
                      {pName}: {qty}
                    </span>
                  ))}
                  {products.length > 3 && (
                    <span className="year-month-more">+{products.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MonthlyView;