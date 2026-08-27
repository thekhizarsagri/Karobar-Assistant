const MAX_VALUE = 1_000_000_000_000;

function ExpensesForm({ items, values, onToggle, onChange }) {
  const handleChange = (key, val) => {
    const num = Number(val);
    if (val !== "" && (num < 0 || num > MAX_VALUE)) return;
    onChange(key, val);
  };

  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill active">Step 3</span>
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
              min="0"
              max={MAX_VALUE}
              value={values[item.key].amount}
              disabled={!values[item.key].enabled}
              onChange={(e) => handleChange(item.key, e.target.value)}
              style={{
                padding: "12px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                width: "100%",
                boxSizing: "border-box",
                fontSize: "14px",
                color: "#0f172a",
                background: "#f8fafc",
                transition: "border-color 0.2s ease",
                outline: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpensesForm;