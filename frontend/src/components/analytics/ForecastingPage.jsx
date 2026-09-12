import { useCallback, useEffect, useState } from "react";
import { ForecastChart } from "./Charts";
import { formatStat, formatCompact } from "../../utils/formatNumber";

const EMPTY = { forecasts: [] };

function ForecastingPage({ data }) {
  const [analytics, setAnalytics] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const forecasts = analytics?.forecasts || [];
  const query = searchQuery.trim().toLowerCase();
  const visibleForecasts = query
    ? forecasts.filter((f) => (f.product || "").toLowerCase().includes(query))
    : forecasts;

  const stats = {
    upward: forecasts.filter((f) => f.trend === "upward").length,
    highConf: forecasts.filter((f) => f.confidence === "high").length,
    totalUnits: forecasts.reduce((sum, f) => sum + Number(f.next_period_units || 0), 0),
  };

  return (
    <div className="analytics-page ai-analytics-page">
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--forecast" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18l6-8 4 4 8-10" />
              <path d="M17 4h4v4" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Demand Forecasting</h1>
            <p className="analytics-subtitle">Projected next day demand with 95% confidence bounds</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 18l6-8 4 4 8-10" />
              <path d="M17 4h4v4" />
            </svg>
            <span>
              <span className="analytics-summary-label">Forecasted demand</span>
              <span className="analytics-summary-value">
                {formatStat(stats.totalUnits)} units · {forecasts.length} product{forecasts.length === 1 ? "" : "s"}
              </span>
            </span>
          </span>
          <button type="button" className="ai-refresh-btn" onClick={fetchForecasts} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.5 15a9 9 0 1 1-1.4-8.4L23 10" />
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {!loading && !error && forecasts.length > 0 && (
        <div className="analytics-stats forecast-stats">
          <div className="analytics-stat">
            <span className="analytics-stat-icon analytics-stat-icon--blue" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                <path d="M3 8l9 5 9-5M12 13v8" />
              </svg>
            </span>
            <span className="analytics-stat-body">
              <strong className="analytics-stat-value">{forecasts.length}</strong>
              <span className="analytics-stat-label">Products forecasted</span>
              <span className="analytics-stat-sub">Next-day projections</span>
            </span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-icon analytics-stat-icon--green" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M15 7h6v6" />
              </svg>
            </span>
            <span className="analytics-stat-body">
              <strong className="analytics-stat-value">{stats.upward}</strong>
              <span className="analytics-stat-label">Trending upward</span>
              <span className="analytics-stat-sub">Growing demand</span>
            </span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-icon analytics-stat-icon--amber" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="analytics-stat-body">
              <strong className="analytics-stat-value">{stats.highConf}</strong>
              <span className="analytics-stat-label">High confidence</span>
              <span className="analytics-stat-sub">Reliable projections</span>
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <p className="analytics-empty-title">Crunching your data…</p>
          <p className="analytics-empty-sub">Building demand projections from your sales history.</p>
        </div>
      ) : error ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <p className="analytics-empty-title">Something went wrong</p>
          <p className="analytics-empty-sub">{error}</p>
          <button type="button" className="ai-retry-btn" onClick={fetchForecasts}>
            Try again
          </button>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="analytics-empty">
          <span className="analytics-empty-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <p className="analytics-empty-title">No forecasts yet</p>
          <p className="analytics-empty-sub">Add sales history to predict demand.</p>
        </div>
      ) : (
        <section className="analytics-section forecast-section">
          <div className="analytics-section-head">
            <span className="analytics-section-icon analytics-section-icon--forecast" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l6-8 4 4 8-10" />
                <path d="M17 4h4v4" />
              </svg>
            </span>
            <span className="analytics-section-titles">
              <h2 className="analytics-section-title">Projected Demand</h2>
              <p className="analytics-section-sub">
                Sales history with projected next-day demand and 95% confidence bounds
                {visibleForecasts.length !== forecasts.length
                  ? ` · ${visibleForecasts.length} of ${forecasts.length} shown`
                  : ` · ${forecasts.length} products`}
              </p>
            </span>
            <label className="analytics-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                className="analytics-search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search forecasted products"
              />
            </label>
          </div>

          {visibleForecasts.length === 0 ? (
            <div className="analytics-empty">
              <span className="analytics-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <p className="analytics-empty-title">No products match “{searchQuery}”</p>
              <p className="analytics-empty-sub">Try a different search term.</p>
              <button type="button" className="ai-retry-btn" onClick={() => setSearchQuery("")}>
                Clear search
              </button>
            </div>
          ) : (
            <div className="forecast-charts-grid">
              {visibleForecasts.map((f, idx) => {
                const trendClass = f.trend || "stable";
                const confidence = f.confidence || "low";
                const confClass =
                  confidence === "high" ? "forecast-conf--high" : confidence === "medium" ? "forecast-conf--medium" : "forecast-conf--low";
                const forecastPoint = {
                  date: "Projected",
                  units: f.next_period_units,
                  lower: f.lower,
                  upper: f.upper,
                };

                return (
                  <div
                    key={f.product ?? `forecast-${idx}`}
                    className="chart-section forecast-card analytics-card-animated"
                    style={{ animationDelay: `${Math.min(idx, 11) * 45}ms` }}
                  >
                    <div className="forecast-card-header">
                      <h3 className="forecast-card-product" title={f.product || "Unnamed product"}>{f.product || "Unnamed product"}</h3>
                      <span className={`forecast-card-meta ${trendClass}`}>
                        <span className="forecast-meta-dot" aria-hidden="true" />
                        {trendClass.toUpperCase()}
                      </span>
                    </div>
                    <div className="forecast-card-range">
                      <span>Forecast: <strong>{formatStat(f.next_period_units)} units</strong></span>
                      <span className="forecast-card-range-vals">Range: {formatCompact(f.lower)} - {formatCompact(f.upper)}</span>
                    </div>
                    <div className="forecast-card-chart">
                      <ForecastChart history={f.history || []} forecast={[forecastPoint]} height={150} />
                    </div>
                    <div className="forecast-card-footer">
                      Confidence: <strong className={confClass}>{confidence.toUpperCase()}</strong> (MAPE: {f.mape != null ? `${f.mape}%` : "N/A"})
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ForecastingPage;
