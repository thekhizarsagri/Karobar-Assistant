function WorkspaceTabs({ tabs, active, onChange }) {
  return (
    <div className="sales-tabs">
      {tabs.map(([value, label]) => (
        <button key={value} type="button" className={`tab-btn ${active === value ? "active" : ""}`} onClick={() => onChange(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default WorkspaceTabs;