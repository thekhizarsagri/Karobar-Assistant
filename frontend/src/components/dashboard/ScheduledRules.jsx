function ScheduledRules({ rules, onRun, onRemove }) {
  if (rules.length === 0) return null;

  return (
    <div className="scheduled-rules-section">
      <h3 className="scheduled-rules-title">⏰ Active Automatic Schedules</h3>
      <p className="scheduled-rules-subtitle">Stock will be added automatically on the specified day &amp; time each month.</p>
      <div className="scheduled-rules-list">
        {rules.map((rule) => (
          <div key={rule.id} className="scheduled-rule-card">
            <div className="scheduled-rule-info">
              <span className="scheduled-rule-product">{rule.productName}</span>
              <span className="scheduled-rule-detail">
                +{rule.quantity} units &bull; Day {rule.dayOfMonth} of every month &bull; {rule.hour}:{rule.minute} {rule.ampm}
              </span>
            </div>
            <div className="scheduled-rule-actions">
              <button type="button" className="rule-test-btn" onClick={() => onRun(rule)} title="Run this schedule now to test">▶ Run Now</button>
              <button type="button" className="rule-remove-btn" onClick={() => onRemove(rule.id)} title="Remove this schedule">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduledRules;