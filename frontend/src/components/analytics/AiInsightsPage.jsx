import { useCallback, useEffect, useState } from "react";
import TabBar from "./TabBar";
import { DonutChart, HorizontalBarChart } from "./Charts";
import { formatStat, formatCompact } from "../../utils/formatNumber";

const ABC_COLORS = { A: "#1d4ed8", B: "#f59e0b", C: "#64748b" };

const VIEW_TABS = [
  ["abc", "ABC Pareto"],
  ["velocity", "Product Velocity"],
];

const EXPORT_DATASETS = [
  ["abc", "ABC analysis"],
  ["velocity", "Product velocity"],
];

const EMPTY = {
  summary: { total_units: 0, total_revenue: 0, active_products: 0, days_with_data: 0 },
  abc: [],
  velocity: { top_movers: [], slow_movers: [] },
};

function AiInsightsPage({ data }) {
  const [analytics, setAnalytics] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("abc");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/advanced");
      if (!res.ok) throw new Error("Unable to load analytics");
      setAnalytics(await res.json());
    } catch (err) {
      setError(err.message || "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [data, fetchAnalytics]);

  return (
    <div className="analytics-page ai-analytics-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">AI Analytics</h1>
          <p className="analytics-subtitle">Advanced analytics for your business</p>
        </div>
        <div className="ai-actions">
          <button type="button" className="analytics-back-btn" onClick={fetchAnalytics}>
            Refresh
          </button>
          <div className="export-menu">
            <span className="export-label">Export CSV</span>
            {EXPORT_DATASETS.map(([ds, label]) => (
              <a
                key={ds}
                className="export-link"
                href={`/api/analytics/export?dataset=${ds}`}
                download={`karobar-${ds}.csv`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <p>Crunching your data…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <SummaryCards summary={analytics.summary} />
          <TabBar tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />
          {activeTab === "abc" && <AbcPanel rows={analytics.abc} />}
          {activeTab === "velocity" && <VelocityPanel velocity={analytics.velocity} />}
        </>
      )}
    </div>
  );
}

function SummaryCards({ summary }) {
  const cards = [
    { label: "Total units sold", value: summary.total_units },
    { label: "Total revenue", value: formatMoney(summary.total_revenue) },
    { label: "Active products", value: summary.active_products },
    { label: "Days with data", value: summary.days_with_data },
  ];
  return (
    <div className="ai-summary-cards">
      {cards.map((card) => (
        <div key={card.label} className="ai-summary-card">
          <span className="ai-summary-value">{card.value}</span>
          <span className="ai-summary-label">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

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

  // Prepare donut chart data (product revenue distribution colored by class)
  const donutData = rows.map((row) => ({
    label: row.product,
    value: Math.round(row.revenue),
    color: ABC_COLORS[row.class] || "#cbd5e1",
  }));

  return (
    <section className="ai-panel">
      <div className="ai-panel-heading">
        <h2>ABC (Pareto) Product Classification</h2>
        <p>Products ranked by revenue share to help you focus on what matters most.</p>
      </div>

      <div className="analytics-split-layout" style={{ alignItems: "center", marginBottom: "28px" }}>
        {/* Donut Chart visual representation */}
        <div className="chart-section" style={{ margin: 0, padding: "20px" }}>
          <div className="chart-section-title">Revenue Share by Product</div>
          <DonutChart data={donutData} centerTextLabel="Total Revenue" />
        </div>

        {/* Legend description */}
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
              <span>{formatMoney(row.revenue)}</span>
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

function VelocityPanel({ velocity }) {
  const hasTop = velocity.top_movers && velocity.top_movers.length > 0;
  const hasSlow = velocity.slow_movers && velocity.slow_movers.length > 0;

  if (!hasTop && !hasSlow) return null;

  // Map to HorizontalBarChart format
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
        {/* Top movers list & chart */}
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

        {/* Slow movers / dead stock list & chart */}
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

function formatMoney(value) {
  return formatStat(value);
}

export default AiInsightsPage;
