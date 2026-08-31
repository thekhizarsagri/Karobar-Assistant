import { DonutChart } from "./Charts";
import { formatStat } from "../../utils/formatNumber";

const ABC_COLORS = { A: "#1d4ed8", B: "#f59e0b", C: "#64748b" };

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
    <section className="ai-panel">
      <div className="ai-panel-heading">
        <span className="rep-section-icon rep-section-icon--abc" style={{ background: "#eff6ff" }}>📊</span>
        <div>
          <h2>ABC (Pareto) Product Classification</h2>
          <p>Products ranked by revenue share to help you focus on what matters most.</p>
        </div>
      </div>

      <div className="analytics-split-layout" style={{ alignItems: "center", marginBottom: "28px" }}>
        <div className="chart-section" style={{ margin: 0, padding: "20px" }}>
          <div className="chart-section-title">Revenue Share by Product</div>
          <DonutChart data={donutData} centerTextLabel="Total Revenue" />
        </div>

        <div className="abc-legend-column" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="abc-legend" style={{ display: "flex", flexDirection: "column", gap: "12px", border: "none", padding: 0 }}>
            {Object.entries(ABC_LABELS).map(([cls, label]) => (
              <div key={cls} className="abc-legend-item" style={{ fontSize: "0.95rem" }}>
                <span className="abc-legend-dot" style={{ background: ABC_COLORS[cls], marginRight: "12px", width: "32px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", color: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}>
                  {cls}
                </span>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span className="abc-legend-count" style={{ marginLeft: "auto", background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
                  {counts[cls] || 0} prod
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="abc-table" style={{ marginTop: "20px" }}>
        <div className="abc-row abc-row-head">
          <span>Product</span>
          <span>Class</span>
          <span>Units</span>
          <span>Revenue</span>
          <span>Revenue %</span>
          <span>Cumulative share</span>
        </div>
        {rows.map((row) => {
          const width = Math.min(100, Math.max(row.cumulative_pct, 2));
          return (
            <div className="abc-row" key={row.product}>
              <span className="abc-product">{row.product}</span>
              <span className="abc-class" style={{ background: ABC_COLORS[row.class] }}>
                {row.class}
              </span>
              <span>{row.units}</span>
              <span>{formatStat(row.revenue)}</span>
              <span>{row.revenue_pct}%</span>
              <span className="abc-share">
                <span className="abc-share-bar">
                  <span
                    className="abc-share-fill"
                    style={{ width: `${width}%`, background: ABC_COLORS[row.class] }}
                  />
                </span>
                {row.cumulative_pct}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AbcPanel;
