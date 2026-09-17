const TRILLION = 1_000_000_000_000;
const UNITS = [[1_000_000_000_000, "T"], [1_000_000_000, "B"], [1_000_000, "M"], [1_000, "K"]];

export function capNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(-TRILLION, Math.min(TRILLION, num));
}

export function formatCompact(value, decimals = 1) {
  const num = capNumber(value);
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  for (const [size, suffix] of UNITS) {
    if (abs >= size) {
      const v = abs / size;
      return sign + v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : decimals) + suffix;
    }
  }
  return sign + abs.toFixed(abs % 1 === 0 ? 0 : decimals);
}

const toLocale = (num, decimals) =>
  num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function formatFull(value, decimals = 0) {
  return toLocale(capNumber(value), decimals);
}

export function formatStat(value, decimals = 0) {
  const num = capNumber(value);
  return Math.abs(num) >= 1_000_000 ? formatCompact(num, 1) : toLocale(num, decimals);
}

export function formatNumber(value, fractionDigits = 0) {
  return formatStat(value, Math.abs(Number(value || 0)) >= 1_000_000 ? (fractionDigits > 0 ? 1 : 0) : fractionDigits);
}

export function calculateMargin(sell, cost) {
  const s = Number(sell) || 0;
  const c = Number(cost) || 0;
  if (s <= 0) return { profit: 0, marginPercent: 0, status: "neutral" };
  const profit = s - c;
  const marginPercent = ((profit / s) * 100).toFixed(1);
  return { profit, marginPercent, status: profit <= 0 ? "loss" : marginPercent >= 25 ? "good" : "fair" };
}
