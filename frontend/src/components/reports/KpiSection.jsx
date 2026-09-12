import { formatNumber as fmt } from "../../utils/formatNumber";
import { useCountUp } from "./reportUtils";

const SCORE_TONES = {
  Excellent: "good",
  Good: "good",
  Fair: "warn",
  "Needs attention": "bad",
};

const SCORE_COLORS = {
  Excellent: "#10b981",
  Good: "#10b981",
  Fair: "#f59e0b",
  "Needs attention": "#ef4444",
};

function ScoreRing({ score, label }) {
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0));
  const animated = useCountUp(safeScore);
  const size = 190;
  const stroke = 15;
  const radius = (size - stroke) / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const color = SCORE_COLORS[label] || SCORE_COLORS["Needs attention"];
  const offset = circumference - (animated / 100) * circumference;
  const ticks = Array.from({ length: 40 });

  return (
    <div className="rep-ring-wrap">
      <div className="rep-ring-glow" style={{ background: color }} aria-hidden="true" />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Health score ${safeScore}`}>
        <defs>
          <linearGradient id="repScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * Math.PI * 2 - Math.PI / 2;
          const cx = size / 2;
          const cy = size / 2;
          const r1 = radius + stroke / 2 + 4;
          const r2 = r1 + (i % 5 === 0 ? 5 : 2.5);
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(angle)}
              y1={cy + r1 * Math.sin(angle)}
              x2={cx + r2 * Math.cos(angle)}
              y2={cy + r2 * Math.sin(angle)}
              className="rep-ring-tick"
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="rep-ring-track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#repScoreGrad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="rep-ring-bar"
        />
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" className="rep-score-text">
          {Math.round(animated)}
        </text>
        <text x="50%" y="63%" textAnchor="middle" dominantBaseline="central" className="rep-score-label">
          {label}
        </text>
      </svg>
    </div>
  );
}

function SubScore({ label, value, color, hint }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  const animated = useCountUp(safe);
  return (
    <div className="rep-subscore">
      <div className="rep-subscore-head">
        <span>{label}</span>
        <strong>{fmt(animated, 0)}</strong>
      </div>
      <div className="rep-subscore-track">
        <div className="rep-subscore-fill" style={{ width: `${animated}%`, background: color }} />
      </div>
      {hint && <span className="rep-subscore-hint">{hint}</span>}
    </div>
  );
}

export default function KpiSection({ kpi }) {
  const safe = kpi || {};
  const label = safe.label || "Needs attention";
  const tone = SCORE_TONES[label] || "bad";
  return (
    <section className="analytics-section rep-hero">
      <div className="rep-hero-glow" aria-hidden="true" />
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--health" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="12" cy="12" r="1" fill="#fff" stroke="none" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Business health score</h2>
          <p className="analytics-section-sub">Weighted from profit margin, stock health, and inventory turnover</p>
        </span>
        <span className={`rep-tone-pill rep-tone-pill--${tone}`}>{label}</span>
      </div>
      <div className="rep-kpi">
        <div className="rep-kpi-score">
          <ScoreRing score={safe.score} label={label} />
          <div className="rep-kpi-caption">
            <h3>How it works</h3>
            <p>
              A score of 100 is excellent. Profitability, stock availability, and how
              fast inventory turns each feed the final number.
            </p>
          </div>
        </div>
        <div className="rep-subscore-grid">
          <SubScore label="Profitability" value={safe.profit_score} color="#10b981" hint="Margin strength" />
          <SubScore label="Stock health" value={safe.stock_score} color="#3b82f6" hint="Availability vs reorder" />
          <SubScore label="Inventory turnover" value={safe.turnover_score} color="#8b5cf6" hint="Sales velocity" />
        </div>
      </div>
    </section>
  );
}
