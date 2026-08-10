import { getProductColor } from "../analytics/constants";

function HistoryTab({ salesSummary, products, onOpenProduct }) {
  const productHistory = salesSummary?.product_history || {};
  const stockHistory = salesSummary?.stock_history || {};
  const productOrder = salesSummary?.product_order || [];

  const order =
    productOrder.length > 0 ? productOrder : (products || []).map((p) => p.name);
  const colorMap = {};
  order.forEach((name, index) => {
    colorMap[name] = getProductColor(index);
  });

  const names = new Set(productOrder);
  (products || []).forEach((p) => {
    if (p.name) names.add(p.name);
  });
  Object.keys(productHistory).forEach((name) => names.add(name));
  Object.keys(stockHistory).forEach((name) => names.add(name));
  const productNames = Array.from(names);

  return (
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
  );
}

export default HistoryTab;