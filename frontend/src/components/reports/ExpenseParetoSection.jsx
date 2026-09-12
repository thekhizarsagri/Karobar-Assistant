import { formatNumber as fmt } from "../../utils/formatNumber";

export default function ExpenseParetoSection({ expenses }) {
  const exp = expenses || {};
  const pareto = exp.pareto || [];

  return (
    <section className="analytics-section rep-section">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--pareto" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 21v-11" />
            <path d="M12 21v-7" />
            <path d="M17.5 21v-3.5" />
            <circle cx="17.5" cy="14" r="1.3" fill="#fff" stroke="none" />
            <circle cx="12" cy="11" r="1.3" fill="#fff" stroke="none" />
            <circle cx="6.5" cy="7" r="1.3" fill="#fff" stroke="none" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Expense Pareto (80/20)</h2>
          <p className="analytics-section-sub">
            {pareto.length === 0
              ? "Ranked spend once expenses are configured."
              : `${pareto.length} expenses · total ${fmt(exp.total, 2)}`}
          </p>
        </span>
      </div>
      {pareto.length === 0 ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <p className="analytics-empty-title">No expenses to report</p>
          <p className="analytics-empty-sub">Enable expenses to see the 80/20 breakdown.</p>
        </div>
      ) : (
        <div className="rep-pareto">
          {pareto.map((row, idx) => (
            <div
              key={row.label ?? `pareto-${idx}`}
              className="rep-pareto-row analytics-card-animated"
              style={{ animationDelay: `${Math.min(idx, 11) * 40}ms` }}
            >
              <div className="rep-pareto-head">
                <span className="rep-pareto-rank" aria-hidden="true">{idx + 1}</span>
                <span className="rep-pareto-label">{row.label || "Unnamed expense"}</span>
                <span className="rep-pareto-val">{fmt(row.amount, 2)} · {row.pct}%</span>
              </div>
              <div className="rep-pareto-track">
                <div className="rep-pareto-fill" style={{ width: `${Math.min(100, Number(row.cumulative_pct) || 0)}%` }} />
              </div>
              <div className="rep-pareto-cum">cumulative {row.cumulative_pct}%</div>
            </div>
          ))}
          <p className="rep-note rep-pareto-total">Total expenses: <strong>{fmt(exp.total, 2)}</strong></p>
        </div>
      )}
    </section>
  );
}
