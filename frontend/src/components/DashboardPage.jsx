import { useEffect, useState } from "react";
import HistoryTab from "./dashboard/HistoryTab";
import AlertsCard from "./dashboard/AlertsCard";
import AutomationPage from "./dashboard/AutomationPage";
import PageHeader from "./dashboard/PageHeader";
import SettingsPage from "./dashboard/SettingsPage";
import ProductHistoryDetail from "./dashboard/ProductHistoryDetail";
import RecordSalesTab from "./dashboard/RecordSalesTab";
import Sidebar from "./dashboard/Sidebar";
import StatCards from "./dashboard/StatCards";
import StockModal from "./dashboard/StockModal";
import StockOverviewModal from "./dashboard/StockOverviewModal";
import useStockAutomation from "./dashboard/useStockAutomation";
import AnalyticsPage from "./analytics/AnalyticsPage";
import AiInsightsPage from "./analytics/AiInsightsPage";
import ForecastingPage from "./analytics/ForecastingPage";
import InventoryPage from "./inventory/InventoryPage";
import ReportsPage from "./reports/ReportsPage";
import { MonthlyBarChart } from "./analytics/Charts";
import { SHORT_MONTHS } from "./analytics/constants";
import { postSale, postStock, addNotification } from "./dashboard/api";

const NOTIFY_TITLES = {
  error: "Action failed",
  success: "Success",
  warning: "Heads up",
  info: "Notification",
};

function DashboardPage({ data, onEditForm, onLogout }) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockOverviewOpen, setStockOverviewOpen] = useState(false);
  const [historyDetailProduct, setHistoryDetailProduct] = useState(null);
  const [rules, setRules] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: {}, monthly: {}, yearly: {} });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setAnalytics(await res.json());
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, [summary, salesSummary]);

  // Determine active year with sales data, or default to current year
  const availableYears = Object.keys(analytics.monthly || {})
    .map((m) => parseInt(m.split("-")[0], 10));
  const uniqueYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);
  const defaultYear = uniqueYears.length ? uniqueYears[0] : new Date().getFullYear();
  const [activeYear, setActiveYear] = useState(defaultYear);
  useEffect(() => {
    setActiveYear(defaultYear);
  }, [defaultYear]);

  const trendData = Array.from({ length: 12 }, (_, m) => {
    const monthKey = `${activeYear}-${String(m + 1).padStart(2, "0")}`;
    const monthData = analytics.monthly[monthKey] || {};
    const monthTotal = Object.values(monthData).reduce((a, b) => a + b, 0);
    return {
      label: SHORT_MONTHS[m],
      value: monthTotal,
      details: monthData,
    };
  });

  useEffect(() => {
    setSummary(data);
    setSalesSummary(data?.sales_summary || null);
  }, [data]);

  const notify = async (message, type = "info") => {
    try {
      await addNotification({ type, title: NOTIFY_TITLES[type] || NOTIFY_TITLES.info, message });
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      console.error(error);
    }
  };
  const updateProducts = (products) => setSummary((prev) => ({ ...prev, products }));

  const submitSale = async (productName, quantity, period, entryDate, entryType = "auto") => {
    try {
      const result = await postSale(productName, quantity, period, entryDate, entryType);
      if (result.error === "out_of_stock" || result.error === "insufficient_stock") {
        window.dispatchEvent(new CustomEvent("alerts:updated"));
        return;
      }
      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({
        ...prev,
        products: result.products ?? prev.products,
        metrics: result.metrics ?? prev.metrics,
      }));
      window.dispatchEvent(new CustomEvent("alerts:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const addStock = async (productName, quantity, date) => {
    try {
      const result = await postStock(productName, quantity, date);
      if (result.sales_summary) setSalesSummary(result.sales_summary);
      if (result.products) updateProducts(result.products);
      window.dispatchEvent(new CustomEvent("alerts:updated"));
      return result;
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const { fireRule, handleRemoveRule } = useStockAutomation(rules, setRules, addStock, notify);

  const handleStockSubmit = async (payload) => {
    setStockModalOpen(false);
    const quantity = Number(payload.quantity || 0);
    if (!payload.productName || quantity <= 0) return;

    if (payload.mode === "automatic") {
      const newRule = {
        id: Date.now(),
        productName: payload.productName,
        quantity,
        dayOfMonth: Number(payload.dayOfMonth || 1),
        hour: payload.hour,
        minute: payload.minute,
        ampm: payload.ampm,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
      notify(`Automatic add saved: ${quantity} units of ${payload.productName} on day ${newRule.dayOfMonth} of every month at ${payload.hour}:${payload.minute} ${payload.ampm}.`, "info");
      return;
    }

    await addStock(payload.productName, quantity, payload.date || "");
    notify(`Added ${quantity} units to ${payload.productName} on ${new Date((payload.date || new Date().toISOString().split("T")[0]) + "T00:00:00").toLocaleDateString()}.`, "success");
  };

  const handleNav = (nav) => {
    setActiveNav(nav);
    setHistoryDetailProduct(null);
    const scrollable = document.querySelector(".page-transition-slide:not(.slide-hidden)");
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  return (
    <div className="demo-page demo-page--dashboard">
      <div className="app-layout">
        <Sidebar
          active={activeNav}
          onSelect={handleNav}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        <div className="app-main">
          {activeNav === "inventory" ? (
            <InventoryPage products={summary?.products || []} onSubmit={handleStockSubmit} />
          ) : activeNav === "sales" ? (
            <AnalyticsPage data={summary} onBack={() => setActiveNav("dashboard")} />
          ) : activeNav === "ai" ? (
            <AiInsightsPage data={summary} onBack={() => setActiveNav("dashboard")} />
          ) : activeNav === "forecast" ? (
            <ForecastingPage data={summary} onBack={() => setActiveNav("dashboard")} />
          ) : activeNav === "history" ? (
            historyDetailProduct ? (
              <ProductHistoryDetail
                productName={historyDetailProduct}
                salesSummary={salesSummary}
                products={summary?.products || []}
                onBack={() => setHistoryDetailProduct(null)}
                onClearHistory={async () => {
                  try {
                    const res = await fetch("/api/dashboard");
                    if (res.ok) {
                      const updated = await res.json();
                      if (updated.sales_summary) setSalesSummary(updated.sales_summary);
                      if (updated.metrics) setSummary((prev) => ({ ...prev, metrics: updated.metrics }));
                    }
                  } catch (err) {
                    console.error("Failed to refresh after clear:", err);
                  }
                }}
              />
            ) : (
              <HistoryTab
                salesSummary={salesSummary}
                products={summary?.products || []}
                onOpenProduct={setHistoryDetailProduct}
              />
            )
          ) : activeNav === "automation" ? (
            <AutomationPage
              products={summary?.products || []}
              rules={rules}
              onRun={fireRule}
              onRemove={handleRemoveRule}
              onSubmit={handleStockSubmit}
            />
          ) : activeNav === "reports" ? (
            <ReportsPage />
          ) : activeNav === "settings" ? (
            <SettingsPage />
          ) : (
            <>
              <PageHeader
                ownerName={summary?.owner_name}
                greeting={getGreeting()}
                onEditForm={onEditForm}
                onLogout={onLogout}
              />

              <div className="dashboard-row">
                <StatCards
                  totalStock={(summary?.products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0)}
                  grossProfit={summary?.metrics?.gross_profit ?? 0}
                  netProfit={summary?.metrics?.net_profit ?? 0}
                  totalExpenses={summary?.metrics?.total_expenses ?? 0}
                  onStockOverview={async () => {
                    try {
                      const res = await fetch("/api/dashboard");
                      if (res.ok) {
                        const updated = await res.json();
                        if (updated.products) updateProducts(updated.products);
                        if (updated.sales_summary) setSalesSummary(updated.sales_summary);
                      }
                    } catch {}
                    setStockOverviewOpen(true);
                  }}
                  onAddStock={() => setStockModalOpen(true)}
                >
                  <RecordSalesTab products={summary?.products || []} submitSale={submitSale} />
                </StatCards>

                <AlertsCard />
              </div>

              {/* Smaller sales trend graph on the main dashboard */}
              <div className="chart-section" style={{ maxWidth: "820px", padding: "20px", marginTop: "10px" }}>
                {uniqueYears.length > 0 ? (
                  <MonthlyBarChart
                    data={trendData}
                    height={140}
                    title={`Sales Trend (${activeYear})`}
                    selectedYear={activeYear}
                    availableYears={uniqueYears}
                    onYearChange={setActiveYear}
                  />
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
                    No sales recorded yet for this period.
                  </div>
                )}
              </div>

              <StockModal
                products={summary?.products || []}
                isOpen={stockModalOpen}
                onClose={() => setStockModalOpen(false)}
                onSubmit={handleStockSubmit}
              />

              <StockOverviewModal
                products={summary?.products || []}
                isOpen={stockOverviewOpen}
                onClose={() => setStockOverviewOpen(false)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  if (hour >= 18 && hour < 22) return "Good Evening";
  return "Hello";
}

export default DashboardPage;