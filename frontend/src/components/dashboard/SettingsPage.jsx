import { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import { getNotificationToggle, toggleNotificationSwitch } from "./api";

const SETTINGS_DEFS = [
  {
    id: "darkMode",
    label: "Dark Mode",
    description: "Switch to dark color theme",
    iconClass: "settings-item-icon--moon",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Receive push notifications and alerts",
    iconClass: "settings-item-icon--bell",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
];

function SettingsPage() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToggleState = async () => {
      try {
        const result = await getNotificationToggle();
        setNotificationsEnabled(result.enabled);
      } catch {
        /* keep default */
      }
      setLoading(false);
    };
    fetchToggleState();
  }, []);

  const toggleSetting = async (id) => {
    if (id === "notifications") {
      const newEnabled = !notificationsEnabled;
      try {
        await toggleNotificationSwitch(newEnabled);
      } catch {
        return;
      }
      setNotificationsEnabled(newEnabled);
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } else if (id === "darkMode") {
      toggleTheme();
    }
  };

  const isChecked = (id) => (id === "notifications" ? notificationsEnabled : dark);

  if (loading) {
    return (
      <div className="settings-page">
        <div className="analytics-header">
          <div className="analytics-head-left">
            <span className="analytics-head-icon analytics-head-icon--settings" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b7191" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="analytics-head-text">
              <h1 className="analytics-title">Settings</h1>
              <p className="analytics-subtitle">Customize your experience</p>
            </span>
          </div>
        </div>
        <div className="settings-list" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="settings-item settings-item--loading">
              <div className="settings-item-info">
                <span className="settings-skeleton-icon" />
                <div>
                  <span className="settings-skeleton-line settings-skeleton-line--title" />
                  <span className="settings-skeleton-line settings-skeleton-line--desc" />
                </div>
              </div>
              <span className="settings-skeleton-toggle" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* ── Header (inventory / sales / analytics style) ── */}
      <div className="analytics-header">
        <div className="analytics-head-left">
          <span className="analytics-head-icon analytics-head-icon--settings" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b7191" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="analytics-head-text">
            <h1 className="analytics-title">Settings</h1>
            <p className="analytics-subtitle">Customize your experience</p>
          </span>
        </div>
        <div className="analytics-head-right">
          <span className="analytics-summary-chip">
            <span className={`settings-status-dot ${dark ? "settings-status-dot--dark" : ""}`} aria-hidden="true" />
            <span>
              <span className="analytics-summary-label">Appearance</span>
              <span className="analytics-summary-value">{dark ? "Dark mode" : "Light mode"}{notificationsEnabled ? " · Alerts on" : " · Alerts off"}</span>
            </span>
          </span>
        </div>
      </div>

      <section className="analytics-section settings-section-card">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--settings" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Preferences</h2>
            <p className="analytics-section-sub">Theme and notification controls</p>
          </span>
        </div>
        <div className="settings-list">
          {SETTINGS_DEFS.map((item, idx) => (
            <div
              key={item.id}
              className="settings-item analytics-card-animated"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="settings-item-info">
                <span className={`settings-item-icon ${item.iconClass}`} aria-hidden="true">{item.icon}</span>
                <div>
                  <span className="settings-item-label">{item.label}</span>
                  <span className="settings-item-desc">
                    {item.id === "notifications"
                      ? (notificationsEnabled ? "Push notifications and alerts are on" : "Push notifications and alerts are off")
                      : item.description}
                  </span>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isChecked(item.id)}
                  onChange={() => toggleSetting(item.id)}
                  id={`toggle-${item.id}`}
                  aria-label={item.label}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
