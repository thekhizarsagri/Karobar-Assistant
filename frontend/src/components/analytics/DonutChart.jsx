import { useState } from "react";
import { formatCompact } from "../../utils/formatNumber";

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
