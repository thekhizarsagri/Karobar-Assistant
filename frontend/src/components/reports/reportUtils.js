import { useEffect, useState } from "react";

/** Animated count-up number. Jumps straight to the value when reduced motion is on. */
export function useCountUp(target, duration = 900) {
  const safeTarget = Number(target) || 0;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(safeTarget);
      return undefined;
    }
    const raf = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(Date.now()), 16);
    const caf = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : clearTimeout;
    const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
    let handle = 0;
    const start = now();
    const tick = (t) => {
      const elapsed = t - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(safeTarget * eased);
      if (progress < 1) handle = raf(tick);
    };
    handle = raf(tick);
    return () => caf(handle);
  }, [safeTarget, duration]);

  return value;
}

/**
 * Rule-based insight bullets derived from the reports payload.
 * Returns [{ tone: 'good'|'warn'|'bad'|'info', title, body }].
 */
export function buildInsights(data) {
  const insights = [];
  const kpi = data?.kpi || {};
  const fin = data?.financials || {};
  const turnover = data?.turnover || {};
  const gmroi = data?.gmroi || {};
  const be = data?.break_even || {};
  const expenses = data?.expenses || {};
  const seasonality = data?.seasonality || {};

  const margin = Number(fin.net_margin ?? 0);
  if (fin.revenue > 0) {
    if (margin >= 0.2) insights.push({ tone: "good", title: "Excellent margin", body: `Net margin of ${(margin * 100).toFixed(1)}% leaves strong room for growth and reinvestment.` });
    else if (margin >= 0.1) insights.push({ tone: "good", title: "Healthy margin", body: `Net margin of ${(margin * 100).toFixed(1)}% is solid for a retail business.` });
    else if (margin >= 0) insights.push({ tone: "warn", title: "Thin margin", body: `Net margin of ${(margin * 100).toFixed(1)}% — review pricing or trim the largest expenses.` });
    else insights.push({ tone: "bad", title: "Operating at a loss", body: `Net margin of ${(margin * 100).toFixed(1)}% — expenses exceed gross profit. Act on break-even now.` });
  }

  const dio = turnover.dio;
  if (dio != null && (fin.cogs || 0) > 0) {
    if (dio <= 30) insights.push({ tone: "good", title: "Lean inventory", body: `Stock turns fast — only ${dio.toFixed(0)} days of inventory on hand.` });
    else if (dio <= 90) insights.push({ tone: "info", title: "Steady stock flow", body: `${dio.toFixed(0)} days of inventory — within a healthy band.` });
    else insights.push({ tone: "warn", title: "Capital tied in stock", body: `${dio.toFixed(0)} days of inventory — consider promotions to free up cash.` });
  }

  const gm = Number(gmroi.value ?? 0);
  if ((fin.revenue || 0) > 0) {
    if (gm >= 3) insights.push({ tone: "good", title: "Strong GMROI", body: `Every rupee in stock returns ${gm.toFixed(2)} in margin.` });
    else if (gm >= 1) insights.push({ tone: "info", title: "GMROI on track", body: `Stock returns ${gm.toFixed(2)}x margin — push top sellers harder.` });
    else insights.push({ tone: "warn", title: "Weak GMROI", body: `Stock returns only ${gm.toFixed(2)}x margin — rebalance toward high-margin products.` });
  }

  if (be.revenue != null && be.revenue > 0 && (fin.revenue || 0) > 0) {
    const cover = (fin.revenue / be.revenue) * 100;
    if (cover >= 100) insights.push({ tone: "good", title: "Above break-even", body: `Revenue covers fixed costs ${cover.toFixed(0)}% over — every extra sale is mostly profit.` });
    else insights.push({ tone: "warn", title: `${cover.toFixed(0)}% to break-even`, body: `You need ${((be.revenue - fin.revenue) / be.revenue * 100).toFixed(0)}% more revenue to cover fixed costs.` });
  }

  const pareto = expenses.pareto || [];
  if (pareto.length > 0) {
    const top = pareto[0];
    if (Number(top.pct) >= 40) insights.push({ tone: "warn", title: `${top.label} dominates spend`, body: `One expense is ${top.pct}% of total — negotiate it first for the biggest saving.` });
  }

  if (Number(kpi.stock_score ?? 100) < 50) {
    insights.push({ tone: "bad", title: "Stock health is low", body: "Several products sit at or below reorder point — schedule restocks from the EOQ table." });
  }

  const index = seasonality.index || [];
  if (seasonality.has_data && index.length > 0) {
    const peak = index.reduce((a, b) => (Number(b.value ?? 0) > Number(a.value ?? 0) ? b : a), index[0]);
    if (peak && Number(peak.value ?? 0) > 1.1) {
      insights.push({ tone: "info", title: `${peak.label} is peak season`, body: `${peak.label} sells ${((Number(peak.value) - 1) * 100).toFixed(0)}% above average — restock early.` });
    }
  }

  return insights.slice(0, 5);
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvBlock(title, headers, rows) {
  const lines = [title, headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return lines.join("\n");
}

/** Build a multi-section CSV of the whole report and trigger a download. */
export function downloadReportCsv(data) {
  const fin = data?.financials || {};
  const be = data?.break_even || {};
  const parts = [
    csvBlock(
      "Financial summary",
      ["Metric", "Value"],
      [
        ["Revenue", fin.revenue ?? 0],
        ["COGS", fin.cogs ?? 0],
        ["Gross profit", fin.gross_profit ?? 0],
        ["Total expenses", fin.total_expenses ?? 0],
        ["Net profit", fin.net_profit ?? 0],
        ["Net margin", fin.net_margin ?? 0],
        ["Units sold", fin.units_sold ?? 0],
      ]
    ),
    csvBlock(
      "Break-even products",
      ["Product", "Contribution/unit", "Margin %", "Units to break even", "Revenue at break-even"],
      (be.products || []).map((p) => [p.product, p.contribution ?? "", p.margin_pct ?? "", p.units ?? "", p.revenue ?? ""])
    ),
    csvBlock(
      "EOQ",
      ["Product", "Annual demand", "Unit cost", "Holding cost/unit", "EOQ", "Orders/year"],
      (data?.eoq || []).map((e) => [e.product, e.annual_demand ?? "", e.cost_price ?? "", e.holding_cost ?? "", e.order_qty ?? "", e.orders_per_year ?? ""])
    ),
    csvBlock(
      "Expense pareto",
      ["Expense", "Amount", "%", "Cumulative %"],
      ((data?.expenses || {}).pareto || []).map((r) => [r.label, r.amount ?? "", r.pct ?? "", r.cumulative_pct ?? ""])
    ),
  ];
  const blob = new Blob([parts.join("\n\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "karobar-business-report.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
