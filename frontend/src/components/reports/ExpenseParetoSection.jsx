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

export default function ExpenseParetoSection({ expenses }) {
  return (
    <section className="inv-section">
      <h2 className="inv-section-title">Expense Pareto (80/20)</h2>
      {expenses.pareto.length === 0 ? (
        <p className="inv-muted">No enabled expenses to report.</p>
      ) : (
        <div className="rep-pareto">
          {expenses.pareto.map((row) => (
            <div key={row.label} className="rep-pareto-row">
              <div className="rep-pareto-head">
                <span className="rep-pareto-label">{row.label}</span>
                <span className="rep-pareto-val">{fmt(row.amount, 2)} · {row.pct}%</span>
              </div>
              <div className="rep-pareto-track">
                <div className="rep-pareto-fill" style={{ width: `${Math.min(100, row.cumulative_pct)}%` }} />
              </div>
              <div className="rep-pareto-cum">cumulative {row.cumulative_pct}%</div>
            </div>
          ))}
          <p className="rep-note">Total expenses: <strong>{fmt(expenses.total, 2)}</strong></p>
        </div>
      )}
    </section>
  );
}
