import { useCallback, useEffect, useMemo, useState } from "react";
import KpiSection from "./KpiSection";
import FinancialSection from "./FinancialSection";
import BreakEvenSection from "./BreakEvenSection";
import EoqSection from "./EoqSection";
import SeasonalitySection from "./SeasonalitySection";
import ExpenseParetoSection from "./ExpenseParetoSection";
import InsightsStrip from "./InsightsStrip";
import { buildInsights, downloadReportCsv } from "./reportUtils";

const EMPTY = {
  generated_at: "",
  kpi: { score: 0, label: "Needs attention", profit_score: 0, stock_score: 0, turnover_score: 0 },
  financials: {},
  gmroi: {},
  turnover: {},
  break_even: { products: [] },
  eoq: [],
  seasonality: { index: [], has_data: false },
  expenses: { pareto: [] },
};

function formatGenerated(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} • ${timePart}`;
}

function ReportsPage() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Unable to load reports");
      const json = await res.json();
      setData({ ...EMPTY, ...(json || {}) });
    } catch (err) {
      setError(err.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const safe = data || EMPTY;
  const kpi = safe.kpi || EMPTY.kpi;
  const financials = safe.financials || {};
  const gmroi = safe.gmroi || {};
  const turnover = safe.turnover || {};
  const breakEven = safe.break_even || EMPTY.break_even;
  const eoq = safe.eoq || [];
  const seasonality = safe.seasonality || EMPTY.seasonality;
  const expenses = safe.expenses || EMPTY.expenses;

  const seasonData = useMemo(
    () => ((seasonality.index || []).map((m) => ({ label: m.label, value: m.value ?? 0 }))),
    [seasonality.index]
  );

  const insights = useMemo(() => (loading || error ? [] : buildInsights(safe)), [safe, loading, error]);

  return (
    <div className="reports-page">
      {/* ── Header ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--reports" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 17v-3" />
              <path d="M12 17v-6" />
              <path d="M16 17v-4" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Business Reports</h1>
            <p className="analytics-subtitle">
              KPI health, GMROI, inventory turnover, break-even, and replenishment planning
            </p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>
              <span className="analytics-summary-label">Generated</span>
              <span className="analytics-summary-value">{formatGenerated(safe.generated_at)}</span>
            </span>
          </span>
          <button type="button" className="rep-download-btn" onClick={() => downloadReportCsv(safe)} disabled={loading || !!error}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button type="button" className="ai-refresh-btn" onClick={fetchReports} disabled={loading}>
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <p className="analytics-empty-title">Crunching your reports…</p>
          <p className="analytics-empty-sub">Scoring business health across profit, stock, and turnover.</p>
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
          <button type="button" className="ai-retry-btn" onClick={fetchReports}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <KpiSection kpi={kpi} />
          {insights.length > 0 && <InsightsStrip insights={insights} />}
          <FinancialSection financials={financials} gmroi={gmroi} turnover={turnover} />
          <BreakEvenSection breakEven={breakEven} revenue={financials.revenue} />
          <EoqSection eoq={eoq} />
          <SeasonalitySection seasonality={seasonality} seasonData={seasonData} />
          <ExpenseParetoSection expenses={expenses} />
        </>
      )}
    </div>
  );
}

export default ReportsPage;
