import { useCallback, useEffect, useMemo, useState } from "react";
import KpiSection from "./KpiSection";
import FinancialSection from "./FinancialSection";
import BreakEvenSection from "./BreakEvenSection";
import EoqSection from "./EoqSection";
import SeasonalitySection from "./SeasonalitySection";
import ExpenseParetoSection from "./ExpenseParetoSection";

const EMPTY = {
  kpi: { score: 0, label: "Needs attention", profit_score: 0, stock_score: 0, turnover_score: 0 },
  financials: {},
  gmroi: {},
  turnover: {},
  break_even: { products: [] },
  eoq: [],
  seasonality: { index: [], has_data: false },
  expenses: { pareto: [] },
};

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
      setData(await res.json());
    } catch (err) {
      setError(err.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const seasonData = useMemo(
    () => (data.seasonality.index || []).map((m) => ({ label: m.label, value: m.value ?? 0 })),
    [data.seasonality.index]
  );

  return (
    <div className="reports-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Business Reports</h1>
          <p className="analytics-subtitle">
            KPI health, GMROI, inventory turnover, break-even, and replenishment planning
          </p>
        </div>
        <button type="button" className="analytics-back-btn" onClick={fetchReports}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <p>Crunching your reports…</p>
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
          <KpiSection kpi={data.kpi} />
          <FinancialSection financials={data.financials} gmroi={data.gmroi} turnover={data.turnover} />
          <BreakEvenSection breakEven={data.break_even} />
          <EoqSection eoq={data.eoq} />
          <SeasonalitySection seasonality={data.seasonality} seasonData={seasonData} />
          <ExpenseParetoSection expenses={data.expenses} />
        </>
      )}
    </div>
  );
}

export default ReportsPage;
