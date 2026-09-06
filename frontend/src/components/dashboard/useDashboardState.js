import { useEffect, useState } from "react";
import { postSale, postStock, addNotification, deleteSale } from "./api";

const NOTIFY_TITLES = {
  error: "Action failed",
  success: "Success",
  warning: "Heads up",
  info: "Notification",
};

export default function useDashboardState(data) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [rules, setRules] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: {}, monthly: {}, yearly: {} });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setAnalytics(await res.json());
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, [summary, salesSummary]);

  const availableYears = Object.keys(analytics.monthly || {})
    .map((m) => parseInt(m.split("-")[0], 10));
  const uniqueYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);
  const defaultYear = uniqueYears.length ? uniqueYears[0] : new Date().getFullYear();
  const [activeYear, setActiveYear] = useState(defaultYear);
  useEffect(() => {
    setActiveYear(defaultYear);
  }, [defaultYear]);

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
      if (result.error === "out_of_stock" || result.error === "insufficient_stock") {
        window.dispatchEvent(new CustomEvent("alerts:updated"));
        return;
      }
      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({
        ...prev,
        products: result.products ?? prev.products,
        metrics: result.metrics ?? prev.metrics,
      }));
      window.dispatchEvent(new CustomEvent("alerts:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const removeSaleHandler = async (productName, quantity, period, entryDate) => {
    try {
      const result = await deleteSale(productName, quantity, period, entryDate);
      if (result.error === "no_sale_found") return;
      setSalesSummary(result.sales_summary);
      setSummary((prev) => ({
        ...prev,
        products: result.products ?? prev.products,
        metrics: result.metrics ?? prev.metrics,
      }));
      window.dispatchEvent(new CustomEvent("alerts:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const addStock = async (productName, quantity, date) => {
    try {
      const result = await postStock(productName, quantity, date);
      if (result.sales_summary) setSalesSummary(result.sales_summary);
      if (result.products) updateProducts(result.products);
      window.dispatchEvent(new CustomEvent("alerts:updated"));
      return result;
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  return {
    summary,
    setSummary,
    salesSummary,
    setSalesSummary,
    rules,
    setRules,
    analytics,
    activeYear,
    setActiveYear,
    uniqueYears,
    notify,
    updateProducts,
    submitSale,
    removeSaleHandler,
    addStock,
  };
}
