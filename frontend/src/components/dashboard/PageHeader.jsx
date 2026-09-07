import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell";
import ModalPortal from "./ModalPortal";

const MENU_ITEMS = [
  { id: "editProfile", label: "Edit profile" },
  { id: "editForm", label: "Edit form" },
  { id: "logout", label: "Logout" },
];

function PageHeader({ ownerName, greeting, onEditForm, onEditProfile, onLogout, hideGreeting = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [now, setNow] = useState(new Date());
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleMenuClick = (id) => {
    setMenuOpen(false);
    if (id === "editProfile") onEditProfile?.();
    if (id === "editForm") setShowEditConfirm(true);
    if (id === "logout") onLogout?.();
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
        <span className="header-time">{timeLabel}</span>
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
                  onClick={() => handleMenuClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditConfirm && (
        <ModalPortal>
          <div className="stock-modal-backdrop">
            <div className="stock-modal confirm-modal">
              <div className="stock-modal-header">
                <div>
                  <h2>Edit Form</h2>
                  <p className="stock-modal-subtitle">This action cannot be undone.</p>
                </div>
                <button type="button" className="stock-modal-close" onClick={() => setShowEditConfirm(false)}>×</button>
              </div>
              <div className="confirm-modal-body">
                <p>Editing the form will <strong>reset all your data</strong> including sales history, stock, analytics, and expenses. You will start fresh with a new setup form.</p>
                <p>Are you sure you want to continue?</p>
              </div>
              <div className="stock-modal-actions">
                <button type="button" className="confirm-cancel-btn" onClick={() => setShowEditConfirm(false)}>Cancel</button>
                <button type="button" className="confirm-delete-btn" onClick={() => { setShowEditConfirm(false); onEditForm?.(); }}>
                  Yes, Edit Form
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default PageHeader;
