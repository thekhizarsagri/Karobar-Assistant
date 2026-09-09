const TRILLION = 1_000_000_000_000;

export function capNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  if (num > TRILLION) return TRILLION;
  if (num < -TRILLION) return -TRILLION;
  return num;
}

export function formatCompact(value, decimals = 1) {
  const num = capNumber(value);
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1_000_000_000_000) {
    const v = abs / 1_000_000_000_000;
    return sign + v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : decimals) + "T";
  }
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return sign + v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : decimals) + "B";
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return sign + v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : decimals) + "M";
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return sign + v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : decimals) + "K";
  }
  return sign + abs.toFixed(abs % 1 === 0 ? 0 : decimals);
}

export function formatFull(value, decimals = 0) {
  const num = capNumber(value);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatStat(value, decimals = 0) {
  const num = capNumber(value);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, 1);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatNumber(value, fractionDigits = 0) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, fractionDigits > 0 ? 1 : 0);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function calculateMargin(sell, cost) {
  const s = Number(sell) || 0;
  const c = Number(cost) || 0;
  if (s <= 0) return { profit: 0, marginPercent: 0, status: "neutral" };
  const profit = s - c;
  const marginPercent = ((profit / s) * 100).toFixed(1);
  const status = profit > 0 ? (marginPercent >= 25 ? "good" : "fair") : "loss";
  return { profit, marginPercent, status };
}
