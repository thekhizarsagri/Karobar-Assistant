import { formatStat } from "../../utils/formatNumber";

function StatCards({ totalStock, grossProfit, netProfit, totalExpenses, onStockOverview, onAddStock, children }) {
  return (
    <div className="demo-summary-row">
      <div className="demo-stat">
        <span className="demo-stat-value">{formatStat(totalStock)}</span>
        <span className="demo-stat-label">Total Stock</span>
        <div className="demo-stat-actions">
          <button type="button" className="add-stock-btn" onClick={onAddStock}>
            <span className="add-stock-icon">+</span> Add stock
          </button>
          <button type="button" className="stock-overview-btn" onClick={onStockOverview}>
            Stock Overview
          </button>
        </div>
      </div>
      <div className="demo-stat">
        <span className="demo-stat-value">{formatStat(grossProfit, 2)}</span>
        <span className="demo-stat-label">Gross Profit</span>
      </div>
      {children}
      <div className="demo-stat">
        <span className="demo-stat-value">{formatStat(totalExpenses, 2)}</span>
        <span className="demo-stat-label">Monthly Expenses</span>
      </div>
      <div className="demo-stat">
        <span className={`demo-stat-value ${netProfit >= 0 ? "demo-stat-value--positive" : "demo-stat-value--negative"}`}>
          {formatStat(netProfit, 2)}
        </span>
        <span className="demo-stat-label">Net Profit</span>
      </div>
    </div>
  );
}

export default StatCards;