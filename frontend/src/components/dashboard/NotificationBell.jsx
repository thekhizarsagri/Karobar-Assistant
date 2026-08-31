import { useCallback, useEffect, useRef, useState } from "react";
import { clearNotifications, getNotifications, getNotificationToggle, markAllNotificationsRead } from "./api";

const POLL_INTERVAL_MS = 15000;

function timeAgo(iso) {
  const then = new Date(iso);
  const seconds = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const containerRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const toggleResult = await getNotificationToggle();
      setNotificationsEnabled(toggleResult.enabled);
      if (!toggleResult.enabled) {
        setItems([]);
        setUnreadCount(0);
        return { items: [], unread_count: 0, enabled: false };
      }
      const result = await getNotifications();
      setItems(result.items || []);
      setUnreadCount(result.unread_count || 0);
      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    const handleEvent = () => refresh();
    window.addEventListener("notifications:updated", handleEvent);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("notifications:updated", handleEvent);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    const result = await refresh();
    const freshUnread = result?.unread_count || 0;
    if (next && freshUnread > 0) {
      await markAllNotificationsRead();
      await refresh();
    }
  };

  const handleClearAll = async () => {
    await clearNotifications();
    await refresh();
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && notificationsEnabled && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span>Notifications</span>
            {notificationsEnabled && items.length > 0 && (
              <button type="button" className="notification-mark-read" onClick={handleClearAll}>
                Clear all
              </button>
            )}
          </div>

          <div className="notification-list">
            {!notificationsEnabled ? (
              <div className="notification-empty">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>Notifications are turned off</p>
              </div>
            ) : items.length === 0 ? (
              <div className="notification-empty">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className={`notification-item ${item.read ? "" : "notification-item--unread"}`}>
                  <span className={`notification-dot notification-dot--${item.type || "info"}`} />
                  <div className="notification-item-body">
                    <div className="notification-item-head">
                      <span className="notification-item-title">{item.title}</span>
                      <span className="notification-item-time">{timeAgo(item.created_at)}</span>
                    </div>
                    <p className="notification-item-message">{item.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;