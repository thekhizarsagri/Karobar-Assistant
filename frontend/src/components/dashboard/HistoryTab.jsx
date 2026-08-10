function HistoryTab({ salesSummary }) {
  const productHistory = salesSummary?.product_history || {};
  const historyEntries = Object.values(productHistory);

  return (
    <div className="history-panel">
      <div className="history-summary">
        <p>Total tracked sales: {salesSummary?.total_units ?? 0}</p>
        <p>Products recorded: {historyEntries.length}</p>
      </div>
      <div className="history-list">
        {historyEntries.map((product) => (
          <div key={product.product_name} className="history-card">
            <div className="history-card-header">
              <div>
                <h3>{product.product_name}</h3>
                <p>Total sold: {product.total_quantity}</p>
              </div>
              <span className="history-pill">{(product.entries || []).length} entries</span>
            </div>
            <ul className="history-entry-list">
              {(product.entries || []).map((entry, index) => (
                <li key={`${product.product_name}-${index}`}>
                  <strong>{entry.quantity}</strong> units • {entry.period} • {entry.entry_date || "No date"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryTab;