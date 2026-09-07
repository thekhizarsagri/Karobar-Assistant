import { formatStat } from "../../utils/formatNumber";

function StatCards({ totalStock, grossProfit, netProfit, availableBalance, onStockOverview, onAddStock, children }) {
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
        <span className={`demo-stat-value ${grossProfit >= 0 ? "demo-stat-value--positive" : "demo-stat-value--negative"}`}>
          {formatStat(grossProfit, 2)}
        </span>
        <span className="demo-stat-label">Gross Profit</span>
        <div className={`stat-trend ${grossProfit >= 0 ? "stat-trend--up" : "stat-trend--down"}`}>
          <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {grossProfit >= 0 ? (
              <>
                <path d="M2 28 C12 28, 18 10, 28 16 C38 22, 44 6, 54 10 C64 14, 70 2, 78 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <polyline points="73 1, 78 4, 75 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            ) : (
              <>
                <path d="M2 4 C12 4, 18 22, 28 16 C38 10, 44 26, 54 22 C64 18, 70 30, 78 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <polyline points="73 31, 78 28, 75 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            )}
          </svg>
        </div>
      </div>
      {children}
      <div className="demo-stat">
        <span className={`demo-stat-value ${availableBalance >= 0 ? "demo-stat-value--positive" : "demo-stat-value--negative"}`}>
          {formatStat(availableBalance, 2)}
        </span>
        <span className="demo-stat-label">Available Balance</span>
      </div>
      <div className="demo-stat">
        <span className={`demo-stat-value ${netProfit >= 0 ? "demo-stat-value--positive" : "demo-stat-value--negative"}`}>
          {formatStat(netProfit, 2)}
        </span>
        <span className="demo-stat-label">Net Profit</span>
        <div className={`stat-trend ${netProfit >= 0 ? "stat-trend--up" : "stat-trend--down"}`}>
          <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {netProfit >= 0 ? (
              <>
                <path d="M2 28 C12 28, 18 10, 28 16 C38 22, 44 6, 54 10 C64 14, 70 2, 78 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <polyline points="73 1, 78 4, 75 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            ) : (
              <>
                <path d="M2 4 C12 4, 18 22, 28 16 C38 10, 44 26, 54 22 C64 18, 70 30, 78 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <polyline points="73 31, 78 28, 75 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default StatCards;
