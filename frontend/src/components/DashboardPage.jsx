import { useEffect, useState } from "react";
import HistoryTab from "./dashboard/HistoryTab";
import PageHeader from "./dashboard/PageHeader";
import ProductHistoryDetail from "./dashboard/ProductHistoryDetail";
import RecordSalesTab from "./dashboard/RecordSalesTab";
import StatCards from "./dashboard/StatCards";
import StockTab from "./dashboard/StockTab";
import WorkspaceTabs from "./dashboard/WorkspaceTabs";
import AnalyticsPage from "./analytics/AnalyticsPage";
import { postSale, postStock } from "./dashboard/api";

const TABS = [
  ["sales", "Record sales"],
  ["history", "Product history"],
  ["analytics", "Analytics"],
];

function DashboardPage({ data, onBack }) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [activeTab, setActiveTab] = useState("sales");
  const [stockAlert, setStockAlert] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyDetailProduct, setHistoryDetailProduct] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  useEffect(() => {
    setSummary(data);
    setSalesSummary(data?.sales_summary || null);
  }, [data]);

  const notify = (message) => setStockAlert(message);
  const updateProducts = (products) => setSummary((prev) => ({ ...prev, products }));

  const submitSale = async (productName, quantity, period, entryDate, entryType = "auto") => {
    try {
      const result = await postSale(productName, quantity, period, entryDate, entryType);
      if (result.error === "out_of_stock") {
        notify(`⚠️ Cannot sell ${productName} — no stock available. Please add stock first.`);
        return;
      }
      if (result.error === "insufficient_stock") {
        notify(`⚠️ ${result.message}`);
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

  const renderTab = () => {
    switch (activeTab) {
      case "sales":
        return <RecordSalesTab products={summary?.products || []} notify={notify} submitSale={submitSale} />;
      case "history":
        return (
          <HistoryTab
            salesSummary={salesSummary}
            products={summary?.products || []}
            onOpenProduct={setHistoryDetailProduct}
          />
        );
      default:
        return (
          <StockTab
            products={summary?.products || []}
            notify={notify}
            addStock={addStock}
            isModalOpen={stockModalOpen}
            onCloseModal={() => setStockModalOpen(false)}
          />
        );
    }
  };

  if (analyticsOpen) {
    return (
      <div className="demo-page">
        <div className="demo-panel">
          <AnalyticsPage data={summary} onBack={() => setAnalyticsOpen(false)} />
        </div>
      </div>
    );
  }

  if (historyDetailProduct) {
    return (
      <div className="demo-page">
        <div className="demo-panel">
          <ProductHistoryDetail
            productName={historyDetailProduct}
            salesSummary={salesSummary}
            products={summary?.products || []}
            onBack={() => setHistoryDetailProduct(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="demo-page">
      <div className="demo-panel">
        <PageHeader
          ownerName={summary?.owner_name}
          greeting={getGreeting()}
          onBack={onBack}
        />

        {stockAlert && (
          <div className="stock-alert">
            <span>{stockAlert}</span>
            <button type="button" className="stock-alert-dismiss" onClick={() => setStockAlert(null)}>Dismiss</button>
          </div>
        )}

        <StatCards
          totalStock={(summary?.products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0)}
          grossProfit={summary?.metrics?.gross_profit ?? 0}
          totalExpenses={summary?.metrics?.total_expenses ?? 0}
          onStockClick={() => setActiveTab("stock")}
          onAddStock={() => { setActiveTab("stock"); setStockModalOpen(true); }}
        />

        <div className="demo-section">
          <div className="section-heading">
            <span className="step-pill">Sales</span>
            <h2>Sales workspace</h2>
          </div>

          <WorkspaceTabs
            tabs={TABS}
            active={activeTab}
            onChange={(tab) => {
              if (tab === "analytics") {
                setAnalyticsOpen(true);
                return;
              }
              setActiveTab(tab);
            }}
          />

          {renderTab()}
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