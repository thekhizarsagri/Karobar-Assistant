import { useState } from "react";
import StockModal from "./StockModal";

function AutomationPage({ products, rules, onRun, onRemove, onSubmit }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="automation-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Automation</h1>
          <p className="analytics-subtitle">Set up automatic stock additions for your products</p>
        </div>
        <button type="button" className="add-stock-btn" onClick={() => setModalOpen(true)}>
          <span className="add-stock-icon">+</span> Add automatic schedule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="automation-empty">
          <p>No automatic schedules yet.</p>
          <p>Add one to auto-restock your products every month.</p>
        </div>
      ) : (
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
      )}

      <StockModal
        products={products}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => {
          setModalOpen(false);
          onSubmit(payload);
        }}
        initialMode="automatic"
      />
    </div>
  );
}

export default AutomationPage;
