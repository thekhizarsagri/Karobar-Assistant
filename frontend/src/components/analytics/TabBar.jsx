function TabBar({ tabs, active, onChange }) {
  return (
    <div className="analytics-tabs">
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
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