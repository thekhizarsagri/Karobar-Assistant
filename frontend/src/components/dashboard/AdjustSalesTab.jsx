import { useEffect, useMemo, useState } from "react";

const PERIODS = ["day", "month"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function getYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current + 1; y >= current - 10; y--) years.push(y);
  return years;
}

function formatEntryLabel(period, dateStr, monthStr) {
  try {
    if (period === "month") {
      const [y, m] = monthStr.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    }
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return period === "month" ? monthStr : dateStr;
  }
}

function initialsOf(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function stockStatus(stock) {
  const n = Number(stock || 0);
  if (n <= 0) return { label: "Out of stock", className: "sales-pill sales-pill--out" };
  if (n <= 5) return { label: "Low stock", className: "sales-pill sales-pill--low" };
  return { label: "In stock", className: "sales-pill sales-pill--ok" };
}

function AdjustSalesTab({ products, submitSale, removeSale }) {
  const today = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(today.toISOString().slice(0, 7));
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [feedback, setFeedback] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [query, setQuery] = useState("");

  const entryDate = selectedPeriod === "month" ? selectedMonth : selectedDate;
  const yearOptions = getYearOptions();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showFeedback = (type, productName) => {
    setFeedback({ type, productName, key: Date.now() });
  };

  const handleAdd = (productName) => {
    submitSale(productName, 1, selectedPeriod, entryDate, "manual");
    showFeedback("add", productName);
  };

  const handleRemove = (productName) => {
    removeSale(productName, 1, selectedPeriod, entryDate);
    showFeedback("remove", productName);
  };

  const selectDay = (day) => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    setSelectedDate(`${calYear}-${mm}-${dd}`);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const pickMonth = (m) => {
    setCalMonth(m);
    const mm = String(m + 1).padStart(2, "0");
    setSelectedMonth(`${calYear}-${mm}`);
    setShowMonthPicker(false);
  };

  const pickYear = (y) => {
    setCalYear(y);
    if (selectedPeriod === "month") {
      const mm = String(calMonth + 1).padStart(2, "0");
      setSelectedMonth(`${y}-${mm}`);
    }
    setShowYearPicker(false);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const todayStr = today.toISOString().split("T")[0];

  const entryLabel = formatEntryLabel(selectedPeriod, selectedDate, selectedMonth);
  const totalUnits = useMemo(
    () => (products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => String(p.name || "").toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="edit-sales-page">
      {/* ── Header (inventory-style) ── */}
      <div className="sales-page-head">
        <div className="sales-head-left">
          <span className="sales-head-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l1.7-5h14.6L21 9" />
              <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
              <path d="M3 9h18" />
              <circle cx="9" cy="13.5" r="1.2" fill="#0d9d7a" stroke="none" />
              <circle cx="15" cy="13.5" r="1.2" fill="#0d9d7a" stroke="none" />
            </svg>
          </span>
          <span className="sales-head-text">
            <h1 className="sales-title">Edit Sales</h1>
            <p className="sales-subtitle">Record or adjust sales for any product on a selected date</p>
          </span>
        </div>
        <div className="sales-head-right">
          <span className="sales-date-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>
              <span className="sales-date-label">Recording for</span>
              <span className="sales-date-value">{entryLabel} • {selectedPeriod === "day" ? "Day" : "Month"}</span>
            </span>
          </span>
          <div className="sales-segmented" role="tablist" aria-label="Entry period">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={selectedPeriod === period}
                className={`frequency-pill ${selectedPeriod === period ? "active" : ""}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === "day" ? "Day" : "Month"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats strip (inventory-style) ── */}
      <div className="sales-stats">
        <div className="sales-stat">
          <span className="sales-stat-icon sales-stat-icon--blue" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="sales-stat-body">
            <strong className="sales-stat-value">{products.length}</strong>
            <span className="sales-stat-label">Products</span>
            <span className="sales-stat-sub">Available to record</span>
          </span>
        </div>
        <div className="sales-stat">
          <span className="sales-stat-icon sales-stat-icon--green" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
          </span>
          <span className="sales-stat-body">
            <strong className="sales-stat-value">{totalUnits.toLocaleString()}</strong>
            <span className="sales-stat-label">Units in stock</span>
            <span className="sales-stat-sub">Across all products</span>
          </span>
        </div>
        <div className="sales-stat">
          <span className="sales-stat-icon sales-stat-icon--amber" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <span className="sales-stat-body">
            <strong className="sales-stat-value sales-stat-value--sm">{entryLabel}</strong>
            <span className="sales-stat-label">Selected entry</span>
            <span className="sales-stat-sub">{selectedPeriod === "day" ? "Daily entry mode" : "Monthly entry mode"}</span>
          </span>
        </div>
      </div>

      <div className="edit-sales-body">
        {/* ── Calendar card ── */}
        <section className="sales-section sales-calendar-card">
          <div className="sales-section-head">
            <span className="sales-section-icon sales-section-icon--calendar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2.5" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <span className="sales-section-titles">
              <h2 className="sales-section-title">{selectedPeriod === "day" ? "Pick a day" : "Pick a month"}</h2>
              <p className="sales-section-sub">
                {selectedPeriod === "day" ? "Sales will be recorded on this date." : "Sales will be recorded for this month."}
              </p>
            </span>
          </div>

          <div className="edit-sales-calendar-section">
            {selectedPeriod === "day" ? (
              <div className="edit-sales-calendar">
                <div className="edit-cal-header">
                  <button type="button" className="edit-cal-nav" onClick={prevMonth} aria-label="Previous month">&#8249;</button>
                  <div className="edit-cal-title-row">
                    <button type="button" className="edit-cal-title-btn" onClick={() => setShowMonthPicker((v) => !v)}>
                      {MONTHS_SHORT[calMonth]}
                    </button>
                    <button type="button" className="edit-cal-title-btn" onClick={() => setShowYearPicker((v) => !v)}>
                      {calYear}
                    </button>
                  </div>
                  <button type="button" className="edit-cal-nav" onClick={nextMonth} aria-label="Next month">&#8250;</button>
                </div>

                {showMonthPicker && (
                  <div className="edit-cal-dropdown">
                    <div className="edit-cal-dropdown-grid">
                      {MONTHS_SHORT.map((m, i) => (
                        <button
                          key={m}
                          type="button"
                          className={`edit-cal-dropdown-item ${i === calMonth ? "edit-cal-dropdown-item--active" : ""}`}
                          onClick={() => { setCalMonth(i); setShowMonthPicker(false); }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showYearPicker && (
                  <div className="edit-cal-dropdown">
                    <div className="edit-cal-dropdown-grid">
                      {yearOptions.map((y) => (
                        <button
                          key={y}
                          type="button"
                          className={`edit-cal-dropdown-item ${y === calYear ? "edit-cal-dropdown-item--active" : ""}`}
                          onClick={() => pickYear(y)}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="edit-cal-weekdays">
                  {DAYS_SHORT.map((d) => <span key={d} className="edit-cal-weekday">{d}</span>)}
                </div>
                <div className="edit-cal-grid">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <span key={`empty-${i}`} className="edit-cal-day edit-cal-day--empty" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const mm = String(calMonth + 1).padStart(2, "0");
                    const dd = String(day).padStart(2, "0");
                    const dateStr = `${calYear}-${mm}-${dd}`;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`edit-cal-day ${isSelected ? "edit-cal-day--selected" : ""} ${isToday && !isSelected ? "edit-cal-day--today" : ""}`}
                        onClick={() => selectDay(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="edit-sales-month-panel">
                <div className="edit-cal-header">
                  <button type="button" className="edit-cal-nav" onClick={() => setCalYear((y) => y - 1)} aria-label="Previous year">&#8249;</button>
                  <div className="edit-cal-title-row">
                    <button type="button" className="edit-cal-title-btn" onClick={() => setShowYearPicker((v) => !v)}>
                      {calYear}
                    </button>
                  </div>
                  <button type="button" className="edit-cal-nav" onClick={() => setCalYear((y) => y + 1)} aria-label="Next year">&#8250;</button>
                </div>

                {showYearPicker && (
                  <div className="edit-cal-dropdown">
                    <div className="edit-cal-dropdown-grid">
                      {yearOptions.map((y) => (
                        <button
                          key={y}
                          type="button"
                          className={`edit-cal-dropdown-item ${y === calYear ? "edit-cal-dropdown-item--active" : ""}`}
                          onClick={() => pickYear(y)}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="edit-sales-month-grid">
                  {MONTHS_SHORT.map((m, i) => {
                    const mm = String(i + 1).padStart(2, "0");
                    const monthVal = `${calYear}-${mm}`;
                    const isSelected = monthVal === selectedMonth;
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`edit-sales-month-btn ${isSelected ? "edit-sales-month-btn--selected" : ""}`}
                        onClick={() => pickMonth(i)}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Products card ── */}
        <section className="sales-section sales-products-card">
          <div className="sales-section-head sales-products-head">
            <span className="sales-section-icon sales-section-icon--stock" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                <path d="M3 8l9 5 9-5M12 13v8" />
              </svg>
            </span>
            <span className="sales-section-titles">
              <h2 className="sales-section-title">Products</h2>
              <p className="sales-section-sub">
                Tap <strong>+</strong> to add a sale, <strong>−</strong> to remove one
                {filteredProducts.length !== products.length
                  ? ` • ${filteredProducts.length} of ${products.length} shown`
                  : ` • ${products.length} items`}
              </p>
            </span>
            <label className="sales-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                className="sales-search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </label>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="sales-empty">
              <span className="sales-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <p className="sales-empty-title">{products.length === 0 ? "No products yet" : "No products match your search"}</p>
              <p className="sales-empty-sub">
                {products.length === 0
                  ? "Add products in the setup form to start recording sales."
                  : "Try a different search term."}
              </p>
              {query && (
                <button type="button" className="sales-clear-btn" onClick={() => setQuery("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="edit-sales-products" key={`${selectedPeriod}-${entryDate}-${query}`}>
              {filteredProducts.map((product, idx) => {
                const isAddFeedback = feedback?.type === "add" && feedback?.productName === product.name;
                const isRemoveFeedback = feedback?.type === "remove" && feedback?.productName === product.name;
                const status = stockStatus(product.stockAvailable);
                return (
                  <div
                    key={product.name}
                    className="edit-sales-product-card sales-product-animated"
                    style={{ animationDelay: `${Math.min(idx, 11) * 40}ms` }}
                  >
                    <div className="edit-sales-product-top">
                      <span className={`edit-sales-avatar ${idx % 2 === 0 ? "edit-sales-avatar--green" : "edit-sales-avatar--blue"}`} aria-hidden="true">
                        {initialsOf(product.name)}
                      </span>
                      <div className="edit-sales-product-info">
                        <span className="edit-sales-product-name" title={product.name}>{product.name}</span>
                        <span className={status.className}>
                          <span className="sales-pill-dot" aria-hidden="true" />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="edit-sales-card-foot">
                      <span className="edit-sales-product-stock">
                        <strong>{Number(product.stockAvailable || 0).toLocaleString()}</strong> in stock
                      </span>
                      <div className="edit-sales-actions">
                        <button
                          type="button"
                          className={`edit-sales-btn edit-sales-btn--minus ${isRemoveFeedback ? "edit-sales-btn--flash" : ""}`}
                          onClick={() => handleRemove(product.name)}
                          title={`Remove 1 sale of ${product.name}`}
                          aria-label={`Remove 1 sale of ${product.name}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`edit-sales-btn edit-sales-btn--plus ${isAddFeedback ? "edit-sales-btn--flash" : ""}`}
                          onClick={() => handleAdd(product.name)}
                          title={`Add 1 sale of ${product.name}`}
                          aria-label={`Add 1 sale of ${product.name}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdjustSalesTab;
