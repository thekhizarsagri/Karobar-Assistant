import { useCallback, useEffect, useRef, useState } from "react";

const salesPeriods = ["day", "week", "month", "year"];

function DashboardPage({ data, onBack }) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [pressedProduct, setPressedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [manualForm, setManualForm] = useState({
    productName: data?.products?.[0]?.name || "",
    quantity: 1,
    entryDate: new Date().toISOString().split("T")[0],
    entryMonth: new Date().toISOString().slice(0, 7),
    entryYear: new Date().getFullYear().toString(),
  });
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockMode, setStockMode] = useState("oneTime");
  const [stockForm, setStockForm] = useState({
    productName: data?.products?.[0]?.name || "",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
    dayOfMonth: 1,
    hour: "09",
    minute: "00",
    ampm: "AM",
  });
  const [stockAlert, setStockAlert] = useState(null);
  const [scheduledStockRules, setScheduledStockRules] = useState([]);
  const firedRef = useRef({});

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
      setStockForm((prev) => ({
        ...prev,
        productName: prev.productName || data.products[0].name,
      }));
    }
  }, [data]);

  // Helper: convert 12-hr hour + ampm to 24-hr hour
  const to24Hour = useCallback((hour12Str, ampm) => {
    let h = parseInt(hour12Str, 10);
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return h;
  }, []);

  // Fire a scheduled rule immediately (for test or when time matches)
  const fireRule = useCallback((rule) => {
    const timeString = `${rule.hour}:${rule.minute} ${rule.ampm}`;
    setStockAlert(
      `✅ Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString}.`
    );
    // Hit the backend to persist and get updated stock
    fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: rule.productName,
        quantity: rule.quantity,
        mode: "automatic",
        dayOfMonth: rule.dayOfMonth,
        timeStr: timeString,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.products) {
          setSummary((prev) => ({ ...prev, products: result.products }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Scheduler: check every 30 seconds if any rule should fire
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Key: YYYY-MM-DD-ruleId to prevent double-firing in same minute
      const todayKey = `${now.getFullYear()}-${now.getMonth()}`;

      setScheduledStockRules((rules) => {
        rules.forEach((rule) => {
          const ruleHour24 = to24Hour(rule.hour, rule.ampm);
          const ruleMinute = parseInt(rule.minute, 10);
          const fireKey = `${todayKey}-${currentDay}-${rule.id}`;

          if (
            currentDay === rule.dayOfMonth &&
            currentHour === ruleHour24 &&
            currentMinute === ruleMinute &&
            !firedRef.current[fireKey]
          ) {
            firedRef.current[fireKey] = true;
            fireRule(rule);
          }
        });
        return rules; // no mutation to state itself
      });
    }, 30000); // check every 30 seconds

    return () => clearInterval(intervalId);
  }, [fireRule, to24Hour]);

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

      // Backend stock error guards — nothing was recorded, show error and stop
      if (result.error === "out_of_stock") {
        setStockAlert(`⚠️ Cannot sell ${productName} — no stock available. Please add stock first.`);
        return;
      }
      if (result.error === "insufficient_stock") {
        setStockAlert(`⚠️ ${result.message}`);
        return;
      }

      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({
        ...prev,
        ai_insights: result.ai_insights,
        // Sync stock from backend response
        products: result.products ?? prev.products,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickSale = (productName) => {
    // Block sale if stock is 0
    const product = (summary.products || []).find((p) => p.name === productName);
    if (!product || Number(product.stockAvailable || 0) <= 0) {
      setStockAlert(`⚠️ Cannot sell ${productName} — stock is 0.`);
      return;
    }
    setPressedProduct(productName);
    window.clearTimeout(window.__saleFlashTimeout);
    window.__saleFlashTimeout = window.setTimeout(() => {
      setPressedProduct(null);
    }, 300);
    submitSale(productName, 1, selectedPeriod, manualForm.entryDate);
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const product = (summary.products || []).find((p) => p.name === manualForm.productName);
    const availableStock = Number(product?.stockAvailable || 0);
    const requestedQty = Number(manualForm.quantity || 1);

    // Block if stock is 0
    if (!product || availableStock <= 0) {
      setStockAlert(`⚠️ Cannot sell ${manualForm.productName} — no stock available. Please add stock first.`);
      return;
    }
    // Block if requested quantity exceeds available stock
    if (requestedQty > availableStock) {
      setStockAlert(
        `⚠️ Not enough stock for ${manualForm.productName}. You tried to sell ${requestedQty} but only ${availableStock} unit${availableStock !== 1 ? "s are" : " is"} available.`
      );
      return;
    }

    const entryValue =
      selectedPeriod === "month"
        ? manualForm.entryMonth
        : selectedPeriod === "year"
          ? manualForm.entryYear
          : manualForm.entryDate;

    submitSale(manualForm.productName, requestedQty, selectedPeriod, entryValue);
  };

  const handleStockFormChange = (field, value) => {
    setStockForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const quantity = Number(stockForm.quantity || 0);
    const selectedProductName = stockForm.productName;

    if (!selectedProductName || quantity <= 0) {
      return;
    }

    if (stockMode === "oneTime") {
      // One-time: add stock immediately
      if (!stockForm.date) return;
      setStockAlert(`✅ Added ${quantity} units to ${selectedProductName} on ${new Date(stockForm.date + "T00:00:00").toLocaleDateString()}.`);
      try {
        const res = await fetch("/api/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: selectedProductName,
            quantity,
            mode: "oneTime",
            dayOfMonth: null,
            timeStr: null,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          // Sync stock from backend
          if (result.products) {
            setSummary((prev) => ({ ...prev, products: result.products }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Automatic: save rule only — do NOT touch stock yet
      const day = Number(stockForm.dayOfMonth || 1);
      const newRule = {
        id: Date.now(),
        productName: selectedProductName,
        quantity,
        dayOfMonth: day,
        hour: stockForm.hour,
        minute: stockForm.minute,
        ampm: stockForm.ampm,
        createdAt: new Date().toISOString(),
      };
      setScheduledStockRules((prev) => [...prev, newRule]);
      setStockAlert(
        `🗓️ Schedule saved: ${quantity} units will be added to ${selectedProductName} on day ${day} of every month at ${stockForm.hour}:${stockForm.minute} ${stockForm.ampm}.`
      );
      // Switch to stock tab so user can see the active schedule
      setActiveTab("stock");
    }

    setIsStockModalOpen(false);
  };

  const handleRemoveRule = (ruleId) => {
    setScheduledStockRules((prev) => prev.filter((r) => r.id !== ruleId));
  };


  if (!summary) {
    return null;
  }

  const greeting = getGreeting();
  const productHistory = salesSummary?.product_history || {};
  const historyEntries = Object.values(productHistory);
  const totalStock = (summary.products || []).reduce(
    (sum, product) => sum + Number(product.stockAvailable || 0),
    0
  );

  return (
    <div className="demo-page">
      <div className="demo-panel">
        <div className="demo-header">
          <div className="greeting-block">
            <h1 className="dashboard-greeting">
              {greeting.label}, {summary.owner_name || "Business Owner"}!
            </h1>
          </div>
          <div className="header-controls">
            <button type="button" className="add-stock-btn" onClick={() => setIsStockModalOpen(true)}>
              <span className="add-stock-icon">+</span> Add stock
            </button>
            <button type="button" className="demo-back-btn" onClick={onBack}>
              Back to Setup
            </button>
          </div>
        </div>

        {stockAlert ? (
          <div className="stock-alert">
            <span>{stockAlert}</span>
            <button type="button" className="stock-alert-dismiss" onClick={() => setStockAlert(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        {isStockModalOpen ? (
          <div className="stock-modal-backdrop">
            <div className="stock-modal">
              <div className="stock-modal-header">
                <div>
                  <h2>Add stock</h2>
                  <p className="stock-modal-subtitle">Choose one-time or automatic stock addition.</p>
                </div>
                <button type="button" className="stock-modal-close" onClick={() => setIsStockModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="stock-modal-tabs">
                <button
                  type="button"
                  className={`stock-modal-tab ${stockMode === "oneTime" ? "active" : ""}`}
                  onClick={() => setStockMode("oneTime")}
                >
                  One-time add
                </button>
                <button
                  type="button"
                  className={`stock-modal-tab ${stockMode === "automatic" ? "active" : ""}`}
                  onClick={() => setStockMode("automatic")}
                >
                  Automatic add
                </button>
              </div>
              <form className="stock-modal-form" onSubmit={handleStockSubmit}>
                <label className="form-field">
                  <span>Product</span>
                  <select
                    value={stockForm.productName}
                    onChange={(event) => handleStockFormChange("productName", event.target.value)}
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
                    value={stockForm.quantity}
                    onChange={(event) => handleStockFormChange("quantity", event.target.value)}
                  />
                </label>
                {stockMode === "oneTime" ? (
                  <label className="form-field">
                    <span>Addition date</span>
                    <input
                      type="date"
                      value={stockForm.date}
                      onChange={(event) => handleStockFormChange("date", event.target.value)}
                    />
                  </label>
                ) : (
                  <>
                    <label className="form-field">
                      <span>Day of Month (1 to 28)</span>
                      <select
                        value={stockForm.dayOfMonth}
                        onChange={(event) => handleStockFormChange("dayOfMonth", Number(event.target.value))}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>
                            {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Time (12-hour HH:MM AM/PM)</span>
                      <div className="time-select-grid">
                        <select
                          value={stockForm.hour}
                          onChange={(event) => handleStockFormChange("hour", event.target.value)}
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hh) => (
                            <option key={hh} value={hh}>{hh}</option>
                          ))}
                        </select>
                        <span className="time-colon">:</span>
                        <select
                          value={stockForm.minute}
                          onChange={(event) => handleStockFormChange("minute", event.target.value)}
                        >
                          {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((mm) => (
                            <option key={mm} value={mm}>{mm}</option>
                          ))}
                        </select>
                        <select
                          value={stockForm.ampm}
                          onChange={(event) => handleStockFormChange("ampm", event.target.value)}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </label>

                    <p className="stock-modal-note">
                      On day {stockForm.dayOfMonth} at {stockForm.hour}:{stockForm.minute} {stockForm.ampm} of every month, {stockForm.quantity} units will be added automatically.
                    </p>
                  </>
                )}
                <div className="stock-modal-actions">
                  <button type="button" className="demo-back-btn" onClick={() => setIsStockModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="register-btn">
                    {stockMode === "oneTime" ? "Add stock" : "Confirm automatic add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <div className="demo-summary-row">
          <div className="demo-stat demo-stat-clickable" onClick={() => setActiveTab("stock")}> 
            <span className="demo-stat-value">{totalStock}</span>
            <span className="demo-stat-label">Total Stock</span>
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
            <button type="button" className={`tab-btn ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}> 
              Stock overview
            </button>
          </div>

          {activeTab === "sales" ? (
            <div className="sales-panel">
              <div className="sales-card">
                <h3>Quick product sales</h3>
                <p>Tap a product button to record one sale instantly.</p>
                <div className="sales-buttons">
                  {(summary.products || []).map((product) => {
                    const stock = Number(product.stockAvailable || 0);
                    const isOutOfStock = stock <= 0;
                    return (
                      <button
                        key={product.name}
                        type="button"
                        className={`sales-product-btn ${pressedProduct === product.name ? "clicked" : ""} ${isOutOfStock ? "out-of-stock" : ""}`}
                        onClick={() => handleQuickSale(product.name)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? `${product.name} — out of stock` : `Sell 1 unit of ${product.name} (${stock} in stock)`}
                      >
                        {product.name}
                        <span className="stock-badge">{isOutOfStock ? "Out of stock" : `${stock} left`}</span>
                      </button>
                    );
                  })}
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
          ) : activeTab === "history" ? (
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
          ) : (
            <div className="stock-panel">
              <div className="history-summary">
                <p>Total available stock: {totalStock}</p>
                <p>Products tracked: {(summary.products || []).length}</p>
              </div>
              <div className="stock-list">
                {(summary.products || []).map((product) => (
                  <div key={product.name} className="stock-row">
                    <span>{product.name}</span>
                    <span>{Number(product.stockAvailable || 0)} units</span>
                  </div>
                ))}
              </div>

              {scheduledStockRules.length > 0 && (
                <div className="scheduled-rules-section">
                  <h3 className="scheduled-rules-title">⏰ Active Automatic Schedules</h3>
                  <p className="scheduled-rules-subtitle">Stock will be added automatically on the specified day &amp; time each month.</p>
                  <div className="scheduled-rules-list">
                    {scheduledStockRules.map((rule) => (
                      <div key={rule.id} className="scheduled-rule-card">
                        <div className="scheduled-rule-info">
                          <span className="scheduled-rule-product">{rule.productName}</span>
                          <span className="scheduled-rule-detail">
                            +{rule.quantity} units &bull; Day {rule.dayOfMonth} of every month &bull; {rule.hour}:{rule.minute} {rule.ampm}
                          </span>
                        </div>
                        <div className="scheduled-rule-actions">
                          <button
                            type="button"
                            className="rule-test-btn"
                            onClick={() => fireRule(rule)}
                            title="Run this schedule now to test"
                          >
                            ▶ Run Now
                          </button>
                          <button
                            type="button"
                            className="rule-remove-btn"
                            onClick={() => handleRemoveRule(rule.id)}
                            title="Remove this schedule"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
