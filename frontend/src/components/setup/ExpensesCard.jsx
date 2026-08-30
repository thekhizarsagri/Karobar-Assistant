import { fixedExpenseItems } from "./constants";

function ExpensesCard({
  expenses,
  onToggleExpense,
  onChangeExpense,
  currentCurrency,
  activeExpenseCount,
  totalMonthlyExpenses,
}) {
  return (
    <div className="setup-card">
      <div className="card-header">
        <div className="card-icon-box purple-gradient">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div className="card-title-row">
            <h3 className="card-title">Fixed Monthly Operating Expenses</h3>
            <span className="badge-pill">
              {activeExpenseCount} active • {currentCurrency.symbol}
              {totalMonthlyExpenses.toLocaleString()} / mo
            </span>
          </div>
          <p className="card-desc">
            Track overhead costs like rent, utilities, and payroll for accurate profit margins.
          </p>
        </div>
      </div>

      <div className="expenses-container">
        <div className="expenses-mini-grid">
          {fixedExpenseItems.map((item) => {
            const isEnabled = !!expenses?.[item.key]?.enabled;
            const amountVal = expenses?.[item.key]?.amount ?? item.amount;
            return (
              <div
                key={item.key}
                className={`expense-item-row ${isEnabled ? "active" : "inactive"}`}
              >
                <label className="expense-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => onToggleExpense(item.key)}
                    className="custom-checkbox"
                  />
                  <span className="expense-label-text">{item.label}</span>
                </label>
                <div className="expense-input-wrapper">
                  <span className="currency-prefix">{currentCurrency.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    disabled={!isEnabled}
                    value={amountVal}
                    onChange={(e) => onChangeExpense(item.key, e.target.value)}
                    placeholder="0"
                    className="expense-amount-input"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="expenses-summary-bar">
          <span className="summary-text">Total Monthly Overhead:</span>
          <span className="summary-amount">
            {currentCurrency.symbol}
            {totalMonthlyExpenses.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ExpensesCard;
