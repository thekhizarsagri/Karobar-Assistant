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