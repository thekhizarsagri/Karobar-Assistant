export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", name: "US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "Euro (€)" },
  { code: "GBP", symbol: "£", name: "British Pound (£)" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham (AED)" },
  { code: "PKR", symbol: "Rs ", name: "Pakistani Rupee (Rs)" },
  { code: "CAD", symbol: "CA$ ", name: "Canadian Dollar (CA$)" },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal (SAR)" },
];

export const DEFAULT_CURRENCY_SYMBOL = "₹";

/**
 * Resolve any stored currency value (symbol like "$", code like "USD",
 * with any casing/whitespace) to its display symbol.
 * Unknown/empty values fall back to the default symbol.
 */
export function resolveCurrencySymbol(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_CURRENCY_SYMBOL;
  const upper = raw.toUpperCase();
  const match = CURRENCIES.find(
    (c) => c.symbol.trim().toUpperCase() === upper || c.code === upper || c.symbol === raw
  );
  return match ? match.symbol : DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Format a monetary value with the resolved currency symbol.
 * e.g. formatMoney("$", 1200) -> "$1,200.00"
 */
export function formatMoney(currency, value, decimals = 2) {
  const symbol = resolveCurrencySymbol(currency);
  const num = Number(value || 0);
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
