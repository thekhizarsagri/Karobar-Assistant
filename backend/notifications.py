"""In-memory notification store and AI-alert syncing for the demo session."""
from datetime import datetime
from typing import Any, Dict, List

from backend.persistence import save_state


notifications: List[Dict[str, Any]] = []
_next_id = 1
_notifications_enabled = True


def add_notification(type_: str, title: str, message: str) -> Dict[str, Any]:
    """Append a new unread notification and return it. No-op when notifications are disabled."""
    if not _notifications_enabled:
        return {"id": None, "type": type_, "title": title, "message": message, "read": True}
    global _next_id
    notification = {
        "id": _next_id,
        "type": type_,
        "title": title,
        "message": message,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "read": False,
    }
    _next_id += 1
    notifications.append(notification)
    save_state()
    return notification


def get_notifications() -> Dict[str, Any]:
    """Return the notification feed, newest first, with an unread count."""
    if not _notifications_enabled:
        return {"items": [], "unread_count": 0}
    return {
        "items": list(reversed(notifications)),
        "unread_count": sum(1 for n in notifications if not n["read"]),
    }


def are_notifications_enabled() -> bool:
    return _notifications_enabled


def toggle_notifications(enabled: bool) -> Dict[str, Any]:
    """Enable or disable notifications. Clears old notifications when re-enabling."""
    global _notifications_enabled
    _notifications_enabled = enabled
    if enabled:
        notifications.clear()
        _next_id = 1
    save_state()
    return get_notifications()


def mark_all_read() -> Dict[str, Any]:
    for notification in notifications:
        notification["read"] = True
    save_state()
    return get_notifications()


def mark_read(notification_id: int) -> Dict[str, Any]:
    for notification in notifications:
        if notification["id"] == notification_id:
            notification["read"] = True
            break
    save_state()
    return get_notifications()


def clear_notifications() -> None:
    notifications.clear()
    save_state()