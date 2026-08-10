import { useCallback, useEffect, useState } from "react";
import MonthlyView from "./MonthlyView";
import TabBar from "./TabBar";
import YearlyView from "./YearlyView";
import {
  useAvailableYears,
  useOverallTotal,
  useProductColorMap,
  useSortedYears,
  useYearTotalSales,
} from "./selectors";

const VIEW_TABS = [
  ["monthly", "Monthly"],
  ["yearly", "Yearly"],
];

function AnalyticsPage({ data, onBack }) {
  const [analytics, setAnalytics] = useState({ daily: {}, monthly: {}, yearly: {} });
  const [activeView, setActiveView] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [data, fetchAnalytics]);

  const openMonthly = (year) => {
    setSelectedYear(year);
    setActiveView("monthly");
  };

  const availableYears = useAvailableYears(analytics, selectedYear);
  const yearTotalSales = useYearTotalSales(analytics, selectedYear);
  const sortedYears = useSortedYears(analytics, availableYears);
  const overallTotal = useOverallTotal(sortedYears);
  const colorMap = useProductColorMap(analytics, data?.products);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Sales Analytics</h1>
          <p className="analytics-subtitle">Comprehensive sales insights for your business</p>
        </div>
        <button type="button" className="analytics-back-btn" onClick={onBack}>Back</button>
      </div>

      <TabBar tabs={VIEW_TABS} active={activeView} onChange={setActiveView} />

      {activeView === "monthly" && (
        <MonthlyView
          analytics={analytics}
          selectedYear={selectedYear}
          availableYears={availableYears}
          yearTotal={yearTotalSales}
          onYearChange={setSelectedYear}
          colorMap={colorMap}
        />
      )}
      {activeView === "yearly" && (
        <YearlyView years={sortedYears} total={overallTotal} onOpenYear={openMonthly} colorMap={colorMap} />
      )}
    </div>
  );
}

export default AnalyticsPage;