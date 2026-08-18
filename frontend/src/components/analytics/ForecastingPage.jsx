import { useCallback, useEffect, useState } from "react";
import { ForecastChart } from "./Charts";

const EMPTY = { forecasts: [] };

function ForecastingPage({ data }) {
  const [analytics, setAnalytics] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/advanced");
      if (!res.ok) throw new Error("Unable to load forecasts");
      setAnalytics(await res.json());
    } catch (err) {
      setError(err.message || "Unable to load forecasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [data, fetchForecasts]);

  const forecasts = analytics.forecasts || [];
  const query = searchQuery.trim().toLowerCase();
  const visibleForecasts = query
    ? forecasts.filter((f) => f.product.toLowerCase().includes(query))
    : forecasts;

  return (
    <div className="analytics-page ai-analytics-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Demand Forecasting</h1>
          <p className="analytics-subtitle">Projected next day demand with 95% confidence bounds</p>
        </div>
        <div className="ai-actions">
          <button type="button" className="analytics-back-btn" onClick={fetchForecasts}>
            Refresh
          </button>
          <button
            type="button"
            className={`analytics-back-btn ${showSearch ? "analytics-btn-active" : ""}`}
            onClick={() => setShowSearch((v) => !v)}
          >
            Search
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="forecast-search-box">
          <input
            type="text"
            className="forecast-search-input"
            placeholder="Search product name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.trim() && (
            <button type="button" className="forecast-search-clear" onClick={() => setSearchQuery("")}>
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>Crunching your data…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p>{error}</p>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <p>No forecasts generated. Add sales history to predict demand.</p>
        </div>
      ) : visibleForecasts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>No products match "{searchQuery}".</p>
        </div>
      ) : (
        <section className="ai-panel">
          <div className="ai-panel-heading">
            <h2>Projected Demand</h2>
            <p>Visualizing product sales history and the projected next day demand with 95% confidence bounds.</p>
          </div>
          <div className="forecast-charts-grid">
            {visibleForecasts.map((f) => {
              const trendClass = f.trend || "stable";
              const forecastPoint = {
                date: "Projected",
                units: f.next_period_units,
                lower: f.lower,
                upper: f.upper,
              };

              return (
                <div key={f.product} className="chart-section" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
                  <div className="forecast-card-header">
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>{f.product}</h3>
                    <span className={`forecast-card-meta ${trendClass}`} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                      {trendClass.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0", fontSize: "0.85rem", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
                    <span>Forecast: <strong>{f.next_period_units} units</strong></span>
                    <span style={{ color: "#64748b" }}>Range: {f.lower} - {f.upper}</span>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <ForecastChart history={f.history || []} forecast={[forecastPoint]} height={180} />
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#94a3b8", textAlign: "right" }}>
                    Confidence: <strong style={{ color: f.confidence === "high" ? "#10b981" : f.confidence === "medium" ? "#f59e0b" : "#94a3b8" }}>{f.confidence.toUpperCase()}</strong> (MAPE: {f.mape !== null ? `${f.mape}%` : "N/A"})
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default ForecastingPage;