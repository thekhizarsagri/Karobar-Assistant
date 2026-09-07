import { useState } from "react";
import HistoryTab from "./dashboard/HistoryTab";
import AlertsCard from "./dashboard/AlertsCard";
import AutomationPage from "./dashboard/AutomationPage";
import EditProfilePage from "./dashboard/EditProfilePage";
import PageHeader from "./dashboard/PageHeader";
import SettingsPage from "./dashboard/SettingsPage";
import ProductHistoryDetail from "./dashboard/ProductHistoryDetail";
import RecordSalesTab from "./dashboard/RecordSalesTab";
import AdjustSalesTab from "./dashboard/AdjustSalesTab";
import Sidebar from "./dashboard/Sidebar";
import StatCards from "./dashboard/StatCards";
import StockModal from "./dashboard/StockModal";
import StockOverviewModal from "./dashboard/StockOverviewModal";
import MonthlyExpensesPage from "./dashboard/MonthlyExpensesPage";
import useStockAutomation from "./dashboard/useStockAutomation";
import useDashboardState from "./dashboard/useDashboardState";
import AnalyticsPage from "./analytics/AnalyticsPage";
import AiInsightsPage from "./analytics/AiInsightsPage";
import ForecastingPage from "./analytics/ForecastingPage";
import InventoryPage from "./inventory/InventoryPage";
import ReportsPage from "./reports/ReportsPage";
import { MonthlyBarChart } from "./analytics/Charts";
import { SHORT_MONTHS } from "./analytics/constants";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  if (hour >= 18 && hour < 22) return "Good Evening";
  return "Hello";
}

function DashboardPage({ data, onEditForm, onLogout }) {
  const {
    summary, setSummary, salesSummary, setSalesSummary,
    rules, setRules, analytics, activeYear, setActiveYear, uniqueYears,
    notify, updateProducts, submitSale, removeSaleHandler, addStock,
  } = useDashboardState(data);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockOverviewOpen, setStockOverviewOpen] = useState(false);
  const [historyDetailProduct, setHistoryDetailProduct] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

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
    setEditingProfile(false);
    const scrollable = document.querySelector(".page-transition-slide:not(.slide-hidden)");
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const trendData = Array.from({ length: 12 }, (_, m) => {
    const monthKey = `${activeYear}-${String(m + 1).padStart(2, "0")}`;
    const monthData = analytics?.monthly?.[monthKey] || {};
    const monthTotal = Object.values(monthData).reduce((a, b) => a + b, 0);
    return { label: SHORT_MONTHS[m], value: monthTotal, details: monthData };
  });

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
          {editingProfile ? (
            <EditProfilePage
              profile={summary}
              onBack={() => setEditingProfile(false)}
              onSuccess={(updated) => {
                setSummary(updated);
                setEditingProfile(false);
                notify("Profile updated successfully.", "success");
              }}
            />
          ) : activeNav === "inventory" ? (
            <InventoryPage products={summary?.products || []} onSubmit={handleStockSubmit} />
          ) : activeNav === "sales" ? (
            <AnalyticsPage data={summary} onBack={() => setActiveNav("dashboard")} />
          ) : activeNav === "editSales" ? (
            <AdjustSalesTab
              products={summary?.products || []}
              submitSale={submitSale}
              removeSale={removeSaleHandler}
            />
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
          ) : activeNav === "expenses" ? (
            <MonthlyExpensesPage
              expenses={summary?.expenses || []}
              metrics={summary?.metrics || {}}
              nextDeductions={summary?.next_deductions || []}
              recentDeductions={summary?.recent_deductions || []}
              currency={summary?.currency || "₹"}
              onRefresh={async () => {
                try {
                  const res = await fetch("/api/dashboard");
                  if (res.ok) {
                    const updated = await res.json();
                    setSummary(updated);
                    if (updated.sales_summary) setSalesSummary(updated.sales_summary);
                  }
                } catch {}
              }}
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
                onEditProfile={() => setEditingProfile(true)}
                onLogout={onLogout}
              />

              <div className="dashboard-row">
                <StatCards
                  totalStock={(summary?.products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0)}
                  grossProfit={summary?.metrics?.gross_profit ?? 0}
                  netProfit={summary?.metrics?.net_profit ?? 0}
                  availableBalance={summary?.metrics?.available_balance ?? 0}
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

export default DashboardPage;
