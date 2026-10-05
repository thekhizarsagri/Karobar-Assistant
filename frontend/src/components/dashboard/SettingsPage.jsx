import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../ThemeContext";
import {
  clearActivity,
  exportBackup,
  getActivity,
  getNotificationToggle,
  restoreBackup,
  toggleNotificationSwitch,
} from "./api";

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

const ACTIVITY_FILTERS = [
  { id: "", label: "All" },
  { id: "sale", label: "Sales" },
  { id: "stock", label: "Stock" },
  { id: "expense", label: "Expenses" },
  { id: "product", label: "Products" },
  { id: "system", label: "System" },
];

function formatTimestamp(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SettingsPage() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const [activity, setActivity] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const fileRef = useRef(null);

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
    const handleExternalUpdate = () => fetchToggleState();
    window.addEventListener("notifications:updated", handleExternalUpdate);
    return () => window.removeEventListener("notifications:updated", handleExternalUpdate);
  }, []);

  const fetchActivity = useCallback(async (filter) => {
    setActivityLoading(true);
    try {
      const result = await getActivity(50, filter || "");
      setActivity(result.items || []);
      setActivityTotal(result.total || 0);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(activityFilter);
  }, [activityFilter, fetchActivity]);

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

  const handleDownloadBackup = async () => {
    setBackupBusy(true);
    setBackupStatus("");
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karobar-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupStatus("Backup downloaded — keep that file safe.");
    } catch {
      setBackupStatus("Couldn't export the backup. Try again.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setRestoreBusy(true);
    setBackupStatus("");
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || payload.version !== 1 || !payload.state) {
        setBackupStatus("That file doesn't look like a Karobar backup.");
        return;
      }
      if (!window.confirm(`Restore backup from ${payload.exported_at || "unknown date"}? Current data will be replaced.`)) {
        return;
      }
      const result = await restoreBackup(payload);
      setBackupStatus(result.message || "Backup restored. Reloading…");
      fetchActivity(activityFilter);
      window.dispatchEvent(new CustomEvent("alerts:updated"));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setBackupStatus("Couldn't restore that file — it may be corrupt.");
    } finally {
      setRestoreBusy(false);
    }
  };

  const handleClearActivity = async () => {
    try {
      const result = await clearActivity();
      setActivity(result.items || []);
      setActivityTotal(result.total || 0);
    } catch {
      /* ignore */
    }
  };

  const isChecked = (id) => (id === "notifications" ? notificationsEnabled : dark);

  if (loading) {
    return (
      <div className="settings-page">
        <div className="analytics-header">
          <div className="analytics-head-left">
            <span className="analytics-head-icon analytics-head-icon--settings" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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

      <section className="analytics-section settings-section-card">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--backup" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Data &amp; Backup</h2>
            <p className="analytics-section-sub">Download a full backup or restore one</p>
          </span>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-icon settings-item-icon--backup" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              <div>
                <span className="settings-item-label">Download backup</span>
                <span className="settings-item-desc">One JSON file with products, sales, expenses and history</span>
              </div>
            </div>
            <button type="button" className="settings-action-btn" onClick={handleDownloadBackup} disabled={backupBusy}>
              {backupBusy ? "Preparing…" : "Download"}
            </button>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-icon settings-item-icon--restore" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <polyline points="3 3 3 8 8 8" />
                </svg>
              </span>
              <div>
                <span className="settings-item-label">Restore backup</span>
                <span className="settings-item-desc">Replaces current data — you will be asked to confirm</span>
              </div>
            </div>
            <button type="button" className="settings-action-btn settings-action-btn--secondary" onClick={() => fileRef.current?.click()} disabled={restoreBusy}>
              {restoreBusy ? "Restoring…" : "Choose file"}
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleRestoreFile} aria-label="Choose backup file" />
          </div>
        </div>
        {backupStatus ? <p className="settings-status-line" role="status">{backupStatus}</p> : null}
      </section>

      <section className="analytics-section settings-section-card">
        <div className="analytics-section-head">
          <span className="analytics-section-icon analytics-section-icon--activity" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <span className="analytics-section-titles">
            <h2 className="analytics-section-title">Recent Activity</h2>
            <p className="analytics-section-sub">{activityTotal ? `${activityTotal} events tracked` : "Every sale, stock and expense change lands here"}</p>
          </span>
          <span className="settings-head-actions">
            <button type="button" className="settings-link-btn" onClick={() => fetchActivity(activityFilter)} disabled={activityLoading}>
              Refresh
            </button>
            <button type="button" className="settings-link-btn settings-link-btn--danger" onClick={handleClearActivity} disabled={activityLoading || activity.length === 0}>
              Clear
            </button>
          </span>
        </div>
        <div className="settings-chip-row" role="tablist" aria-label="Filter activity">
          {ACTIVITY_FILTERS.map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              role="tab"
              aria-selected={activityFilter === f.id}
              className={`settings-chip ${activityFilter === f.id ? "settings-chip--active" : ""}`}
              onClick={() => setActivityFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {activityLoading ? (
          <div className="settings-list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="settings-item settings-item--loading">
                <div className="settings-item-info">
                  <span className="settings-skeleton-icon" />
                  <div>
                    <span className="settings-skeleton-line settings-skeleton-line--title" />
                    <span className="settings-skeleton-line settings-skeleton-line--desc" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="settings-empty">No activity yet — record a sale or add stock and it will show up here.</p>
        ) : (
          <ul className="settings-activity-list">
            {activity.map((entry) => (
              <li key={entry.id} className="settings-activity-item">
                <span className={`settings-activity-dot settings-activity-dot--${String(entry.action || "").split(".")[0] || "system"}`} aria-hidden="true" />
                <span className="settings-activity-body">
                  <span className="settings-activity-message">{entry.message}</span>
                  <span className="settings-activity-meta">{entry.action} · {formatTimestamp(entry.timestamp)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
