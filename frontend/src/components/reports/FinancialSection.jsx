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

export default function FinancialSection({ financials, gmroi, turnover }) {
  return (
    <section className="inv-section">
      <h2 className="inv-section-title">Financial summary</h2>
      <div className="rep-metric-grid">
        <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.revenue, 2)}</span><span className="rep-metric-label">Revenue (sales)</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.cogs, 2)}</span><span className="rep-metric-label">Cost of goods sold</span></div>
        <div className="rep-metric"><span className="rep-metric-value rep-metric--green">{fmt(financials.gross_profit, 2)}</span><span className="rep-metric-label">Gross profit</span></div>
        <div className="rep-metric"><span className={`rep-metric-value ${financials.net_profit >= 0 ? "rep-metric--green" : "rep-metric--red"}`}>{fmt(financials.net_profit, 2)}</span><span className="rep-metric-label">Net profit</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.total_expenses, 2)}</span><span className="rep-metric-label">Total expenses</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.units_sold)}</span><span className="rep-metric-label">Units sold</span></div>
      </div>

      <h2 className="inv-section-title rep-subtitle">Efficiency</h2>
      <div className="rep-metric-grid">
        <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{fmt(gmroi.value, 2)}</span><span className="rep-metric-label">GMROI (margin ÷ inventory cost)</span></div>
        <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{fmt(turnover.ratio, 2)}</span><span className="rep-metric-label">Inventory turnover / year</span></div>
        <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{turnover.dio != null ? fmt(turnover.dio, 1) : "—"}</span><span className="rep-metric-label">Days of inventory (DIO)</span></div>
        <div className="rep-metric"><span className="rep-metric-value">{fmt(gmroi.avg_inventory_cost, 2)}</span><span className="rep-metric-label">Avg inventory cost</span></div>
      </div>
    </section>
  );
}
