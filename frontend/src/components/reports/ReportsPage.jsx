import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthlyBarChart } from "../analytics/Charts";

const EMPTY = {
  kpi: { score: 0, label: "Needs attention", profit_score: 0, stock_score: 0, turnover_score: 0 },
  financials: {},
  gmroi: {},
  turnover: {},
  break_even: { products: [] },
  eoq: [],
  seasonality: { index: [], has_data: false },
  expenses: { pareto: [] },
};

const SCORE_COLORS = {
  Excellent: "#10b981",
  Good: "#10b981",
  Fair: "#f59e0b",
  "Needs attention": "#ef4444",
};

function fmt(value, fractionDigits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function ScoreRing({ score, label }) {
  const size = 150;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = SCORE_COLORS[label] || SCORE_COLORS["Needs attention"];
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Health score ${score}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="central" className="rep-score-text">
        {score}
      </text>
      <text x="50%" y="63%" textAnchor="middle" dominantBaseline="central" className="rep-score-label">
        {label}
      </text>
    </svg>
  );
}

function SubScore({ label, value, color }) {
  return (
    <div className="rep-subscore">
      <div className="rep-subscore-head">
        <span>{label}</span>
        <strong>{fmt(value)}</strong>
      </div>
      <div className="rep-subscore-track">
        <div className="rep-subscore-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
      </div>
    </div>
  );
}

function ReportsPage() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Unable to load reports");
      setData(await res.json());
    } catch (err) {
      setError(err.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const kpi = data.kpi;
  const financials = data.financials;
  const gmroi = data.gmroi;
  const turnover = data.turnover;
  const breakEven = data.break_even;
  const eoq = data.eoq;
  const seasonality = data.seasonality;
  const expenses = data.expenses;

  const seasonData = useMemo(
    () => (seasonality.index || []).map((m) => ({ label: m.label, value: m.value ?? 0 })),
    [seasonality.index]
  );

  return (
    <div className="reports-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Business Reports</h1>
          <p className="analytics-subtitle">
            KPI health, GMROI, inventory turnover, break-even, and replenishment planning
          </p>
        </div>
        <button type="button" className="analytics-back-btn" onClick={fetchReports}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Crunching your reports…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* KPI health score */}
          <section className="inv-section rep-kpi">
            <div className="rep-kpi-score">
              <ScoreRing score={kpi.score} label={kpi.label} />
              <div className="rep-kpi-caption">
                <h2>Business health score</h2>
                <p>
                  Weighted from profit margin, stock health, and inventory turnover. A score of 100
                  is excellent.
                </p>
              </div>
            </div>
            <div className="rep-subscore-grid">
              <SubScore label="Profitability" value={kpi.profit_score} color="#10b981" />
              <SubScore label="Stock health" value={kpi.stock_score} color="#3b82f6" />
              <SubScore label="Inventory turnover" value={kpi.turnover_score} color="#8b5cf6" />
            </div>
          </section>

          {/* Financial + efficiency metric cards */}
          <section className="inv-section">
            <h2 className="inv-section-title">Financial summary</h2>
            <div className="rep-metric-grid">
              <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.revenue, 2)}</span><span className="rep-metric-label">Revenue (sales)</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.cogs, 2)}</span><span className="rep-metric-label">Cost of goods sold</span></div>
              <div className="rep-metric"><span className="rep-metric-value rep-metric--green">{fmt(financials.gross_profit, 2)}</span><span className="rep-metric-label">Gross profit</span></div>
              <div className="rep-metric"><span className={`rep-metric-value ${financials.net_profit >= 0 ? "rep-metric--green" : "rep-metric--red"}`}>{fmt(financials.net_profit, 2)}</span><span className="rep-metric-label">Net profit</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.total_expenses, 2)}</span><span className="rep-metric-label">Total expenses</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(financials.units_sold)}</span><span className="rep-metric-label">Units sold</span></div>
            </div>

            <h2 className="inv-section-title rep-subtitle">Efficiency</h2>
            <div className="rep-metric-grid">
              <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{fmt(gmroi.value, 2)}</span><span className="rep-metric-label">GMROI (margin ÷ inventory cost)</span></div>
              <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{fmt(turnover.ratio, 2)}</span><span className="rep-metric-label">Inventory turnover / year</span></div>
              <div className="rep-metric"><span className="rep-metric-value rep-metric--blue">{turnover.dio != null ? fmt(turnover.dio, 1) : "—"}</span><span className="rep-metric-label">Days of inventory (DIO)</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(gmroi.avg_inventory_cost, 2)}</span><span className="rep-metric-label">Avg inventory cost</span></div>
            </div>
          </section>

          {/* Break-even */}
          <section className="inv-section">
            <h2 className="inv-section-title">Break-even analysis</h2>
            <div className="rep-metric-grid">
              <div className="rep-metric"><span className="rep-metric-value">{breakEven.revenue != null ? fmt(breakEven.revenue) : "—"}</span><span className="rep-metric-label">Break-even revenue</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{breakEven.units != null ? fmt(breakEven.units) : "—"}</span><span className="rep-metric-label">Break-even units</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(breakEven.cm_ratio * 100, 1)}%</span><span className="rep-metric-label">Contribution margin ratio</span></div>
              <div className="rep-metric"><span className="rep-metric-value">{fmt(breakEven.total_expenses, 2)}</span><span className="rep-metric-label">Fixed expenses to cover</span></div>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Contribution / unit</th>
                    <th>Margin</th>
                    <th>Units to break even</th>
                    <th>Revenue at break-even</th>
                  </tr>
                </thead>
                <tbody>
                  {breakEven.products.map((p) => (
                    <tr key={p.product}>
                      <td><span className="inv-product-name">{p.product}</span></td>
                      <td>{fmt(p.contribution, 2)}</td>
                      <td>{fmt(p.margin_pct, 1)}%</td>
                      <td>{p.units != null ? fmt(p.units) : <span className="inv-muted">—</span>}</td>
                      <td>{p.revenue != null ? fmt(p.revenue) : <span className="inv-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* EOQ */}
          <section className="inv-section">
            <h2 className="inv-section-title">Economic order quantity (EOQ)</h2>
            <p className="rep-note">
              Estimated optimal order size: <strong>√(2 × annual demand × order cost ÷ holding cost)</strong>.
              Order cost {fmt(50, 0)} and a {Math.round(20)}% annual holding rate are assumed.
            </p>
            {eoq.length === 0 ? (
              <p className="inv-muted">No products with sales data yet.</p>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Annual demand</th>
                      <th>Unit cost</th>
                      <th>Holding cost / unit</th>
                      <th>EOQ (per order)</th>
                      <th>Orders / year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eoq.map((e) => (
                      <tr key={e.product}>
                        <td><span className="inv-product-name">{e.product}</span></td>
                        <td>{fmt(e.annual_demand)}</td>
                        <td>{fmt(e.cost_price, 2)}</td>
                        <td>{fmt(e.holding_cost, 2)}</td>
                        <td>{e.order_qty > 0 ? fmt(e.order_qty) : <span className="inv-muted">—</span>}</td>
                        <td>{e.orders_per_year > 0 ? fmt(e.orders_per_year, 1) : <span className="inv-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seasonality */}
          <section className="inv-section">
            <h2 className="inv-section-title">Seasonality index</h2>
            {seasonality.has_data ? (
              <>
                <div className="chart-section" style={{ maxWidth: "820px", padding: "20px" }}>
                  <MonthlyBarChart
                    data={seasonData}
                    height={200}
                    barColor="#3b82f6"
                    title="Monthly demand vs. the average month (1.0 = average)"
                  />
                </div>
                <p className="rep-note">
                  A bar above 1.0 means that month typically sells more than average — restock early.
                  Below 1.0 means lower-than-average demand.
                </p>
              </>
            ) : (
              <p className="inv-muted">Add sales history to see which months sell above average.</p>
            )}
          </section>

          {/* Expense Pareto */}
          <section className="inv-section">
            <h2 className="inv-section-title">Expense Pareto (80/20)</h2>
            {expenses.pareto.length === 0 ? (
              <p className="inv-muted">No enabled expenses to report.</p>
            ) : (
              <div className="rep-pareto">
                {expenses.pareto.map((row) => (
                  <div key={row.label} className="rep-pareto-row">
                    <div className="rep-pareto-head">
                      <span className="rep-pareto-label">{row.label}</span>
                      <span className="rep-pareto-val">{fmt(row.amount, 2)} · {row.pct}%</span>
                    </div>
                    <div className="rep-pareto-track">
                      <div className="rep-pareto-fill" style={{ width: `${Math.min(100, row.cumulative_pct)}%` }} />
                    </div>
                    <div className="rep-pareto-cum">cumulative {row.cumulative_pct}%</div>
                  </div>
                ))}
                <p className="rep-note">Total expenses: <strong>{fmt(expenses.total, 2)}</strong></p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default ReportsPage;