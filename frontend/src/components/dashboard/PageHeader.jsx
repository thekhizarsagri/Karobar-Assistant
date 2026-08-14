import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell";

const MENU_ITEMS = [
  { id: "editForm", label: "Edit form" },
  { id: "reset", label: "Start fresh" },
  { id: "logout", label: "Logout" },
];

function PageHeader({ ownerName, greeting, onEditForm, onLogout, onReset, hideGreeting = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleMenuClick = (id) => {
    setMenuOpen(false);
    if (id === "editForm") onEditForm?.();
    if (id === "reset") onReset?.();
    if (id === "logout") onLogout?.();
  };

  const handleResetClick = () => {
    if (window.confirm("Start fresh? This will delete all saved data.")) {
      onReset?.();
    }
  };

  const initials = (ownerName || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="demo-header">
      {!hideGreeting && (
        <div className="greeting-block">
          <h1 className="dashboard-greeting">{greeting}, {ownerName || "Business Owner"}!</h1>
          <p className="greeting-date">{dateLabel}</p>
        </div>
      )}
      <div className="header-controls">
        <NotificationBell />
        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="profile-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Profile menu"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="profile-menu-item"
                  onClick={() => (item.id === "reset" ? handleResetClick() : handleMenuClick(item.id))}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
