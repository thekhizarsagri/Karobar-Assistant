import { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import { getNotificationToggle, toggleNotificationSwitch } from "./api";

const SETTINGS_LIST = [
  { id: "darkMode", label: "Dark Mode", description: "Switch to dark color theme", icon: "🌙" },
  { id: "notifications", label: "Turn off notifications", description: "Disable all push notifications", icon: "🔔" },
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

  if (loading) {
    return (
      <div className="demo-section">
        <div className="section-heading">
          <h2>Settings</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-section">
      <div className="section-heading">
        <h2>Settings</h2>
      </div>

      <div className="settings-list">
        {SETTINGS_LIST.map((item) => (
          <div key={item.id} className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-icon">{item.icon}</span>
              <div>
                <span className="settings-item-label">{item.label}</span>
                <span className="settings-item-desc">{item.description}</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={item.id === "notifications" ? !notificationsEnabled : dark}
                onChange={() => toggleSetting(item.id)}
                id={`toggle-${item.id}`}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
