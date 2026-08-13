import { getProductColor } from "../analytics/constants";

function ProductHistoryDetail({ productName, salesSummary, products, onBack }) {
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const order =
    productOrder.length > 0 ? productOrder : (products || []).map((p) => p.name);
  const colorMap = {};
  order.forEach((name, index) => {
    colorMap[name] = getProductColor(index);
  });

  const color = colorMap[productName] || getProductColor(0);
  const sales = productHistory[productName]?.entries || [];
  const stockEntries = stockHistory[productName] || [];

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stockLabel = (entry) =>
    entry.source === "form"
      ? `${entry.quantity} stock added in form`
      : `${entry.quantity} stock added on ${formatDate(entry.created_at)}`;

  return (
    <div className="history-detail-page">
      <div className="history-detail-header">
        <div className="history-detail-title-block">
          <h1 style={{ color }}>{productName}</h1>
          <p className="history-detail-subtitle">
            Total sold: {productHistory[productName]?.total_quantity ?? 0} units
          </p>
        </div>
        <button type="button" className="history-detail-back-btn" onClick={onBack}>Back to history</button>
      </div>

      <div className="history-detail-section">
        <h4>Sales</h4>
        {sales.length === 0 ? (
          <p className="history-empty">No sales recorded yet.</p>
        ) : (
          <ul className="history-entry-list">
            {sales.map((entry, index) => (
              <li key={`${productName}-sale-${index}`}>
                <strong>{entry.quantity}</strong> units • {entry.period} •{" "}
                {entry.entry_date || "No date"}
                {entry.created_at ? (
                  <span className="history-entry-meta">
                    {" "}recorded on {formatDateTime(entry.created_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="history-detail-section">
        <h4>Stock added</h4>
        {stockEntries.length === 0 ? (
          <p className="history-empty">No stock entries recorded yet.</p>
        ) : (
          <ul className="history-entry-list">
            {stockEntries.map((entry, index) => (
              <li key={`${productName}-stock-${index}`}>
                <strong>{stockLabel(entry)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ProductHistoryDetail;