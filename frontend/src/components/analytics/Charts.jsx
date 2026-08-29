import { useState, useRef } from "react";
import { formatCompact, formatStat } from "../../utils/formatNumber";

/**
 * Helper to convert degree angles to SVG circular coordinates
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Generates an SVG Path for a Donut sector
 */
function getDonutArcPath(x, y, radius, innerRadius, startAngle, endAngle) {
  const angleDiff = endAngle - startAngle;
  if (angleDiff >= 359.99) {
    return [
      `M ${x} ${y - radius}`,
      `A ${radius} ${radius} 0 1 0 ${x} ${y + radius}`,
      `A ${radius} ${radius} 0 1 0 ${x} ${y - radius}`,
      `M ${x} ${y - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 1 ${x} ${y + innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 1 ${x} ${y - innerRadius}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = angleDiff <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z",
  ].join(" ");
}

/**
 * 2. DonutChart
 * A beautiful donut chart with highlights and hover interactions.
 * Data format: [{ label: string, value: number, color: string }]
 */
export function DonutChart({ data = [], centerTextLabel = "Total Share" }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
        <p>No visual breakdown (0 total units/revenue)</p>
      </div>
    );
  }

  const size = 200;
  const center = size / 2;
  const radius = 80;
  const innerRadius = 52;

  let currentAngle = 0;

  const slices = data.map((item, idx) => {
    const angleSize = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSize;
    currentAngle = endAngle;

    const path = getDonutArcPath(center, center, radius, innerRadius, startAngle, endAngle);
    const percentage = Math.round((item.value / total) * 100);

    return { ...item, path, percentage, idx };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="analytics-split-layout">
      {/* Visual Chart */}
      <div className="chart-svg-container" style={{ maxWidth: "240px", margin: "0 auto" }}>
        <svg className="chart-svg" viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice) => (
            <g
              key={slice.idx}
              className="donut-slice-group"
              onMouseEnter={() => setHoveredIndex(slice.idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <path
                className="donut-slice"
                d={slice.path}
                fill={slice.color}
                opacity={hoveredIndex === null || hoveredIndex === slice.idx ? 1.0 : 0.65}
              />
            </g>
          ))}

          {/* Centered text display */}
          <text x={center} y={center - 2} textAnchor="middle" className="donut-center-label">
            {activeSlice ? formatCompact(activeSlice.value) : formatCompact(total)}
          </text>
          <text x={center} y={center + 16} textAnchor="middle" className="donut-center-sublabel">
            {activeSlice ? `${activeSlice.label} (${activeSlice.percentage}%)` : centerTextLabel}
          </text>
        </svg>
      </div>

      {/* Legend list */}
      <div className="donut-legend">
        {slices.map((slice) => (
          <div
            key={slice.label}
            className="donut-legend-item"
            onMouseEnter={() => setHoveredIndex(slice.idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="donut-legend-color" style={{ background: slice.color }} />
            <span className="donut-legend-text">
              {slice.label} <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({slice.percentage}%)</span>
            </span>
            <span className="donut-legend-val">{formatCompact(slice.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. HorizontalBarChart
 * Displays ranked quantities in a horizontal visual stack.
 * Data format: [{ label: string, value: number, displayValue?: string, fill?: string }]
 */
export function HorizontalBarChart({ data = [], barColor = "#3b82f6" }) {
  if (!data || data.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: "0.9rem", textAlign: "center" }}>No movers logged</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="hz-bar-wrapper">
      {data.map((item) => {
        const widthPct = Math.min(100, Math.max(5, (item.value / maxVal) * 100));
        return (
          <div key={item.label} className="hz-bar-item">
            <div className="hz-bar-label-row">
              <span>{item.label}</span>
              <span>{item.displayValue || item.value}</span>
            </div>
            <div className="hz-bar-track">
              <div
                className="hz-bar-fill"
                style={{
                  width: `${widthPct}%`,
                  background: item.fill || barColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 5. MonthlyBarChart
 * A green bar chart showing one value per month, with an optional year
 * selector. Data format: [{ label: string, value: number, details?: object }]
 */
export function MonthlyBarChart({
  data = [],
  height = 200,
  barColor = "#10b981",
  selectedYear,
  availableYears = [],
  onYearChange,
  title,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </span>
        <p>No trend data available</p>
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 5);

  const yTicksCount = 4;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => Math.round((maxVal / yTicksCount) * i));

  const gap = data.length > 10 ? 8 : 14;
  const barWidth = Math.max(10, Math.min(34, (chartWidth - gap * (data.length - 1)) / data.length));

  const bars = data.map((item, idx) => {
    const barHeight = (item.value / maxVal) * chartHeight;
    const x = padding.left + idx * ((chartWidth + gap) / data.length) + (gap / 2);
    const y = padding.top + chartHeight - barHeight;
    return { ...item, x, y, barHeight, idx };
  });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgMouseX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    bars.forEach((b, i) => {
      const center = b.x + barWidth / 2;
      const diff = Math.abs(center - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  return (
    <div>
      {(title || availableYears.length > 0) && (
        <div className="chart-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <span>{title}</span>
          {availableYears.length > 0 && (
            <label className="chart-year-select">
              <span>Year</span>
              <select value={selectedYear} onChange={(e) => onYearChange?.(Number(e.target.value))}>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="chart-svg-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%">
          {/* Horizontal gridlines */}
          {yTicks.map((tickVal) => {
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

          {/* Bars */}
          {bars.map((bar) => {
            const active = hoveredIndex === bar.idx;
            return (
              <rect
                key={bar.idx}
                className="chart-bar-rect"
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={Math.max(bar.barHeight, bar.value > 0 ? 2 : 0)}
                rx="4"
                fill={barColor}
                opacity={hoveredIndex === null || active ? 1 : 0.5}
              />
            );
          })}

          {/* X axis labels */}
          {data.map((item, idx) => {
            const x = padding.left + idx * ((chartWidth + gap) / data.length) + barWidth / 2;
            const skip = data.length > 12 && idx % 2 !== 0;
            return skip ? null : (
              <text
                key={idx}
                className="chart-axis-text"
                x={x}
                y={svgHeight - 12}
                textAnchor="middle"
              >
                {item.label}
              </text>
            );
          })}

          {/* Hover vertical guide */}
          {hoveredIndex !== null && (
            <line
              className="chart-hover-vertical-line"
              x1={bars[hoveredIndex].x + barWidth / 2}
              y1={padding.top}
              x2={bars[hoveredIndex].x + barWidth / 2}
              y2={padding.top + chartHeight}
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${((bars[hoveredIndex].x + barWidth / 2) / svgWidth) * 100}%`,
              top: `${(bars[hoveredIndex].y / svgHeight) * 100}%`,
              transform: "translate(-50%, -105%)",
            }}
          >
            <div className="chart-tooltip-title">{bars[hoveredIndex].label}</div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-label">Sales:</span>
              <span className="chart-tooltip-val">{formatStat(bars[hoveredIndex].value)} units</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
