import { useCallback, useEffect, useState } from "react";
import { ForecastChart } from "./Charts";
import { formatStat, formatCompact } from "../../utils/formatNumber";

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
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <p>Crunching your data…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <p>{error}</p>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <p>No forecasts generated. Add sales history to predict demand.</p>
        </div>
      ) : visibleForecasts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <p>No products match "{searchQuery}".</p>
        </div>
      ) : (
        <section className="ai-panel">
          <div className="ai-panel-heading">
            <span className="rep-section-icon" style={{ background: "#eff6ff" }}>📈</span>
            <div>
              <h2>Projected Demand</h2>
              <p>Visualizing product sales history and the projected next day demand with 95% confidence bounds.</p>
            </div>
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
                <div key={f.product} className="chart-section forecast-card">
                  <div className="forecast-card-header">
                    <h3 className="forecast-card-product">{f.product}</h3>
                    <span className={`forecast-card-meta ${trendClass}`}>
                      {trendClass.toUpperCase()}
                    </span>
                  </div>
                  <div className="forecast-card-range">
                    <span>Forecast: <strong>{formatStat(f.next_period_units)} units</strong></span>
                    <span className="forecast-card-range-vals">Range: {formatCompact(f.lower)} - {formatCompact(f.upper)}</span>
                  </div>
                  <div className="forecast-card-chart">
                    <ForecastChart history={f.history || []} forecast={[forecastPoint]} height={180} />
                  </div>
                  <div className="forecast-card-footer">
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