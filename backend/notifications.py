"""In-memory notification store and AI-alert syncing for the demo session."""
from datetime import datetime
from typing import Any, Dict, List

from backend.persistence import save_state


notifications: List[Dict[str, Any]] = []
_next_id = 1


def add_notification(type_: str, title: str, message: str) -> Dict[str, Any]:
    """Append a new unread notification and return it."""
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
    return {
        "items": list(reversed(notifications)),
        "unread_count": sum(1 for n in notifications if not n["read"]),
    }


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


def sync_alerts_from_insights(insights: Dict[str, Any]) -> None:
    """Seed actionable AI alerts as notifications and drop ones that were resolved.

    AI alerts (low stock, profit, info) are intentionally NOT sent to the
    notification bell — they belong to the Alerts box only. The bell is
    reserved for user-action notifications (sales, stock, automation).
    """
    alerts = insights.get("alerts", [])
    changed = False

    synced_types = {"stock", "profit", "info"}
    synced_notifications = [n for n in notifications if n["type"] in synced_types]
    if synced_notifications:
        notifications[:] = [n for n in notifications if n["type"] not in synced_types]
        changed = True

    existing = {(n["type"], n["title"]) for n in notifications}
    for alert in alerts:
        if alert["type"] in synced_types:
            continue
        key = (alert["type"], alert["title"])
        if key not in existing:
            add_notification(alert["type"], alert["title"], alert["message"])
            changed = True
    if changed:
        save_state()
