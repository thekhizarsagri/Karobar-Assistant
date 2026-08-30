import { useState, useRef } from "react";
import { formatCompact, formatStat } from "../../utils/formatNumber";

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
