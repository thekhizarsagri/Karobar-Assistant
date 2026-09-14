import { useEffect, useState } from "react";
import titleImg from "../../assets/title-image.png";
import titleImgDark from "../../assets/title-image-dark.png";
import { useTheme } from "../../ThemeContext";
import { NAV_ACCENTS } from "./navTheme";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        accent: NAV_ACCENTS.dashboard,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        id: "inventory",
        label: "Inventory",
        accent: NAV_ACCENTS.inventory,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
          </svg>
        ),
      },
      {
        id: "sales",
        label: "Sales",
        accent: NAV_ACCENTS.sales,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22h18" />
            <path d="M5 18V8" />
            <path d="M9 18V4" />
            <path d="M13 18V10" />
            <path d="M17 18V6" />
          </svg>
        ),
      },
      {
        id: "editSales",
        label: "Edit Sales",
        accent: NAV_ACCENTS.editSales,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
      },
      {
        id: "history",
        label: "Product history",
        accent: NAV_ACCENTS.history,
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
        accent: NAV_ACCENTS.automation,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        id: "ai",
        label: "Analytics",
        accent: NAV_ACCENTS.ai,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
        ),
      },
      {
        id: "forecast",
        label: "Demand Forecasting",
        accent: NAV_ACCENTS.forecast,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18l6-8 4 4 8-10" />
            <path d="M17 4h4v4" />
          </svg>
        ),
      },
      {
        id: "reports",
        label: "Reports",
        accent: NAV_ACCENTS.reports,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 17v-3" />
            <path d="M12 17v-6" />
            <path d="M16 17v-4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        id: "expenses",
        label: "Monthly Expenses",
        accent: NAV_ACCENTS.expenses,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="6.5" rx="7" ry="3" />
            <path d="M5 6.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
            <path d="M5 12.5v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
          </svg>
        ),
      },
      {
        id: "settings",
        label: "Settings",
        accent: NAV_ACCENTS.settings,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

const COLLAPSE_KEY = "karobar-sidebar-collapsed";

function Sidebar({ active, onSelect }) {
  const { dark } = useTheme();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage?.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage?.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* private mode — collapse just won't persist */
    }
  }, [collapsed]);

  let order = 0;

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-brand">
        <img src={dark ? titleImgDark : titleImg} alt="Karobar Assistant" className="sidebar-logo" draggable={false} />
        <span className="sidebar-mark" aria-hidden="true">
          <span className="sidebar-mark-k">K</span><span className="sidebar-mark-a">A</span>
        </span>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="sidebar-group">
            <span className="sidebar-group-label" aria-hidden="true">{group.label}</span>
            {group.items.map((item) => {
              order += 1;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  style={{ "--nav-accent": item.accent, animationDelay: `${order * 35}ms` }}
                  onClick={() => onSelect(item.id)}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                  {isActive && <span className="sidebar-item-glow" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {collapsed
              ? (<polyline points="9 18 15 12 9 6" />)
              : (<polyline points="15 18 9 12 15 6" />)}
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
