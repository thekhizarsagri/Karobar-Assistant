function TabBar({ tabs, active, onChange }) {
  return (
    <div className="analytics-tabs" role="tablist" aria-label="Analytics view">
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          className={`analytics-tab-btn ${active === value ? "active" : ""}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default TabBar;
