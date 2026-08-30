import { formatCompact } from "../../utils/formatNumber";

const SCORE_COLORS = {
  Excellent: "#10b981",
  Good: "#10b981",
  Fair: "#f59e0b",
  "Needs attention": "#ef4444",
};

function fmt(value, fractionDigits = 0) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, fractionDigits > 0 ? 1 : 0);
  }
  return num.toLocaleString(undefined, {
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

export default function KpiSection({ kpi }) {
  return (
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
  );
}
