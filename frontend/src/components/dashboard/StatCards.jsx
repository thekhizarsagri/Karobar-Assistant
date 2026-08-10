function StatCards({ totalStock, grossProfit, totalExpenses, onStockClick, onAddStock }) {
  return (
    <div className="demo-summary-row">
      <div className="demo-stat demo-stat-clickable" onClick={onStockClick}>
        <span className="demo-stat-value">{totalStock}</span>
        <span className="demo-stat-label">Total Stock</span>
        <button type="button" className="add-stock-btn" onClick={(e) => { e.stopPropagation(); onAddStock(); }}>
          <span className="add-stock-icon">+</span> Add stock
        </button>
      </div>
      <div className="demo-stat">
        <span className="demo-stat-value">{grossProfit}</span>
        <span className="demo-stat-label">Gross Profit</span>
      </div>
      <div className="demo-stat">
        <span className="demo-stat-value">{totalExpenses}</span>
        <span className="demo-stat-label">Monthly Expenses</span>
      </div>
    </div>
  );
}

export default StatCards;