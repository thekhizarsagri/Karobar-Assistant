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
    <section className="analytics-section ai-panel">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--velocity" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18l6-8 4 4 8-10" />
            <path d="M17 4h4v4" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Product Velocity</h2>
          <p className="analytics-section-sub">A comparison of average unit sales speeds. High velocity items require constant stock reviews.</p>
        </span>
      </div>

      <div className="analytics-split-layout velocity-split">
        <div className="chart-section velocity-card">
          <div className="chart-section-title chart-section-title--with-icon">
            <span className="velocity-title-icon velocity-title-icon--up" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
            Top Movers (Fast Sales)
          </div>
          <HorizontalBarChart data={topMoversData} barColor="#0a9e78" />
        </div>

        <div className="chart-section velocity-card">
          <div className="chart-section-title chart-section-title--with-icon">
            <span className="velocity-title-icon velocity-title-icon--down" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </span>
            Slow Movers &amp; Dead Stock
          </div>
          <HorizontalBarChart data={slowMoversData} barColor="#ef4444" />
        </div>
      </div>
    </section>
  );
}

export default VelocityPanel;
