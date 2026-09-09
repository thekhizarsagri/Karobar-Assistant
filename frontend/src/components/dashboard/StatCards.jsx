import { useTheme } from "../../ThemeContext";

function SolidHead({ color, tip, prev }) {
  // Perfect equilateral-style triangle head, aligned with the line's
  // final straight segment so it always sits clean.
  const dx = tip.x - prev.x;
  const dy = tip.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const L = 12; // head length back from tip
  const W = 7; // head half-width (equilateral proportion)
  const bx = tip.x - ux * L;
  const by = tip.y - uy * L;
  const px = -uy;
  const py = ux;
  const points = `${tip.x},${tip.y} ${bx + px * W},${by + py * W} ${bx - px * W},${by - py * W}`;
  return <polygon points={points} fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />;
}

function smoothWavePath(pts) {
  // Catmull-Rom -> Bezier: perfectly smooth curve through the wave points.
  // Returns the path plus the final control point so the head can align
  // exactly with the curve's end tangent (no kink before the tip).
  const r = (n) => Math.round(n * 10) / 10;
  let d = `M${pts[0].x} ${pts[0].y}`;
  let lastC2 = pts[0];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${r(c1.x)} ${r(c1.y)}, ${r(c2.x)} ${r(c2.y)}, ${p2.x} ${p2.y}`;
    lastC2 = c2;
  }
  return { d, endTangentFrom: lastC2 };
}

function Sparkline({ color, isPositive }) {
  // Three smooth rounded waves like cards.png, flowing tangentially into
  // a perfect solid triangle head. Drawn in a 130x52 space matching the
  // chart box and scaled uniformly (meet) so nothing ever distorts.
  // Negative version mirrors downward.
  const pts = isPositive
    ? [
        { x: 6, y: 42 }, { x: 20, y: 33 }, { x: 34, y: 38 }, { x: 48, y: 30 },
        { x: 62, y: 36 }, { x: 76, y: 28 }, { x: 88, y: 33 }, { x: 100, y: 24 },
        { x: 114, y: 8 },
      ]
    : [
        { x: 6, y: 10 }, { x: 20, y: 19 }, { x: 34, y: 14 }, { x: 48, y: 22 },
        { x: 62, y: 16 }, { x: 76, y: 24 }, { x: 88, y: 19 }, { x: 100, y: 28 },
        { x: 114, y: 44 },
      ];
  const { d, endTangentFrom } = smoothWavePath(pts);
  const tip = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 130 52" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <SolidHead color={color} tip={tip} prev={endTangentFrom} />
    </svg>
  );
}

function MiniBars({ color }) {
  // 5 rising bars like the Monthly Expenses card in cards.png
  const bars = [13, 19, 24, 29, 35];
  return (
    <svg viewBox="0 0 78 38" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <line x1="2" y1="37" x2="76" y2="37" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" />
      {bars.map((h, i) => (
        <rect key={i} x={6 + i * 13.5} y={36 - h} width="8.5" height={h} rx="2.5" fill={color} opacity={i === bars.length - 1 ? 1 : 0.75 + i * 0.05} />
      ))}
    </svg>
  );
}

function TrendArrow({ up, color }) {
  // Small arrow matching cards.png (green up / red down)
  if (up) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function formatMoney(value) {
  // Exactly like cards.png: 200.00 / 1,000.00 / -800.00 (2 decimals, commas)
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInt(value) {
  // Total Stock like cards.png: plain integer 193
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "0";
  return Math.trunc(num).toLocaleString("en-US");
}

function formatPct(raw) {
  if (!Number.isFinite(raw)) return "0%";
  const capped = Math.min(Math.abs(raw), 999);
  return `${Math.round(capped)}%`;
}

function parseTs(v) {
  const t = Date.parse(v || "");
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Stock change vs the last real inventory movement.
 * Initial setup entries (source "form") are the starting baseline, not a
 * "last time" change, so they are excluded. No movements yet -> 0%.
 */
function stockTrend(salesSummary, currentTotal) {
  try {
    const events = [];
    const sh = salesSummary?.stock_history || {};
    Object.values(sh).forEach((list) =>
      (list || [])
        .filter((e) => (e.source || "") !== "form")
        .forEach((e) => {
          events.push({ ts: parseTs(e.created_at), delta: Number(e.quantity) || 0 });
        })
    );
    const ph = salesSummary?.product_history || {};
    Object.values(ph).forEach((h) =>
      (h?.entries || []).forEach((en) => {
        events.push({ ts: parseTs(en.created_at || en.entry_date), delta: -(Number(en.quantity) || 0) });
      })
    );
    if (!events.length) return { pct: "0%", up: true };
    events.sort((a, b) => b.ts - a.ts || b.delta - a.delta);
    const last = events[0];
    const prev = currentTotal - last.delta;
    if (prev <= 0) return { pct: last.delta > 0 ? "100%" : "0%", up: last.delta >= 0 };
    return { pct: formatPct((Math.abs(last.delta) / Math.abs(prev)) * 100), up: last.delta >= 0 };
  } catch {
    return { pct: "0%", up: true };
  }
}

function marginMap(products) {
  const margin = {};
  (products || []).forEach((p) => {
    margin[p.name] = (Number(p.sellingPrice) || 0) - (Number(p.costPrice) || 0);
  });
  return margin;
}

/** Per-month gross profit from analytics quantities x unit margins. */
function monthlyGrossSeries(analytics, products) {
  const margin = marginMap(products);
  const monthly = analytics?.monthly || {};
  return Object.keys(monthly)
    .sort()
    .map((m) => {
      const perProduct = monthly[m] || {};
      let g = 0;
      Object.entries(perProduct).forEach(([name, qty]) => {
        g += (Number(qty) || 0) * (margin[name] || 0);
      });
      return { month: m, value: g };
    });
}

function moM(cur, prev) {
  const c = Number(cur) || 0;
  const p = Number(prev) || 0;
  if (p === 0) return { pct: formatPct(c === 0 ? 0 : 100), up: c >= 0 };
  const raw = ((c - p) / Math.abs(p)) * 100;
  return { pct: formatPct(raw), up: raw >= 0 };
}

function addDays(dateStr, n) {
  // UTC-based so day arithmetic never shifts with the browser timezone.
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Week-over-week gross fallback for businesses with less than 2 months of
 * history. Anchored on the latest date present in the data (data is often
 * backdated), comparing the last 7 days vs the 7 days before. Returns null
 * when there is no daily data at all.
 */
function weeklyGrossTrend(analytics, products) {
  try {
    const daily = analytics?.daily || {};
    const days = Object.keys(daily).sort();
    if (!days.length) return null;
    const margin = marginMap(products);
    const grossOn = (day) => {
      const perProduct = daily[day] || {};
      let g = 0;
      Object.entries(perProduct).forEach(([name, qty]) => {
        g += (Number(qty) || 0) * (margin[name] || 0);
      });
      return g;
    };
    const anchor = days[days.length - 1];
    let cur = 0;
    let prev = 0;
    for (let i = 0; i < 7; i += 1) {
      cur += grossOn(addDays(anchor, -i));
    }
    for (let i = 7; i < 14; i += 1) {
      prev += grossOn(addDays(anchor, -i));
    }
    if (cur === 0 && prev === 0) return null;
    return moM(cur, prev);
  } catch {
    return null;
  }
}

/** Monthly expense totals grouped from deduction history. */
function monthlyExpenseSeries(deductions) {
  const groups = {};
  (deductions || []).forEach((d) => {
    const key = String(d.deducted_at || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return;
    groups[key] = (groups[key] || 0) + (Number(d.amount) || 0);
  });
  return Object.keys(groups)
    .sort()
    .map((m) => ({ month: m, value: groups[m] }));
}

export default function StatCards({
  totalStock,
  grossProfit,
  monthlyExpenses,
  netProfit,
  salesSummary,
  analytics,
  products,
  deductions,
  onStockOverview,
  onAddStock,
}) {
  const grossNum = Number(grossProfit || 0);
  const netNum = Number(netProfit || 0);
  const stockNum = Number(totalStock || 0);
  const expNum = Number(monthlyExpenses || 0);
  const isGrossPositive = !(grossNum < 0);
  const isNetPositive = !(netNum < 0);

  const { dark } = useTheme();

  // Themes sampled from cards.png — muted deep-tinted variants after dark.
  const MINT = dark
    ? {
        cardBg: "#141e33",
        border: "#1e4a3a",
        iconBg: "#14352a",
        iconColor: "#9ccfb4",
        chart: "#83c5a1",
        value: "#f1f5f9",
        trend: "#83c5a1",
      }
    : {
        cardBg: "#effaf6",
        border: "#c9ecdf",
        iconBg: "#b9efda",
        iconColor: "#0b9b6c",
        chart: "#10b981",
        value: "#0f172a",
        trend: "#10b981",
      };
  const RED = dark
    ? {
        cardBg: "#141e33",
        border: "#55232b",
        iconBg: "#3c232a",
        iconColor: "#e2a3ad",
        chart: "#d696a0",
        value: "#f1f5f9",
        trend: "#d696a0",
      }
    : {
        cardBg: "#fef2f2",
        border: "#fecaca",
        iconBg: "#fecaca",
        iconColor: "#dc2626",
        chart: "#ef4444",
        value: "#0f172a",
        trend: "#ef4444",
      };
  const LAVENDER = dark
    ? {
        cardBg: "#161a2e",
        border: "#2c2f5e",
        iconBg: "#262a52",
        iconColor: "#a78bfa",
        chart: "#a78bfa",
        value: "#f1f5f9",
        trend: "#34d399",
      }
    : {
        cardBg: "#f7f5ff",
        border: "#ddd0fa",
        iconBg: "#e3dcfd",
        iconColor: "#7c3aed",
        chart: "#8b5cf6",
        value: "#0f172a",
        trend: "#10b981",
      };
  const AMBER = dark
    ? {
        cardBg: "#0e1c33",
        border: "#22385e",
        iconBg: "#182c4e",
        iconColor: "#60a5fa",
        chart: "#60a5fa",
        value: "#f1f5f9",
        trend: "#60a5fa",
      }
    : {
        cardBg: "#f2f7ff",
        border: "#cfe0fb",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        chart: "#60a5fa",
        value: "#0f172a",
        trend: "#2563eb",
      };

  const grossTheme = isGrossPositive ? MINT : RED;
  const netTheme = isNetPositive ? MINT : RED;
  const downColor = dark ? "#d696a0" : "#f43f5e";

  // ---- Real percentages from live data ----
  const stockT = stockTrend(salesSummary, stockNum);

  const grossSeries = monthlyGrossSeries(analytics, products);
  // Direction follows the profit/loss sign (like cards.png: green up when in
  // profit, red down when negative). The % itself is the accurate MoM magnitude.
  let grossPct = "0%";
  let grossSub = "vs last month";
  if (grossSeries.length >= 2) {
    grossPct = moM(grossSeries[grossSeries.length - 1].value, grossSeries[grossSeries.length - 2].value).pct;
  } else {
    // Not enough monthly history yet: use the last 7 days vs the week
    // before so the card still reflects real movement.
    const weekly = weeklyGrossTrend(analytics, products);
    if (weekly) {
      grossPct = weekly.pct;
      grossSub = "vs last week";
    }
  }
  const grossT = { pct: grossPct, up: isGrossPositive };

  const expSeries = monthlyExpenseSeries(deductions);
  let expT = { pct: "0%", up: true };
  if (expSeries.length >= 2) {
    const cur = expSeries[expSeries.length - 1].value;
    const prev = expSeries[expSeries.length - 2].value;
    const r = moM(cur, prev);
    expT = { pct: r.pct, up: cur >= prev };
  }

  let netPct = "0%";
  let netSub = "vs last month";
  if (grossSeries.length >= 2) {
    const cur = grossSeries[grossSeries.length - 1].value - expNum;
    const prev = grossSeries[grossSeries.length - 2].value - expNum;
    netPct = moM(cur, prev).pct;
  } else {
    const weekly = weeklyGrossTrend(analytics, products);
    if (weekly) {
      // Weekly net = weekly gross minus the week's share of monthly expenses.
      const weeklyExp = expNum / 4.33;
      const daily = analytics?.daily || {};
      const days = Object.keys(daily).sort();
      const anchor = days[days.length - 1];
      const margin = marginMap(products);
      const grossOn = (day) => {
        let g = 0;
        Object.entries(daily[day] || {}).forEach(([name, qty]) => {
          g += (Number(qty) || 0) * (margin[name] || 0);
        });
        return g;
      };
      let curG = 0;
      let prevG = 0;
      for (let i = 0; i < 7; i += 1) curG += grossOn(addDays(anchor, -i));
      for (let i = 7; i < 14; i += 1) prevG += grossOn(addDays(anchor, -i));
      netPct = moM(curG - weeklyExp, prevG - weeklyExp).pct;
      netSub = "vs last week";
    }
  }
  const netT = { pct: netPct, up: isNetPositive };

  const cards = [
    {
      key: "stock",
      label: "Total Stock",
      value: formatInt(stockNum),
      valueColor: AMBER.value,
      theme: AMBER,
      pct: stockT.pct,
      sub: "vs last time",
      up: stockT.up,
      trendColor: stockT.up ? AMBER.trend : RED.trend,
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      key: "gross",
      label: "Gross Profit",
      value: formatMoney(grossNum),
      valueColor: grossTheme.value,
      theme: grossTheme,
      pct: grossT.pct,
      sub: grossSub,
      up: grossT.up,
      trendColor: grossT.up ? MINT.trend : RED.trend,
      iconSvg: grossT.up ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 17 9 11 13 15 21 7" />
          <polyline points="15 7 21 7 21 13" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 7 9 13 13 9 21 17" />
          <polyline points="15 17 21 17 21 11" />
        </svg>
      ),
    },
    {
      key: "expenses",
      label: "Monthly Expenses",
      value: formatMoney(expNum),
      valueColor: LAVENDER.value,
      theme: LAVENDER,
      pct: expT.pct,
      sub: "vs last month",
      up: expT.up,
      trendColor: LAVENDER.trend,
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="6.5" rx="7" ry="3" />
          <path d="M5 6.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
          <path d="M5 12.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
        </svg>
      ),
    },
    {
      key: "netProfit",
      label: "Net Profit",
      value: formatMoney(netNum),
      valueColor: netTheme.value,
      theme: netTheme,
      pct: netT.pct,
      sub: netSub,
      up: netT.up,
      trendColor: netT.up ? MINT.trend : RED.trend,
      iconSvg: netT.up ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 17 9 11 13 15 21 7" />
          <polyline points="15 7 21 7 21 13" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 7 9 13 13 9 21 17" />
          <polyline points="15 17 21 17 21 11" />
        </svg>
      ),
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div
          key={c.key}
          className="kpi-card"
          style={{ background: c.theme.cardBg, borderColor: c.theme.border }}
          onClick={() => c.key === "stock" && onStockOverview?.()}
        >
          <div className="kpi-head">
            <div className="kpi-icon" style={{ background: c.theme.iconBg, color: c.theme.iconColor }}>
              {c.iconSvg}
            </div>
            <span className="kpi-label">{c.label}</span>
          </div>
          <div className="kpi-value" style={{ color: c.valueColor }}>
            {c.value}
          </div>
          <div className="kpi-bottom">
            <div className="kpi-bottom-left">
              <div className="kpi-trend" style={{ color: c.trendColor }}>
                <TrendArrow up={c.up} color={c.trendColor} />
                <span>{c.pct}</span>
              </div>
              <div className="kpi-sub">{c.sub}</div>
              {c.key === "stock" && (
                <button
                  className="kpi-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddStock?.();
                  }}
                >
                  <span className="kpi-add-plus">+</span> Add Stock
                </button>
              )}
            </div>
            {c.key !== "stock" && (
              <div className="kpi-chart">
                {c.key === "expenses" ? (
                  <MiniBars color={c.theme.chart} />
                ) : (
                  <Sparkline color={c.up ? c.theme.chart : downColor} isPositive={c.up} />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
