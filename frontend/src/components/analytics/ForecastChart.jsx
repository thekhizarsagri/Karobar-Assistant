import { useState, useRef } from "react";
import { formatCompact, formatStat } from "../../utils/formatNumber";

/**
 * 4. ForecastChart
 * Combines past actual history and projected future trends with confidence intervals.
 * Data: {
 *   history: [{ date: string, units: number }]
 *   forecast: [{ date: string, units: number, lower: number, upper: number }]
 * }
 */
export function ForecastChart({ history = [], forecast = [], height = 180 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Combine timelines
  const timeline = [
    ...history.map((h, i) => ({ type: "history", date: h.date, value: h.units, lower: h.units, upper: h.units, idx: i })),
    ...forecast.map((f, i) => ({ type: "forecast", date: f.date, value: f.units, lower: f.lower, upper: f.upper, idx: i })),
  ];

  if (timeline.length === 0) {
    return <p style={{ color: "#94a3b8", textAlign: "center" }}>No data points available</p>;
  }

  const svgWidth = 500;
  const svgHeight = height;
  const padding = { top: 15, right: 15, bottom: 35, left: 45 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...timeline.map((t) => t.upper), 5);

  const points = timeline.map((item, index) => {
    const x = padding.left + (index * chartWidth) / Math.max(1, timeline.length - 1);
    const yVal = padding.top + chartHeight - (item.value / maxVal) * chartHeight;
    const yLower = padding.top + chartHeight - (item.lower / maxVal) * chartHeight;
    const yUpper = padding.top + chartHeight - (item.upper / maxVal) * chartHeight;
    return { x, y: yVal, yLower, yUpper, item, index };
  });

  // Split points for separate paths
  const historyPoints = points.filter((p) => p.item.type === "history");
  // To connect history and forecast, include the last history point in forecast if available
  const forecastPoints = [
    ...(historyPoints.length > 0 ? [historyPoints[historyPoints.length - 1]] : []),
    ...points.filter((p) => p.item.type === "forecast"),
  ];

  // Draw history path
  let historyPath = "";
  if (historyPoints.length > 0) {
    historyPath = `M ${historyPoints[0].x} ${historyPoints[0].y} ` + historyPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  }

  // Draw forecast path
  let forecastPath = "";
  if (forecastPoints.length > 0) {
    forecastPath = `M ${forecastPoints[0].x} ${forecastPoints[0].y} ` + forecastPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  }

  // Shaded confidence bound polygon path
  let confidencePath = "";
  const forecastOnlyPoints = points.filter((p) => p.item.type === "forecast");
  if (forecastOnlyPoints.length > 1) {
    // Upper points (left to right)
    const upperLine = forecastOnlyPoints.map((p) => `L ${p.x} ${p.yUpper}`).join(" ");
    // Lower points (right to left)
    const lowerLine = [...forecastOnlyPoints].reverse().map((p) => `L ${p.x} ${p.yLower}`).join(" ");

    confidencePath = `M ${forecastOnlyPoints[0].x} ${forecastOnlyPoints[0].yLower} ${upperLine} ${lowerLine} Z`;
  }

  // Handle Tooltips
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgMouseX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, i) => {
      const diff = Math.abs(p.x - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setHoveredIdx(closestIdx);
    setTooltipPos({ x: points[closestIdx].x, y: points[closestIdx].y - 8 });
  };

  return (
    <div
      ref={containerRef}
      className="chart-svg-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%">
        {/* Horizontal gridlines */}
        {[0, Math.round(maxVal / 2), maxVal].map((tickVal) => {
          const y = padding.top + chartHeight - (tickVal / maxVal) * chartHeight;
          return (
            <g key={tickVal}>
              <line className="chart-gridline" x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} />
              <text className="chart-axis-text" x={padding.left - 8} y={y + 4} textAnchor="end">
                {formatCompact(tickVal)}
              </text>
            </g>
          );
        })}

        {/* Labels at start and end */}
        {timeline.length > 1 && (
          <>
            <text className="chart-axis-text" x={padding.left} y={svgHeight - 10} textAnchor="start">
              {timeline[0].date}
            </text>
            <text className="chart-axis-text" x={svgWidth - padding.right} y={svgHeight - 10} textAnchor="end">
              {timeline[timeline.length - 1].date}
            </text>
          </>
        )}

        {/* Confidence Shaded Bounds */}
        {confidencePath && <path className="chart-confidence-region" d={confidencePath} />}

        {/* History actual line */}
        {historyPath && (
          <path
            className="chart-line-stroke"
            d={historyPath}
            stroke="#1e3a8a"
            strokeWidth="2.5"
            fill="none"
          />
        )}

        {/* Forecast predicted line */}
        {forecastPath && (
          <path
            className="chart-line-stroke"
            d={forecastPath}
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            fill="none"
          />
        )}

        {/* Vertical divider indicator at first forecast point */}
        {historyPoints.length > 0 && forecastOnlyPoints.length > 0 && (
          <line
            x1={forecastOnlyPoints[0].x}
            y1={padding.top}
            x2={forecastOnlyPoints[0].x}
            y2={padding.top + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="2"
          />
        )}

        {/* Interactive Hover Vertical Bar */}
        {hoveredIdx !== null && (
          <line
            className="chart-hover-vertical-line"
            x1={points[hoveredIdx].x}
            y1={padding.top}
            x2={points[hoveredIdx].x}
            y2={padding.top + chartHeight}
          />
        )}

        {/* Interactive Circle markers */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={i}
              className="chart-interactive-dot"
              cx={p.x}
              cy={p.y}
              r={isHovered ? 5.5 : 3.5}
              fill={isHovered ? (p.item.type === "history" ? "#1e3a8a" : "#2563eb") : "#ffffff"}
              stroke={p.item.type === "history" ? "#1e3a8a" : "#2563eb"}
              strokeWidth={isHovered ? 2.5 : 1.5}
            />
          );
        })}
      </svg>

      {/* HTML tooltip */}
      {hoveredIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(tooltipPos.x / svgWidth) * 100}%`,
            top: `${(tooltipPos.y / svgHeight) * 100}%`,
            transform: "translate(-50%, -105%)",
          }}
        >
          <div className="chart-tooltip-title">
            {timeline[hoveredIdx].date} ({timeline[hoveredIdx].type === "history" ? "Actual" : "Projected"})
          </div>
          <div className="chart-tooltip-row">
            <span className="chart-tooltip-label">Forecasted:</span>
              <span className="chart-tooltip-val" style={{ color: timeline[hoveredIdx].type === "history" ? "#93c5fd" : "#38bdf8" }}>
                {formatStat(timeline[hoveredIdx].value)} units
              </span>
          </div>
          {timeline[hoveredIdx].type === "forecast" && (
            <div className="chart-tooltip-row" style={{ fontSize: "0.72rem", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "4px" }}>
              <span className="chart-tooltip-label">Bounds:</span>
              <span className="chart-tooltip-val">
                {formatCompact(timeline[hoveredIdx].lower)} - {formatCompact(timeline[hoveredIdx].upper)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
