import { useState } from "react";

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill active">Settings</span>
        <h2>Settings</h2>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <span>Appearance</span>
          <label className="form-field.input-wrapper">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode((v) => !v)}
              id="dark-mode-toggle"
            />
            <span className="form-field.slider" />
            <span className="form-hint">Dark mode</span>
          </label>
        </div>

        <div className="form-field">
          <span>Notification Settings</span>
          <label className="form-field.input-wrapper">
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications((v) => !v)}
              id="notifications-toggle"
            />
            <span className="form-field.slider" />
            <span className="form-hint">Enable notifications</span>
          </label>
        </div>

        <div className="form-field full-width">
          <span>Data Management</span>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="demo-back-btn"
              style={{
                width: "100%",
                justifyContent: "center",
              }}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;