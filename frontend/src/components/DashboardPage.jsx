import { useEffect, useRef, useState } from "react";
import HistoryTab from "./dashboard/HistoryTab";
import AlertsCard from "./dashboard/AlertsCard";
import AutomationPage from "./dashboard/AutomationPage";
import PageHeader from "./dashboard/PageHeader";
import ProductHistoryDetail from "./dashboard/ProductHistoryDetail";
import RecordSalesTab from "./dashboard/RecordSalesTab";
import Sidebar from "./dashboard/Sidebar";
import StatCards from "./dashboard/StatCards";
import StockModal from "./dashboard/StockModal";
import StockOverviewModal from "./dashboard/StockOverviewModal";
import AnalyticsPage from "./analytics/AnalyticsPage";
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
  const firedRef = useRef({});

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
      if (result.error === "out_of_stock") {
        notify(`⚠️ Cannot sell ${productName} — no stock available. Please add stock first.`, "error");
        return;
      }
      if (result.error === "insufficient_stock") {
        notify(`⚠️ ${result.message}`, "error");
        return;
      }
      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({
        ...prev,
        ai_insights: result.ai_insights,
        products: result.products ?? prev.products,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const addStock = async (productName, quantity) => {
    try {
      const result = await postStock(productName, quantity);
      if (result.sales_summary) setSalesSummary(result.sales_summary);
      if (result.products) updateProducts(result.products);
      return result;
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const handleStockSubmit = (payload) => {
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
      notify(`🗓️ Automatic add saved: ${quantity} units of ${payload.productName} on day ${newRule.dayOfMonth} of every month at ${payload.hour}:${payload.minute} ${payload.ampm}.`, "info");
      return;
    }

    addStock(payload.productName, quantity);
    notify(`✅ Added ${quantity} units to ${payload.productName} on ${new Date(payload.date + "T00:00:00").toLocaleDateString()}.`, "success");
  };

  const to24Hour = (hour12Str, ampm) => {
    let h = parseInt(hour12Str, 10);
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return h;
  };

  const fireRule = (rule) => {
    const timeString = `${rule.hour}:${rule.minute} ${rule.ampm}`;
    addStock(rule.productName, rule.quantity);
    notify(`✅ Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString}.`, "success");
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const fireKeyBase = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      setRules((currentRules) => {
        currentRules.forEach((rule) => {
          const matchesDay = now.getDate() === rule.dayOfMonth;
          const matchesMinute = now.getMinutes() === parseInt(rule.minute, 10);
          const matchesHour = now.getHours() === to24Hour(rule.hour, rule.ampm);
          const fireKey = `${fireKeyBase}-${rule.id}`;
          if (matchesDay && matchesHour && matchesMinute && !firedRef.current[fireKey]) {
            firedRef.current[fireKey] = true;
            fireRule(rule);
          }
        });
        return currentRules;
      });
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRemoveRule = (ruleId) => setRules((prev) => prev.filter((r) => r.id !== ruleId));

  const handleNav = (nav) => {
    setActiveNav(nav);
    setHistoryDetailProduct(null);
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
          {activeNav === "sales" ? (
            <AnalyticsPage data={summary} onBack={() => setActiveNav("dashboard")} />
          ) : activeNav === "history" ? (
            historyDetailProduct ? (
              <ProductHistoryDetail
                productName={historyDetailProduct}
                salesSummary={salesSummary}
                products={summary?.products || []}
                onBack={() => setHistoryDetailProduct(null)}
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
                  onStockOverview={() => setStockOverviewOpen(true)}
                  onAddStock={() => setStockModalOpen(true)}
                >
                  <RecordSalesTab products={summary?.products || []} notify={notify} submitSale={submitSale} />
                </StatCards>

                <AlertsCard />
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