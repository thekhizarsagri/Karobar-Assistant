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
  const [productQuery, setProductQuery] = useState("");

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

  const visibleProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return productNames;
    return productNames.filter((n) => n.toLowerCase().includes(q));
  }, [productNames, productQuery]);

  const bestMonth = useMemo(() => {
    let best = { label: "—", value: 0 };
    for (let m = 0; m < 12; m++) {
      const key = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      const total = Object.values((analytics.monthly || {})[key] || {}).reduce((a, b) => a + b, 0);
      if (total > best.value) best = { label: SHORT_MONTHS[m], value: total };
    }
    return best;
  }, [analytics.monthly, selectedYear]);

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

  const headlineTotal = activeView === "monthly" ? yearTotalSales : overallTotal;
  const headlineSub = activeView === "monthly" ? `in ${selectedYear}` : `across ${sortedYears.length} year${sortedYears.length === 1 ? "" : "s"}`;

  return (
    <div className="analytics-page">
      {/* ── Header (inventory / sales style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M6 21v-7" />
              <path d="M11 21V8" />
              <path d="M16 21v-11" />
              <path d="M21 21V5" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Sales Analytics</h1>
            <p className="analytics-subtitle">Comprehensive sales insights for your business</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
            <span>
              <span className="analytics-summary-label">
                {activeView === "monthly" ? `${selectedYear} total` : "All-time total"}
              </span>
              <span className="analytics-summary-value">
                {formatStat(headlineTotal)} units {headlineSub}
              </span>
            </span>
          </span>
          <TabBar tabs={VIEW_TABS} active={activeView} onChange={setActiveView} />
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="analytics-stats">
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--green" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className="analytics-stat-value">{formatStat(yearTotalSales)}</strong>
            <span className="analytics-stat-label">Units sold in {selectedYear}</span>
            <span className="analytics-stat-sub">Jan – Dec total</span>
          </span>
        </div>
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--blue" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className="analytics-stat-value">{productNames.length}</strong>
            <span className="analytics-stat-label">Products tracked</span>
            <span className="analytics-stat-sub">With sales history</span>
          </span>
        </div>
        <div className="analytics-stat">
          <span className="analytics-stat-icon analytics-stat-icon--amber" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="analytics-stat-body">
            <strong className="analytics-stat-value">
              {bestMonth.value > 0 ? `${bestMonth.label}` : "—"}
              {bestMonth.value > 0 && (
                <span className="analytics-stat-inline"> · {formatStat(bestMonth.value)}</span>
              )}
            </strong>
            <span className="analytics-stat-label">Best month in {selectedYear}</span>
            <span className="analytics-stat-sub">
              {bestMonth.value > 0 ? "Highest monthly sales" : "No sales recorded yet"}
            </span>
          </span>
        </div>
      </div>

      {/* ── Product filter ── */}
      {productNames.length > 0 && (
        <section className="analytics-section analytics-products-card">
          <div className="analytics-section-head">
            <span className="analytics-section-icon analytics-section-icon--products" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
                <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" stroke="none" />
              </svg>
            </span>
            <span className="analytics-section-titles">
              <h2 className="analytics-section-title">Products</h2>
              <p className="analytics-section-sub">
                {selectedProduct
                  ? `Showing trend for ${selectedProduct} — tap again to clear`
                  : "Tap a product to see its monthly trend"}
              </p>
            </span>
            <label className="analytics-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                className="analytics-search"
                placeholder="Search products..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                aria-label="Search products"
              />
            </label>
          </div>
          {visibleProducts.length === 0 ? (
            <p className="analytics-products-empty">No products match “{productQuery}”.</p>
          ) : (
            <div className="analytics-product-buttons">
              {visibleProducts.map((name) => {
                const index = productNames.indexOf(name);
                const color = colorMap[name] || getProductColor(index);
                const active = selectedProduct === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`analytics-product-btn ${active ? "analytics-product-btn--active" : ""}`}
                    style={{ "--product-color": color }}
                    onClick={() => setSelectedProduct(active ? null : name)}
                    aria-pressed={active}
                  >
                    <span className="analytics-product-dot" aria-hidden="true" />
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Product trend ── */}
      {selectedProduct && (
        <section className="analytics-section analytics-trend-card">
          <div className="analytics-trend-body">
            <MonthlyBarChart
              data={productTrend}
              height={140}
              barColor={productColor}
              title={`${selectedProduct} — Sales Trend`}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onYearChange={setSelectedYear}
            />
            <p className="product-trend-total">
              Total: <strong>{formatStat(productTotal)} units</strong> in {selectedYear}
            </p>
          </div>
        </section>
      )}

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
