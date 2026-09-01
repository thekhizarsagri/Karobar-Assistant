import { useEffect, useState } from "react";

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

  return (
    <div className="edit-sales-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Edit Sales</h1>
          <p className="analytics-subtitle">Add or remove sales for any product on a selected date</p>
        </div>
      </div>

      <div className="edit-sales-body">
        <div className="edit-sales-calendar-section">
          <div className="edit-sales-period-toggle">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                className={`frequency-pill ${selectedPeriod === period ? "active" : ""}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === "day" ? "Day" : "Month"}
              </button>
            ))}
          </div>

          {selectedPeriod === "day" ? (
            <div className="edit-sales-calendar">
              <div className="edit-cal-header">
                <button type="button" className="edit-cal-nav" onClick={prevMonth}>&#8249;</button>
                <div className="edit-cal-title-row">
                  <button type="button" className="edit-cal-title-btn" onClick={() => setShowMonthPicker((v) => !v)}>
                    {MONTHS_SHORT[calMonth]}
                  </button>
                  <button type="button" className="edit-cal-title-btn" onClick={() => setShowYearPicker((v) => !v)}>
                    {calYear}
                  </button>
                </div>
                <button type="button" className="edit-cal-nav" onClick={nextMonth}>&#8250;</button>
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
                <div className="edit-cal-title-row">
                  <button type="button" className="edit-cal-title-btn" onClick={() => setShowYearPicker((v) => !v)}>
                    {calYear}
                  </button>
                </div>
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

        <div className="edit-sales-products">
          {products.map((product) => {
            const isAddFeedback = feedback?.type === "add" && feedback?.productName === product.name;
            const isRemoveFeedback = feedback?.type === "remove" && feedback?.productName === product.name;

            return (
              <div key={product.name} className="edit-sales-product-card">
                <div className="edit-sales-product-info">
                  <span className="edit-sales-product-name">{product.name}</span>
                  <span className="edit-sales-product-stock">Stock: {product.stockAvailable}</span>
                </div>
                <div className="edit-sales-actions">
                  <button
                    type="button"
                    className={`edit-sales-btn edit-sales-btn--minus ${isRemoveFeedback ? "edit-sales-btn--flash" : ""}`}
                    onClick={() => handleRemove(product.name)}
                    title={`Remove 1 sale of ${product.name}`}
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
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdjustSalesTab;
