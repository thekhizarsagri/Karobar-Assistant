function ExpensesForm({ items, values, onToggle, onChange }) {
  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill">Step 3</span>
        <h2>Fixed monthly expenses</h2>
      </div>
      <div className="expenses-grid">
        {items.map((item) => (
          <div key={item.key} className="expense-row">
            <label className="expense-toggle">
              <input
                type="checkbox"
                checked={values[item.key].enabled}
                onChange={() => onToggle(item.key)}
              />
              <span>{item.label}</span>
            </label>
            <input
              type="number"
              value={values[item.key].amount}
              disabled={!values[item.key].enabled}
              onChange={(e) => onChange(item.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpensesForm;