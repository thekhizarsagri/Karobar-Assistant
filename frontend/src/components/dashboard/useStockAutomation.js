import { useEffect, useRef } from "react";

const to24Hour = (hour12Str, ampm) => {
  const h = parseInt(hour12Str, 10);
  if (ampm === "AM") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
};

const timeString = (rule) => `${rule.hour}:${rule.minute} ${rule.ampm}`;

export default function useStockAutomation(rules, setRules, addStock, notify) {
  const firedRef = useRef({});
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const base = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      for (const rule of rulesRef.current) {
        const key = `${base}-${rule.id}`;
        if (
          !firedRef.current[key] &&
          now.getDate() === rule.dayOfMonth &&
          now.getHours() === to24Hour(rule.hour, rule.ampm) &&
          now.getMinutes() === parseInt(rule.minute, 10)
        ) {
          firedRef.current[key] = true;
          addStock(rule.productName, rule.quantity);
          notify(`Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString(rule)}.`, "success");
        }
      }
    }, 30000);
    return () => clearInterval(id);
  }, [addStock, notify]);

  const fireRule = (rule) => {
    addStock(rule.productName, rule.quantity);
    notify(`Stock added: ${rule.quantity} units automatically added to ${rule.productName} on day ${rule.dayOfMonth} at ${timeString(rule)}.`, "success");
  };

  const handleRemoveRule = (ruleId) =>
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== ruleId);
      rulesRef.current = next;
      return next;
    });

  return { fireRule, handleRemoveRule };
}
