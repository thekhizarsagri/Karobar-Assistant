import { HorizontalBarChart } from "./Charts";

function VelocityPanel({ velocity }) {
  const hasTop = velocity.top_movers && velocity.top_movers.length > 0;
  const hasSlow = velocity.slow_movers && velocity.slow_movers.length > 0;

  if (!hasTop && !hasSlow) return null;

  const topMoversData = (velocity.top_movers || []).map((item) => ({
    label: item.product,
    value: item.avg_per_day,
    displayValue: `${item.units} units (${item.avg_per_day}/day)`,
  }));

  const slowMoversData = (velocity.slow_movers || []).map((item) => ({
    label: item.product,
    value: item.units === 0 ? 0 : item.avg_per_day,
    displayValue: item.units === 0 ? "Dead Stock (0 units)" : `${item.units} units (${item.avg_per_day}/day)`,
    fill: "#ef4444",
  }));

  return (
    <section className="ai-panel">
      <div className="ai-panel-heading">
        <h2>Product Velocity</h2>
        <p>A comparison of average unit sales speeds. High velocity items require constant stock reviews.</p>
      </div>

      <div className="analytics-split-layout">
        <div className="chart-section" style={{ margin: 0 }}>
          <div className="chart-section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#10b981" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span> Top Movers (Fast Sales)
          </div>
          <HorizontalBarChart data={topMoversData} barColor="#10b981" />
        </div>

        <div className="chart-section" style={{ margin: 0 }}>
          <div className="chart-section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#ef4444" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </span> Slow Movers & Dead Stock
          </div>
          <HorizontalBarChart data={slowMoversData} barColor="#ef4444" />
        </div>
      </div>
    </section>
  );
}

export default VelocityPanel;
