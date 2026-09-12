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
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--ai" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Analytics</h1>
            <p className="analytics-subtitle">Advanced analytics for your business</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <div className="export-menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
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
          <button type="button" className="ai-refresh-btn" onClick={fetchAnalytics} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.5 15a9 9 0 1 1-1.4-8.4L23 10" />
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <p className="analytics-empty-title">Crunching your data…</p>
          <p className="analytics-empty-sub">Analyzing sales patterns across your products.</p>
        </div>
      ) : error ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <p className="analytics-empty-title">Something went wrong</p>
          <p className="analytics-empty-sub">{error}</p>
          <button type="button" className="ai-retry-btn" onClick={fetchAnalytics}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <SummaryCards summary={analytics.summary} />
          <div className="ai-tabs-row">
            <TabBar tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />
          </div>
          {activeTab === "abc" && <AbcPanel rows={analytics.abc} />}
          {activeTab === "velocity" && <VelocityPanel velocity={analytics.velocity} />}
        </>
      )}
    </div>
  );
}

const SUMMARY_CARDS = [
  {
    key: "total_units",
    label: "Total units sold",
    sub: "Across all history",
    iconClass: "analytics-stat-icon--green",
    stroke: "#0d9d7a",
    icon: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </>
    ),
  },
  {
    key: "total_revenue",
    label: "Total revenue",
    sub: "Estimated retail value",
    iconClass: "analytics-stat-icon--blue",
    stroke: "#2f80ed",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1 1.5 3 1.8 3 .8 3 1.9-1.3 1.8-3 1.8-3-.8-3-1.8" />
      </>
    ),
  },
  {
    key: "active_products",
    label: "Active products",
    sub: "With recorded sales",
    iconClass: "analytics-stat-icon--purple",
    stroke: "#7c3aed",
    icon: (
      <>
        <path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="#7c3aed" stroke="none" />
      </>
    ),
  },
  {
    key: "days_with_data",
    label: "Days with data",
    sub: "Sales day coverage",
    iconClass: "analytics-stat-icon--amber",
    stroke: "#b45309",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
];

function SummaryCards({ summary }) {
  return (
    <div className="analytics-stats ai-summary-cards">
      {SUMMARY_CARDS.map((card) => {
        const raw = summary[card.key];
        const value = card.key === "total_revenue" ? formatStat(raw) : formatStat(raw ?? 0);
        return (
          <div key={card.key} className="analytics-stat ai-summary-card">
            <span className={`analytics-stat-icon ${card.iconClass}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={card.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {card.icon}
              </svg>
            </span>
            <span className="analytics-stat-body">
              <strong className="analytics-stat-value">{value}</strong>
              <span className="analytics-stat-label">{card.label}</span>
              <span className="analytics-stat-sub">{card.sub}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default AiInsightsPage;
