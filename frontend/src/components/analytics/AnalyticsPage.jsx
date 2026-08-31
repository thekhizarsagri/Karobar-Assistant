import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthlyBarChart } from "./Charts";
import MonthlyView from "./MonthlyView";
import TabBar from "./TabBar";
import YearlyView from "./YearlyView";
import { getProductColor, SHORT_MONTHS } from "./constants";
import { formatStat } from "../../utils/formatNumber";
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

function AnalyticsPage({ data }) {
  const [analytics, setAnalytics] = useState({ daily: {}, monthly: {}, yearly: {} });
  const [activeView, setActiveView] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const productNames = useMemo(() => {
    const names = new Set(analytics.product_order || []);
    Object.values(analytics.monthly || {}).forEach((monthData) => {
      Object.keys(monthData).forEach((name) => names.add(name));
    });
    (data?.products || []).forEach((p) => {
      if (p.name) names.add(p.name);
    });
    return Array.from(names);
  }, [analytics.monthly, analytics.product_order, data?.products]);

  const productTrend = useMemo(() => {
    if (!selectedProduct) return [];
    return Array.from({ length: 12 }, (_, m) => {
      const key = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      return {
        label: SHORT_MONTHS[m],
        value: (analytics.monthly[key] || {})[selectedProduct] || 0,
      };
    });
  }, [analytics.monthly, selectedProduct, selectedYear]);

  const productTotal = useMemo(
    () => productTrend.reduce((sum, d) => sum + d.value, 0),
    [productTrend]
  );
  const productIndex = productNames.indexOf(selectedProduct);
  const productColor = getProductColor(productIndex >= 0 ? productIndex : 0);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Sales Analytics</h1>
          <p className="analytics-subtitle">Comprehensive sales insights for your business</p>
        </div>
      </div>

      {productNames.length > 0 && (
        <div className="history-panel">
          <div className="history-product-buttons">
            {productNames.map((name, index) => {
              const color = colorMap[name] || getProductColor(index);
              const active = selectedProduct === name;
              return (
                <button
                  key={name}
                  type="button"
                  className={`history-product-btn ${active ? "history-product-btn--active" : ""}`}
                  style={{
                    "--product-color": color,
                    borderColor: color,
                  }}
                  onClick={() => setSelectedProduct(active ? null : name)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="chart-section" style={{ maxWidth: "820px", padding: "20px" }}>
          <MonthlyBarChart
            data={productTrend}
            height={200}
            barColor={productColor}
            title={`${selectedProduct} — Sales Trend`}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
          />
          <p className="product-trend-total">Total: {formatStat(productTotal)} units</p>
        </div>
      )}

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