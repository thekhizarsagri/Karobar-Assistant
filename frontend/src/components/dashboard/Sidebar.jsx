import titleImg from "../../assets/title-image.png";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "sales",
    label: "Sales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="21" />
        <line x1="18" y1="8" x2="18" y2="21" />
        <line x1="6" y1="8" x2="18" y2="5" />
        <line x1="6" y1="12" x2="18" y2="9" />
        <line x1="6" y1="16" x2="18" y2="13" />
        <line x1="6" y1="20" x2="18" y2="17" />
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
        <circle cx="19" cy="18" r="2" />
        <path d="M19 8V6.5A2.5 2.5 0 0 0 16.5 4H16" />
        <path d="M5 18l3 3" />
      </svg>
    ),
  },
  {
    id: "forecast",
    label: "Demand Forecasting",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-6 4 3 5-8" />
        <path d="M16 8h5v5" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Product history",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    id: "automation",
    label: "Automation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function Sidebar({ active, onSelect, open, onToggle }) {
  return (
    <>
      <button
        type="button"
        className={`sidebar-toggle ${open ? "" : "sidebar-toggle--closed"}`}
        onClick={onToggle}
        aria-label={open ? "Hide panel" : "Show panel"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={open ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
        </svg>
      </button>
      <aside className={`sidebar ${open ? "" : "sidebar-closed"}`}>
        <div className="sidebar-brand">
          <img src={titleImg} alt="Karobar Assistant" className="sidebar-logo" draggable={false} />
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${active === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;