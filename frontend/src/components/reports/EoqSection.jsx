import { formatNumber as fmt } from "../../utils/formatNumber";

export default function EoqSection({ eoq }) {
  return (
    <section className="inv-section">
      <div className="rep-section-header">
        <span className="rep-section-icon rep-section-icon--purple">📦</span>
        <h2>Economic order quantity (EOQ)</h2>
      </div>
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
