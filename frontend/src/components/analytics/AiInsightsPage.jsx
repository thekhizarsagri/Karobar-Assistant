import { useCallback, useEffect, useState } from "react";
import TabBar from "./TabBar";
import AbcPanel from "./AbcPanel";
import VelocityPanel from "./VelocityPanel";
import { formatStat } from "../../utils/formatNumber";

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
    { label: "Total revenue", value: formatStat(summary.total_revenue) },
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

export default AiInsightsPage;
