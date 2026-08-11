function StatCards({ totalStock, grossProfit, netProfit, totalExpenses, onStockOverview, onAddStock, children }) {
  return (
    <div className="demo-summary-row">
      <div className="demo-stat">
        <span className="demo-stat-value">{totalStock}</span>
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
        <span className="demo-stat-value">{grossProfit}</span>
        <span className="demo-stat-label">Gross Profit</span>
      </div>
      {children}
      <div className="demo-stat">
        <span className="demo-stat-value">{totalExpenses}</span>
        <span className="demo-stat-label">Monthly Expenses</span>
      </div>
      <div className="demo-stat">
        <span className={`demo-stat-value ${netProfit >= 0 ? "demo-stat-value--positive" : "demo-stat-value--negative"}`}>
          {netProfit}
        </span>
        <span className="demo-stat-label">Net Profit</span>
      </div>
    </div>
  );
}

export default StatCards;