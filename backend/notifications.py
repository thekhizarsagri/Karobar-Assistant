"""In-memory notification store and AI-alert syncing for the demo session."""
from datetime import datetime
from typing import Any, Dict, List


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
    return get_notifications()


def mark_read(notification_id: int) -> Dict[str, Any]:
    for notification in notifications:
        if notification["id"] == notification_id:
            notification["read"] = True
            break
    return get_notifications()


def clear_notifications() -> None:
    notifications.clear()


def sync_alerts_from_insights(insights: Dict[str, Any]) -> None:
    """Seed actionable AI alerts as notifications and drop ones that were resolved.

    Only actionable alerts (stock / profit) surface in the bell; the generic
    "Business looks steady" info alert is intentionally skipped.
    """
    alerts = insights.get("alerts", [])
    stock_titles = {a["title"] for a in alerts if a["type"] == "stock"}
    existing_stock_titles = {n["title"] for n in notifications if n["type"] == "stock"}

    resolved = existing_stock_titles - stock_titles
    if resolved:
        notifications[:] = [
            n for n in notifications if not (n["type"] == "stock" and n["title"] in resolved)
        ]

    existing = {(n["type"], n["title"]) for n in notifications}
    for alert in alerts:
        if alert["type"] == "info":
            continue
        key = (alert["type"], alert["title"])
        if key not in existing:
            add_notification(alert["type"], alert["title"], alert["message"])
