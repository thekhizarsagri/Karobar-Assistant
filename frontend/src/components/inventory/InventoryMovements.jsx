import { DonutChart } from "../analytics/Charts";
import { formatCompact } from "../../utils/formatNumber";
import { SOURCE_LABELS } from "./inventoryConstants";

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

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function InventoryMovements({ categoryChart, summary, movements }) {
  return (
    <div className="inv-bottom-grid">
      <section className="inv-section">
        <h2 className="inv-section-title">Stock value by category</h2>
        {categoryChart.length > 0 ? (
          <DonutChart data={categoryChart} centerTextLabel="Retail value" />
        ) : (
          <p className="inv-muted">No category data yet.</p>
        )}
      </section>

      <section className="inv-section">
        <h2 className="inv-section-title">Valuation summary</h2>
        <div className="inv-valuation">
          <div className="inv-valuation-row">
            <span>Cost value</span>
            <strong>{fmt(summary.total_cost_value, 2)}</strong>
          </div>
          <div className="inv-valuation-row">
            <span>Retail value</span>
            <strong>{fmt(summary.total_retail_value, 2)}</strong>
          </div>
          <div className="inv-valuation-row inv-valuation-row--total">
            <span>Potential profit</span>
            <strong>{fmt(summary.potential_profit, 2)}</strong>
          </div>
        </div>
      </section>

      <section className="inv-section inv-movements">
        <h2 className="inv-section-title">Recent stock movements</h2>
        {movements.length === 0 ? (
          <p className="inv-muted">No stock movements yet.</p>
        ) : (
          <ul className="inv-movement-list">
            {movements.map((move, index) => (
              <li key={`${move.product}-${move.created_at}-${index}`} className="inv-movement-item">
                <span className="inv-movement-qty">+{fmt(move.quantity)}</span>
                <span className="inv-movement-detail">
                  <span className="inv-movement-product">{move.product}</span>
                  <span className="inv-movement-meta">
                    {SOURCE_LABELS[move.source] || move.source}
                    {move.created_at ? ` • ${formatDate(move.created_at)}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
