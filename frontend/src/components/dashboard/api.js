const jsonHeaders = { "Content-Type": "application/json" };

export async function postSale(productName, quantity, period, entryDate, entryType) {
  const res = await fetch("/api/sales", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ productName, quantity, period, entryDate, entryType }),
  });
  if (!res.ok) throw new Error("Unable to save sales entry");
  return res.json();
}

export async function postStock(productName, quantity, date) {
  const res = await fetch("/api/stock", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ productName, quantity, mode: "oneTime", date }),
  });
  if (!res.ok) throw new Error("Unable to update stock");
  return res.json();
}

export async function getNotifications() {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Unable to load notifications");
  return res.json();
}

export async function addNotification({ type = "info", title, message }) {
  const res = await fetch("/api/notifications", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ type, title, message }),
  });
  if (!res.ok) throw new Error("Unable to save notification");
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch("/api/notifications/read", { method: "POST" });
  if (!res.ok) throw new Error("Unable to update notifications");
  return res.json();
}

export async function clearNotifications() {
  const res = await fetch("/api/notifications/clear", { method: "POST" });
  if (!res.ok) throw new Error("Unable to clear notifications");
  return res.json();
}

export async function getAlerts() {
  const res = await fetch("/api/alerts");
  if (!res.ok) throw new Error("Unable to load alerts");
  return res.json();
}

export async function clearAlerts() {
  const res = await fetch("/api/alerts/clear", { method: "POST" });
  if (!res.ok) throw new Error("Unable to clear alerts");
  return res.json();
}

export async function clearProductHistory(productName) {
  const res = await fetch(`/api/history/clear/${encodeURIComponent(productName)}`, { method: "POST" });
  if (!res.ok) throw new Error("Unable to clear product history");
  return res.json();
}