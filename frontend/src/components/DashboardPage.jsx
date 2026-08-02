import { useEffect, useState } from "react";

const salesPeriods = ["day", "week", "month", "year"];

function DashboardPage({ data, onBack }) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [pressedProduct, setPressedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("Ask me about sales, stock, or profit.");
  const [manualForm, setManualForm] = useState({
    productName: data?.products?.[0]?.name || "",
    quantity: 1,
    entryDate: new Date().toISOString().split("T")[0],
    entryMonth: new Date().toISOString().slice(0, 7),
    entryYear: new Date().getFullYear().toString(),
  });

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return {
        label: "Good Morning",
        detail: "",
      };
    }

    if (hour < 17) {
      return {
        label: "Good Afternoon",
        detail: "",
      };
    }

    if (hour < 21) {
      return {
        label: "Good Evening",
        detail: "",
      };
    }

    return {
      label: "Good Night",
      detail: "",
    };
  };

  useEffect(() => {
    setSummary(data);
    setSalesSummary(data?.sales_summary || null);
    if (data?.products?.length) {
      setManualForm((prev) => ({
        ...prev,
        productName: prev.productName || data.products[0].name,
      }));
    }
  }, [data]);

  const submitSale = async (productName, quantity, period, entryDate) => {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          quantity,
          period,
          entryDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save sales entry");
      }

      const result = await response.json();
      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({ ...prev, ai_insights: result.ai_insights }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickSale = (productName) => {
    setPressedProduct(productName);
    window.clearTimeout(window.__saleFlashTimeout);
    window.__saleFlashTimeout = window.setTimeout(() => {
      setPressedProduct(null);
    }, 300);
    submitSale(productName, 1, selectedPeriod, manualForm.entryDate);
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const entryValue =
      selectedPeriod === "month"
        ? manualForm.entryMonth
        : selectedPeriod === "year"
          ? manualForm.entryYear
          : manualForm.entryDate;

    submitSale(manualForm.productName, Number(manualForm.quantity || 1), selectedPeriod, entryValue);
  };

  const askAssistant = async (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact assistant");
      }

      const result = await response.json();
      setChatResponse(result.reply);
      setChatMessage("");
    } catch (error) {
      setChatResponse("Assistant is unavailable right now. Please try again in a moment.");
      console.error(error);
    }
  };

  if (!summary) {
    return null;
  }

  const greeting = getGreeting();
  const productHistory = salesSummary?.product_history || {};
  const historyEntries = Object.values(productHistory);

  return (
    <div className="demo-page">
      <div className="demo-panel">
        <div className="demo-header">
          <div className="greeting-block">
            <h1 className="dashboard-greeting">
              {greeting.label}, {summary.owner_name || "Business Owner"}!
            </h1>
          </div>
          <button type="button" className="demo-back-btn" onClick={onBack}>
            Back to Setup
          </button>
        </div>

        <div className="demo-summary-row">
          <div className="demo-stat">
            <span className="demo-stat-value">{summary.metrics?.net_profit ?? 0}</span>
            <span className="demo-stat-label">Net Profit</span>
          </div>
          <div className="demo-stat">
            <span className="demo-stat-value">{summary.metrics?.gross_profit ?? 0}</span>
            <span className="demo-stat-label">Gross Profit</span>
          </div>
          <div className="demo-stat">
            <span className="demo-stat-value">{summary.metrics?.total_expenses ?? 0}</span>
            <span className="demo-stat-label">Monthly Expenses</span>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-heading">
            <span className="step-pill">Sales</span>
            <h2>Sales workspace</h2>
          </div>

          <div className="sales-tabs">
            <button type="button" className={`tab-btn ${activeTab === "sales" ? "active" : ""}`} onClick={() => setActiveTab("sales")}>
              Record sales
            </button>
            <button type="button" className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
              Product history
            </button>
          </div>

          {activeTab === "sales" ? (
            <div className="sales-panel">
              <div className="sales-card">
                <h3>Quick product sales</h3>
                <p>Tap a product button to record one sale instantly.</p>
                <div className="sales-buttons">
                  {(summary.products || []).map((product) => (
                    <button
                      key={product.name}
                      type="button"
                      className={`sales-product-btn ${pressedProduct === product.name ? "clicked" : ""}`}
                      onClick={() => handleQuickSale(product.name)}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sales-card">
                <h3>Manual entry</h3>
                <div className="sales-periods">
                  {salesPeriods.map((period) => (
                    <button
                      key={period}
                      type="button"
                      className={`frequency-pill ${selectedPeriod === period ? "active" : ""}`}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                <form className="sales-form" onSubmit={handleManualSubmit}>
                  <label className="form-field">
                    <span>Product</span>
                    <select
                      value={manualForm.productName}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, productName: event.target.value }))}
                    >
                      {(summary.products || []).map((product) => (
                        <option key={product.name} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={manualForm.quantity}
                      onChange={(event) => setManualForm((prev) => ({ ...prev, quantity: event.target.value }))}
                    />
                  </label>

                  <label className="form-field">
                    <span>{selectedPeriod === "month" ? "Month & Year" : selectedPeriod === "year" ? "Year" : "Date"}</span>
                    {selectedPeriod === "month" ? (
                      <input
                        type="month"
                        value={manualForm.entryMonth}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, entryMonth: event.target.value }))}
                      />
                    ) : selectedPeriod === "year" ? (
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={manualForm.entryYear}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, entryYear: event.target.value }))}
                      />
                    ) : (
                      <input
                        type="date"
                        value={manualForm.entryDate}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, entryDate: event.target.value }))}
                      />
                    )}
                  </label>

                  <button type="submit" className="register-btn">
                    Save sales
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="history-panel">
              <div className="history-summary">
                <p>Total tracked sales: {salesSummary?.total_units ?? 0}</p>
                <p>Products recorded: {historyEntries.length}</p>
              </div>
              <div className="history-list">
                {historyEntries.map((product) => (
                  <div key={product.product_name} className="history-card">
                    <div className="history-card-header">
                      <div>
                        <h3>{product.product_name}</h3>
                        <p>Total sold: {product.total_quantity}</p>
                      </div>
                      <span className="history-pill">{(product.entries || []).length} entries</span>
                    </div>
                    <ul className="history-entry-list">
                      {(product.entries || []).map((entry, index) => (
                        <li key={`${product.product_name}-${index}`}>
                          <strong>{entry.quantity}</strong> units • {entry.period} • {entry.entry_date || "No date"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
