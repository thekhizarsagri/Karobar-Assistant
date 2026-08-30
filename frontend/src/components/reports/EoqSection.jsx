import { formatCompact } from "../../utils/formatNumber";

function fmt(value, fractionDigits = 0) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, fractionDigits > 0 ? 1 : 0);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export default function EoqSection({ eoq }) {
  return (
    <section className="inv-section">
      <h2 className="inv-section-title">Economic order quantity (EOQ)</h2>
      <p className="rep-note">
        Estimated optimal order size: <strong>√(2 × annual demand × order cost ÷ holding cost)</strong>.
        Order cost {fmt(50, 0)} and a {Math.round(20)}% annual holding rate are assumed.
      </p>
      {eoq.length === 0 ? (
        <p className="inv-muted">No products with sales data yet.</p>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Annual demand</th>
                <th>Unit cost</th>
                <th>Holding cost / unit</th>
                <th>EOQ (per order)</th>
                <th>Orders / year</th>
              </tr>
            </thead>
            <tbody>
              {eoq.map((e) => (
                <tr key={e.product}>
                  <td><span className="inv-product-name">{e.product}</span></td>
                  <td>{fmt(e.annual_demand)}</td>
                  <td>{fmt(e.cost_price, 2)}</td>
                  <td>{fmt(e.holding_cost, 2)}</td>
                  <td>{e.order_qty > 0 ? fmt(e.order_qty) : <span className="inv-muted">—</span>}</td>
                  <td>{e.orders_per_year > 0 ? fmt(e.orders_per_year, 1) : <span className="inv-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
