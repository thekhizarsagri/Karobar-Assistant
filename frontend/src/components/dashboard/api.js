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

export async function postStock(productName, quantity) {
  const res = await fetch("/api/stock", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ productName, quantity, mode: "oneTime" }),
  });
  if (!res.ok) throw new Error("Unable to update stock");
  return res.json();
}