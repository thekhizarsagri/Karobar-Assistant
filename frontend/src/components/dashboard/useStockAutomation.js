import { useEffect, useRef } from "react";

export default function useStockAutomation(rules, setRules, addStock, notify) {
  const firedRef = useRef({});
  const rulesRef = useRef(rules);

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    const to24Hour = (hour12Str, ampm) => {
      let h = parseInt(hour12Str, 10);
      if (ampm === "AM") {
        if (h === 12) h = 0;
      } else if (h !== 12) {
        h += 12;
      }
      return h;
    };

    const intervalId = setInterval(() => {
      const now = new Date();
      const fireKeyBase = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      rulesRef.current.forEach((rule) => {
        const matchesDay = now.getDate() === rule.dayOfMonth;
        const matchesMinute = now.getMinutes() === parseInt(rule.minute, 10);
        const matchesHour = now.getHours() === to24Hour(rule.hour, rule.ampm);
        const fireKey = `${fireKeyBase}-${rule.id}`;
        if (matchesDay && matchesHour && matchesMinute && !firedRef.current[fireKey]) {
          firedRef.current[fireKey] = true;
          const timeString = `${rule.hour}:${rule.minute} ${rule.ampm}`;
          addStock(rule.productName, rule.quantity);
          notify(`Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString}.`, "success");
        }
      });
    }, 30000);
    return () => clearInterval(intervalId);
  }, [addStock, notify]);

  const fireRule = (rule) => {
    const timeString = `${rule.hour}:${rule.minute} ${rule.ampm}`;
    addStock(rule.productName, rule.quantity);
    notify(`Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString}.`, "success");
  };

  const handleRemoveRule = (ruleId) =>
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== ruleId);
      rulesRef.current = next;
      return next;
    });

  return { fireRule, handleRemoveRule };
}
