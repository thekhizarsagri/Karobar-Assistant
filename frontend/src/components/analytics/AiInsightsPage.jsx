import { useCallback, useEffect, useState } from "react";
import TabBar from "./TabBar";

const ABC_COLORS = { A: "#1d4ed8", B: "#f59e0b", C: "#94a3b8" };

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

function AiInsightsPage({ data, onBack }) {
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
          <button type="button" className="analytics-back-btn" onClick={onBack}>Back</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>Crunching your data…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
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
  return (
    <section className="ai-panel">
      <div className="ai-panel-heading">
        <h2>ABC (Pareto) Product Classification</h2>
        <p>Products ranked by revenue share to help you focus on what matters most.</p>
      </div>
      <div className="abc-legend">
        {Object.entries(ABC_LABELS).map(([cls, label]) => (
          <span key={cls} className="abc-legend-item">
            <span className="abc-legend-dot" style={{ background: ABC_COLORS[cls] }}>
              {cls}
            </span>
            {label}
            <span className="abc-legend-count">{counts[cls] || 0} product{(counts[cls] || 0) === 1 ? "" : "s"}</span>
          </span>
        ))}
      </div>
      <div className="abc-table">
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
  if (!velocity.top_movers.length && !velocity.slow_movers.length) return null;
  return (
    <section className="ai-panel">
      <div className="ai-panel-heading">
        <h2>Product Velocity</h2>
        <p>Fast movers vs. slow or dead stock.</p>
      </div>
      <VelocityList title="Top movers" items={velocity.top_movers} accent="top" />
      <VelocityList title="Slow movers / dead stock" items={velocity.slow_movers} accent="slow" />
    </section>
  );
}

function VelocityList({ title, items, accent }) {
  return (
    <div className="velocity-block">
      <h3 className="velocity-title">{title}</h3>
      {items.length === 0 ? (
        <p className="velocity-empty">No items</p>
      ) : (
        <ul className="velocity-list">
          {items.map((item) => (
            <li key={item.product} className="velocity-item">
              <span className="velocity-name">{item.product}</span>
              <span className={`velocity-stats velocity-${accent}`}>
                {item.units} units
                {item.avg_per_day > 0 && <> · {item.avg_per_day}/day</>}
                {item.days_since_last_sale !== null && (
                  <> · {item.days_since_last_sale}d ago</>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default AiInsightsPage;
