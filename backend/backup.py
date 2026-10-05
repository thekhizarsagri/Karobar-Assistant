"""Full-business backup export / restore.

A backup is a single JSON document with a version tag so older files
can be rejected cleanly instead of half-restoring corrupt data:

    {"version": 1, "exported_at": "...", "state": {...store.json shape...}}

Export reuses the same serializers as ``persistence.save_state``.
Restore validates first (atomic: nothing is touched until the payload
proves valid), then swaps all in-memory state and persists to disk.
"""
from datetime import datetime
from typing import Any, Dict

BACKUP_VERSION = 1


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def export_backup() -> Dict[str, Any]:
    from backend.activity import snapshot as activity_snapshot
    from backend.alerts import dismissed_alerts, transient_alerts
    from backend.notifications import _next_id, _notifications_enabled, notifications
    from backend.persistence_serializers import (
        _profile_to_dict,
        _sale_to_dict,
        _stock_to_dict,
    )
    from backend.store import _current_profile, sales_log, stock_log

    return {
        "version": BACKUP_VERSION,
        "exported_at": _now_iso(),
        "state": {
            "profile": _profile_to_dict(_current_profile),
            "sales": [_sale_to_dict(e) for e in sales_log],
            "stock": [_stock_to_dict(e) for e in stock_log],
            "notifications": {
                "items": [dict(n) for n in notifications],
                "next_id": _next_id,
                "enabled": _notifications_enabled,
            },
            "dismissed_alerts": list(dismissed_alerts),
            "transient_alerts": [dict(a) for a in transient_alerts],
            "activity": activity_snapshot(),
        },
    }


def restore_backup(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate ``payload`` then atomically replace all business state.

    Returns {"restored": True, ...} on success or {"error": code, "message": ...}.
    """
    if not isinstance(payload, dict):
        return {"error": "invalid", "message": "Backup must be a JSON object."}
    if payload.get("version") != BACKUP_VERSION:
        return {
            "error": "unsupported_version",
            "message": f"Unsupported backup version: {payload.get('version')!r}. Expected {BACKUP_VERSION}.",
        }
    state = payload.get("state")
    if not isinstance(state, dict):
        return {"error": "invalid", "message": "Backup is missing the 'state' object."}

    from backend.persistence_serializers import (
        _profile_from_dict,
        _sale_from_dict,
        _stock_from_dict,
    )

    # ── Validate everything BEFORE touching live state (atomic restore) ──
    try:
        profile = _profile_from_dict(state.get("profile"))
    except Exception:
        return {"error": "invalid", "message": "Backup profile is corrupt."}
    if profile is None:
        return {"error": "invalid", "message": "Backup contains no business profile."}
    try:
        sales = [_sale_from_dict(e) for e in (state.get("sales") or [])]
        stock = [_stock_from_dict(e) for e in (state.get("stock") or [])]
    except Exception:
        return {"error": "invalid", "message": "Backup sales/stock history is corrupt."}
    notif = state.get("notifications") or {}
    if not isinstance(notif, dict):
        return {"error": "invalid", "message": "Backup notifications are corrupt."}
    activity_entries = state.get("activity", [])
    if activity_entries is not None and not isinstance(activity_entries, list):
        return {"error": "invalid", "message": "Backup activity log is corrupt."}

    # ── Swap live state ──
    import backend.activity as activity_module
    import backend.alerts as alerts_module
    import backend.notifications as notifications_module
    import backend.store as store_module
    from backend.activity import log_action
    from backend.persistence import save_state

    store_module.sales_log.clear()
    store_module.stock_log.clear()
    store_module._current_profile = profile
    store_module.sales_log.extend(sales)
    store_module.stock_log.extend(stock)

    notifications_module.notifications.clear()
    items = notif.get("items", [])
    if isinstance(items, list):
        notifications_module.notifications.extend([dict(n) for n in items if isinstance(n, dict)])
    try:
        notifications_module._next_id = int(notif.get("next_id", 1) or 1)
    except (TypeError, ValueError):
        notifications_module._next_id = 1
    if "enabled" in notif:
        notifications_module._notifications_enabled = bool(notif.get("enabled", True))

    alerts_module.dismissed_alerts.clear()
    dismissed = state.get("dismissed_alerts", [])
    if isinstance(dismissed, list):
        alerts_module.dismissed_alerts.extend(dismissed)
    alerts_module.transient_alerts.clear()
    transient = state.get("transient_alerts", [])
    if isinstance(transient, list):
        alerts_module.transient_alerts.extend([dict(a) for a in transient if isinstance(a, dict)])

    activity_module.restore(activity_entries or [])
    log_action(
        "system.restored",
        profile.business_name,
        f"Restored backup from {payload.get('exported_at', 'unknown time')} "
        f"({len(sales)} sales, {len(stock)} stock events)",
        {"sales": len(sales), "stock": len(stock)},
    )
    save_state()

    return {
        "restored": True,
        "message": f"Backup restored ({len(sales)} sales, {len(stock)} stock events).",
        "exported_at": payload.get("exported_at", ""),
    }
