import { useCallback, useEffect, useRef, useState } from "react";
import ScheduledRules from "./ScheduledRules";
import StockModal from "./StockModal";

function StockTab({ products, addStock, notify, isModalOpen, onCloseModal }) {
  const [rules, setRules] = useState([]);
  const firedRef = useRef({});

  const to24Hour = useCallback((hour12Str, ampm) => {
    let h = parseInt(hour12Str, 10);
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return h;
  }, []);

  const fireRule = useCallback((rule) => {
    const timeString = `${rule.hour}:${rule.minute} ${rule.ampm}`;
    addStock(rule.productName, rule.quantity);
    notify(`✅ Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString}.`, "success");
  }, [addStock, notify]);

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
  }, [to24Hour, fireRule]);

  const handleStockSubmit = (payload) => {
    onCloseModal();
    const quantity = Number(payload.quantity || 0);
    if (!payload.productName || quantity <= 0) return;

    if (payload.mode === "oneTime") {
      addStock(payload.productName, quantity);
      notify(`✅ Added ${quantity} units to ${payload.productName} on ${new Date(payload.date + "T00:00:00").toLocaleDateString()}.`, "success");
    } else {
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
      notify(`🗓️ Schedule saved: ${quantity} units will be added to ${payload.productName} on day ${newRule.dayOfMonth} of every month at ${payload.hour}:${payload.minute} ${payload.ampm}.`, "info");
    }
  };

  const handleRemoveRule = (ruleId) => setRules((prev) => prev.filter((r) => r.id !== ruleId));
  const totalStock = (products || []).reduce((sum, product) => sum + Number(product.stockAvailable || 0), 0);

  return (
    <div className="stock-panel">
      <div className="history-summary">
        <p>Total available stock: {totalStock}</p>
        <p>Products tracked: {(products || []).length}</p>
      </div>
      <div className="stock-list">
        {(products || []).map((product) => (
          <div key={product.name} className="stock-row">
            <span>{product.name}</span>
            <span>{Number(product.stockAvailable || 0)} units</span>
          </div>
        ))}
      </div>

      <ScheduledRules rules={rules} onRun={fireRule} onRemove={handleRemoveRule} />

      <StockModal
        products={products}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={handleStockSubmit}
      />
    </div>
  );
}

export default StockTab;