import { formatNumber as fmt } from "../../utils/formatNumber";
import { useCountUp } from "./reportUtils";

function Metric({ icon, iconClass, value, label, valueClass = "", decimals = 2, prefix = "", suffix = "" }) {
  const animated = useCountUp(Number(value) || 0);
  return (
    <div className="rep-metric">
      <span className={`rep-metric-icon ${iconClass}`} aria-hidden="true">{icon}</span>
      <span className="rep-metric-text">
        <span className={`rep-metric-value ${valueClass}`}>
          {prefix}{fmt(animated, decimals)}{suffix}
        </span>
        <span className="rep-metric-label">{label}</span>
      </span>
    </div>
  );
}

const ICONS = {
  revenue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  cost: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  profit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1 1.5 3 1.8 3 .8 3 1.9-1.3 1.8-3 1.8-3-.8-3-1.8" />
    </svg>
  ),
  units: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  gauge: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l4-6" />
      <path d="M4.5 17a8 8 0 1 1 15 0" />
    </svg>
  ),
  cycle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.5 15a9 9 0 1 1-1.4-8.4L23 10" />
    </svg>
  ),
};

export default function FinancialSection({ financials, gmroi, turnover }) {
  const fin = financials || {};
  const gm = gmroi || {};
  const to = turnover || {};
  const net = Number(fin.net_profit ?? 0);
  const marginPct = Number(fin.net_margin ?? 0) * 100;
  const expenseRatio = Number(fin.revenue) > 0 ? (Number(fin.total_expenses ?? 0) / Number(fin.revenue)) * 100 : 0;

  return (
    <section className="analytics-section rep-section">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--finance" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2.5" />
            <path d="M2 10h20" />
            <path d="M6 15h4" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Financial summary</h2>
          <p className="analytics-section-sub">Revenue, costs, and bottom-line profit</p>
        </span>
      </div>
      <div className="rep-metric-grid">
        <Metric icon={ICONS.revenue} iconClass="rep-metric-icon--green" value={fin.revenue} label="Revenue (sales)" />
        <Metric icon={ICONS.cost} iconClass="rep-metric-icon--amber" value={fin.cogs} label="Cost of goods sold" />
        <Metric icon={ICONS.profit} iconClass="rep-metric-icon--green" value={fin.gross_profit} label="Gross profit" valueClass="rep-metric--green" />
        <Metric icon={ICONS.profit} iconClass={net >= 0 ? "rep-metric-icon--green" : "rep-metric-icon--red"} value={fin.net_profit} label="Net profit" valueClass={net >= 0 ? "rep-metric--green" : "rep-metric--red"} />
        <Metric icon={ICONS.cost} iconClass="rep-metric-icon--amber" value={fin.total_expenses} label="Total expenses" />
        <Metric icon={ICONS.units} iconClass="rep-metric-icon--blue" value={fin.units_sold} label="Units sold" decimals={0} />
        <Metric icon={ICONS.gauge} iconClass="rep-metric-icon--blue" value={marginPct} label="Net margin" decimals={1} suffix="%" valueClass={marginPct >= 0 ? "rep-metric--green" : "rep-metric--red"} />
        <Metric icon={ICONS.gauge} iconClass="rep-metric-icon--purple" value={expenseRatio} label="Expense ratio" decimals={1} suffix="%" />
      </div>

      <div className="analytics-section-head rep-section-divider">
        <span className="analytics-section-icon analytics-section-icon--efficiency" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Efficiency</h2>
          <p className="analytics-section-sub">How hard every rupee of stock works</p>
        </span>
      </div>
      <div className="rep-metric-grid">
        <Metric icon={ICONS.gauge} iconClass="rep-metric-icon--blue" value={gm.value} label="GMROI (margin ÷ inventory cost)" valueClass="rep-metric--blue" />
        <Metric icon={ICONS.cycle} iconClass="rep-metric-icon--purple" value={to.ratio} label="Inventory turnover / year" valueClass="rep-metric--blue" />
        <Metric icon={ICONS.cycle} iconClass="rep-metric-icon--purple" value={to.dio} label="Days of inventory (DIO)" decimals={1} />
        <Metric icon={ICONS.cost} iconClass="rep-metric-icon--amber" value={gm.avg_inventory_cost} label="Avg inventory cost" />
      </div>
    </section>
  );
}
