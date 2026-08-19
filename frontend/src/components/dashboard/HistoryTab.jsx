import { getProductColor } from "../analytics/constants";
import { buildProductColorMap } from "../analytics/selectors";

function HistoryTab({ salesSummary, products, onOpenProduct }) {
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const colorMap = buildProductColorMap(productOrder, products);

  const names = new Set(productOrder);
  (products || []).forEach((p) => {
    if (p.name) names.add(p.name);
  });
  Object.keys(productHistory).forEach((name) => names.add(name));
  Object.keys(stockHistory).forEach((name) => names.add(name));
  const productNames = Array.from(names);

  return (
    <div className="history-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Product History</h1>
          <p className="analytics-subtitle">Track every sale and stock addition for your products</p>
        </div>
      </div>

      <div className="history-panel">
        <div className="history-summary">
          <p>Total tracked sales: {salesSummary?.total_units ?? 0}</p>
          <p>Products recorded: {productNames.length}</p>
        </div>

        <div className="history-product-buttons">
          {productNames.map((name) => {
            const color = colorMap[name] || getProductColor(0);
            return (
              <button
                key={name}
                type="button"
                className="history-product-btn"
                style={{ background: color, color: "#fff", borderColor: color }}
                onClick={() => onOpenProduct(name)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoryTab;