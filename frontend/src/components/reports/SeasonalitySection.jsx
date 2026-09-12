import { MonthlyBarChart } from "../analytics/Charts";

export default function SeasonalitySection({ seasonality, seasonData }) {
  const s = seasonality || {};
  const data = seasonData || [];
  const peak = data.length > 0
    ? data.reduce((a, b) => (Number(b.value ?? 0) > Number(a.value ?? 0) ? b : a), data[0])
    : null;
  const valley = data.length > 0
    ? data.reduce((a, b) => (Number(b.value ?? 0) < Number(a.value ?? 0) ? b : a), data[0])
    : null;

  return (
    <section className="analytics-section rep-section">
      <div className="analytics-section-head">
        <span className="analytics-section-icon analytics-section-icon--season" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M6 21v-7" />
            <path d="M11 21V8" />
            <path d="M16 21v-11" />
            <path d="M21 21V5" />
          </svg>
        </span>
        <span className="analytics-section-titles">
          <h2 className="analytics-section-title">Seasonality index</h2>
          <p className="analytics-section-sub">Monthly demand vs. the average month (1.0 = average)</p>
        </span>
        {s.has_data && peak && valley && (
          <span className="rep-season-badges">
            <span className="rep-season-badge rep-season-badge--peak">▲ {peak.label} peak</span>
            <span className="rep-season-badge rep-season-badge--valley">▼ {valley.label} low</span>
          </span>
        )}
      </div>
      {s.has_data ? (
        <>
          <div className="chart-section rep-season-chart">
            <MonthlyBarChart
              data={data}
              height={180}
              barColor="#2f80ed"
              title="Monthly demand vs. the average month (1.0 = average)"
            />
          </div>
          <p className="rep-note">
            A bar above 1.0 means that month typically sells more than average — restock early.
            Below 1.0 means lower-than-average demand.
          </p>
        </>
      ) : (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <p className="analytics-empty-title">No seasonality data yet</p>
          <p className="analytics-empty-sub">Add sales history to see which months sell above average.</p>
        </div>
      )}
    </section>
  );
}
