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
