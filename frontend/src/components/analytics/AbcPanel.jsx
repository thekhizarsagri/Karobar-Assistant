import { DonutChart } from "./Charts";
import { formatStat } from "../../utils/formatNumber";

const ABC_COLORS = { A: "#0a9e78", B: "#b45309", C: "#64748b" };

const ABC_LABELS = {
  A: "Top revenue drivers (~80% of revenue)",
  B: "Steady contributors (next ~15%)",
  C: "Low / slow contributors (last ~5%)",
};

function AbcPanel({ rows }) {
  if (!rows.length) return null;
  const counts = rows.reduce((acc, row) => {
    acc[row.class] = (acc[row.class] || 0) + 1;
    return acc;
  }, {});

  const donutData = rows.map((row) => ({
    label: row.product,
    value: Math.round(row.revenue),
    color: ABC_COLORS[row.class] || "#cbd5e1",
  }));

  return (
    <section className="analytics-section ai-panel">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--products" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M6.5 21v-11" />
            <path d="M12 21v-7" />
            <path d="M17.5 21v-3.5" />
            <circle cx="17.5" cy="14" r="1.3" fill="#fff" stroke="none" />
            <circle cx="12" cy="11" r="1.3" fill="#fff" stroke="none" />
            <circle cx="6.5" cy="7" r="1.3" fill="#fff" stroke="none" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">ABC (Pareto) Product Classification</h2>
          <p className="analytics-section-sub">Products ranked by revenue share to help you focus on what matters most.</p>
        </span>
      </div>

      <div className="analytics-split-layout abc-split">
        <div className="chart-section abc-donut-card">
          <div className="chart-section-title">Revenue Share by Product</div>
          <DonutChart data={donutData} centerTextLabel="Total Revenue" />
        </div>

        <div className="abc-legend-column">
          <div className="abc-legend">
            {Object.entries(ABC_LABELS).map(([cls, label]) => (
              <div key={cls} className="abc-legend-item">
                <span
                  className="abc-legend-dot"
                  style={{ "--class-color": ABC_COLORS[cls] }}
                  aria-hidden="true"
                >
                  {cls}
                </span>
                <span className="abc-legend-text">{label}</span>
                <span className="abc-legend-count">
                  {counts[cls] || 0} prod
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="abc-table-wrap">
        <div className="abc-table">
          <div className="abc-row abc-row-head">
            <span>Product</span>
            <span>Class</span>
            <span>Units</span>
            <span>Revenue</span>
            <span>Revenue %</span>
            <span>Cumulative share</span>
          </div>
          {rows.map((row, idx) => {
            const width = Math.min(100, Math.max(row.cumulative_pct, 2));
            return (
              <div
                className="abc-row analytics-card-animated"
                style={{ animationDelay: `${Math.min(idx, 14) * 30}ms` }}
                key={row.product}
              >
                <span className="abc-product">{row.product}</span>
                <span>
                  <span className="abc-class" style={{ "--class-color": ABC_COLORS[row.class] }}>
                    {row.class}
                  </span>
                </span>
                <span className="abc-num">{formatStat(row.units)}</span>
                <span className="abc-num">{formatStat(row.revenue)}</span>
                <span className="abc-num">{row.revenue_pct}%</span>
                <span className="abc-share">
                  <span className="abc-share-bar">
                    <span
                      className="abc-share-fill"
                      style={{ width: `${width}%`, background: ABC_COLORS[row.class] }}
                    />
                  </span>
                  <span className="abc-share-pct">{row.cumulative_pct}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AbcPanel;
