import { MonthlyBarChart } from "../analytics/Charts";

export default function SeasonalitySection({ seasonality, seasonData }) {
  return (
    <section className="inv-section">
      <div className="rep-section-header">
        <span className="rep-section-icon rep-section-icon--teal">📈</span>
        <h2>Seasonality index</h2>
      </div>
      {seasonality.has_data ? (
        <>
          <div className="chart-section" style={{ maxWidth: "860px", padding: "24px" }}>
            <MonthlyBarChart
              data={seasonData}
              height={220}
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
  );
}
