import { useEffect, useState } from "react";
import { postSale, postStock, addNotification, deleteSale } from "./api";

const NOTIFY_TITLES = { error: "Action failed", success: "Success", warning: "Heads up", info: "Notification" };
const NOISY_ERRORS = new Set(["out_of_stock", "insufficient_stock", "no_sale_found"]);

const applyResult = (result, setSalesSummary, setSummary) => {
  if (!result || NOISY_ERRORS.has(result.error)) return false;
  if (result.sales_summary) setSalesSummary(result.sales_summary);
  if (result.products || result.metrics)
    setSummary((prev) => ({ ...prev, ...(result.products ? { products: result.products } : {}), ...(result.metrics ? { metrics: result.metrics } : {}) }));
  return true;
};

const emit = (name) => window.dispatchEvent(new CustomEvent(name));
const log = (error) => console.error(error);

export default function useDashboardState(data) {
  const [summary, setSummary] = useState(data);
  const [salesSummary, setSalesSummary] = useState(data?.sales_summary || null);
  const [rules, setRules] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: {}, monthly: {}, yearly: {} });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && !cancelled) setAnalytics(json);
      })
      .catch(log);
    return () => {
      cancelled = true;
    };
  }, [summary, salesSummary]);

  const years = Array.from(
    new Set(Object.keys(analytics.monthly || {}).map((m) => parseInt(m.split("-")[0], 10)).filter(Boolean))
  ).sort((a, b) => b - a);
  const defaultYear = years[0] ?? new Date().getFullYear();
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
      emit("notifications:updated");
    } catch (error) {
      log(error);
    }
  };

  const updateProducts = (products) => setSummary((prev) => ({ ...prev, products }));

  const submitSale = async (productName, quantity, period, entryDate, entryType = "auto") => {
    try {
      const result = await postSale(productName, quantity, period, entryDate, entryType);
      if (applyResult(result, setSalesSummary, setSummary)) emit("alerts:updated");
      else if (result?.error) emit("alerts:updated");
    } catch (error) {
      log(error);
    }
  };

  const removeSaleHandler = async (productName, quantity, period, entryDate) => {
    try {
      const result = await deleteSale(productName, quantity, period, entryDate);
      if (applyResult(result, setSalesSummary, setSummary)) emit("alerts:updated");
    } catch (error) {
      log(error);
    }
  };

  const addStock = async (productName, quantity, date) => {
    try {
      const result = await postStock(productName, quantity, date);
      if (result?.sales_summary) setSalesSummary(result.sales_summary);
      if (result?.products) updateProducts(result.products);
      emit("alerts:updated");
      return result;
    } catch (error) {
      log(error);
    }
    return null;
  };

  return {
    summary, setSummary, salesSummary, setSalesSummary, rules, setRules,
    analytics, activeYear, setActiveYear, uniqueYears: years,
    notify, updateProducts, submitSale, removeSaleHandler, addStock,
  };
}
