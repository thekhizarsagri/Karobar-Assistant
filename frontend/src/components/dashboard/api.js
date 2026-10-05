const jsonHeaders = { "Content-Type": "application/json" };

async function req(url, options = {}, message) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(message);
  return res.json();
}

const postJson = (url, body, message) =>
  req(url, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) }, message);

const postEmpty = (url, message) => req(url, { method: "POST" }, message);
const get = (url, message) => req(url, {}, message);

export const postSale = (productName, quantity, period, entryDate, entryType) =>
  postJson("/api/sales", { productName, quantity, period, entryDate, entryType }, "Unable to save sales entry");

export const deleteSale = (productName, quantity, period, entryDate) =>
  postJson("/api/sales/delete", { productName, quantity, period, entryDate }, "Unable to delete sales entry");

export const postStock = (productName, quantity, date) =>
  postJson("/api/stock", { productName, quantity, mode: "oneTime", date }, "Unable to update stock");

export async function postProduct(product) {
  const res = await fetch("/api/products", { method: "POST", headers: jsonHeaders, body: JSON.stringify(product) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = new Error(data.message || "Unable to add product");
    err.code = data.error || "request_failed";
    throw err;
  }
  return data;
}

export const getNotifications = () => get("/api/notifications", "Unable to load notifications");
export const getNotificationToggle = () => get("/api/notifications/toggle", "Unable to load notification toggle");
export const toggleNotificationSwitch = (enabled) =>
  postJson("/api/notifications/toggle", { enabled }, "Unable to toggle notifications");
export const addNotification = ({ type = "info", title, message }) =>
  postJson("/api/notifications", { type, title, message }, "Unable to save notification");
export const markAllNotificationsRead = () => postEmpty("/api/notifications/read", "Unable to update notifications");
export const clearNotifications = () => postEmpty("/api/notifications/clear", "Unable to clear notifications");
export const getAlerts = () => get("/api/alerts", "Unable to load alerts");
export const clearAlerts = () => postEmpty("/api/alerts/clear", "Unable to clear alerts");

export const clearProductHistory = (productName) =>
  postEmpty(`/api/history/clear/${encodeURIComponent(productName)}`, "Unable to clear product history");

export const postChat = (sessionId, message) =>
  postJson("/api/chat", { session_id: sessionId, message }, "Unable to reach the assistant");

export const getActivity = (limit = 50, type = "") => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set("type", type);
  return get(`/api/activity?${params.toString()}`, "Unable to load activity");
};
export const clearActivity = () => postEmpty("/api/activity/clear", "Unable to clear activity");
export const exportBackup = () => get("/api/backup/export", "Unable to export backup");
export const restoreBackup = (payload) =>
  postJson("/api/backup/restore", payload, "Unable to restore backup");
