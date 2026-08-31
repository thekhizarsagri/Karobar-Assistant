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

export default function BreakEvenSection({ breakEven }) {
  return (
    <section className="inv-section">
      <div className="rep-section-header">
        <span className="rep-section-icon rep-section-icon--amber">⚖️</span>
        <h2>Break-even analysis</h2>
      </div>
      <div className="rep-metric-grid">
        <div className="rep-metric"><span className="rep-metric-value">{breakEven.revenue != null ? fmt(breakEven.revenue) : "—"}</span><span className="rep-metric-label">Break-even revenue</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{breakEven.units != null ? fmt(breakEven.units) : "—"}</span><span className="rep-metric-label">Break-even units</span></div>
        <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{fmt(breakEven.cm_ratio * 100, 1)}%</span><span className="rep-metric-label">Contribution margin ratio</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{fmt(breakEven.total_expenses, 2)}</span><span className="rep-metric-label">Fixed expenses to cover</span></div>
      </div>
      <div className="inv-table-wrap" style={{ marginTop: "20px" }}>
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Contribution / unit</th>
              <th>Margin</th>
              <th>Units to break even</th>
              <th>Revenue at break-even</th>
            </tr>
          </thead>
          <tbody>
            {breakEven.products.map((p) => (
              <tr key={p.product}>
                <td><span className="inv-product-name">{p.product}</span></td>
                <td>{fmt(p.contribution, 2)}</td>
                <td>{fmt(p.margin_pct, 1)}%</td>
                <td>{p.units != null ? fmt(p.units) : <span className="inv-muted">—</span>}</td>
                <td>{p.revenue != null ? fmt(p.revenue) : <span className="inv-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
