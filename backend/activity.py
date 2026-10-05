"""Append-only activity / audit log for the Karobar Assistant backend.

Every business mutation (sales, stock, products, expenses, profile,
system events) appends one human-readable entry here. The log is
capped so it never grows unbounded, survives restarts via
``backend.persistence``, and is exposed to the frontend through
``GET /api/activity``.

This module is deliberately dependency-free (no imports from store,
sales, or persistence) so all other backend modules can safely import
it without creating import cycles. Callers are responsible for calling
``save_state()`` after logging when persistence is desired.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

MAX_ENTRIES = 200

activity_log: List[Dict[str, Any]] = []
_next_id: int = 1


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def log_action(action: str, entity: str = "", message: str = "", detail: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Append one entry and return it.

    ``action`` is a machine-stable code like ``sale.recorded``.
    ``entity`` is the primary subject (product / expense name).
    ``message`` is the human-readable line shown in the timeline.
    """
    global _next_id
    entry = {
        "id": _next_id,
        "timestamp": _now_iso(),
        "action": action,
        "entity": entity or "",
        "message": message or f"{action} {entity}".strip(),
        "detail": dict(detail or {}),
    }
    _next_id += 1
    activity_log.append(entry)
    # Ring buffer: drop oldest, never grow unbounded.
    while len(activity_log) > MAX_ENTRIES:
        activity_log.pop(0)
    return entry


def get_activity(limit: int = 50, action_filter: Optional[str] = None) -> Dict[str, Any]:
    """Return newest-first entries, optionally filtered by action prefix/type."""
    try:
        limit = int(limit or 50)
    except (TypeError, ValueError):
        limit = 50
    limit = max(1, min(limit, MAX_ENTRIES))

    items = list(reversed(activity_log))
    if action_filter:
        prefix = action_filter.strip().lower()
        if prefix:
            items = [
                e for e in items
                if e.get("action", "").lower() == prefix
                or e.get("action", "").lower().startswith(prefix + ".")
                or e.get("action", "").lower().split(".")[0] == prefix
            ]
    return {"items": items[:limit], "total": len(activity_log)}


def clear_activity() -> None:
    """Empty the log and reset the id counter (used on reset / fresh setup)."""
    global _next_id
    activity_log.clear()
    _next_id = 1


def snapshot() -> List[Dict[str, Any]]:
    """Return a JSON-safe copy for persistence / backup export."""
    return [dict(e) | {"detail": dict(e.get("detail", {}))} for e in activity_log]


def restore(entries: List[Dict[str, Any]]) -> None:
    """Replace the log from persisted / backup data (tolerates bad rows)."""
    global _next_id
    activity_log.clear()
    _next_id = 1
    if not isinstance(entries, list):
        return
    for raw in entries[-MAX_ENTRIES:]:
        if not isinstance(raw, dict):
            continue
        action = str(raw.get("action", "") or "").strip()
        if not action:
            continue
        try:
            entry_id = int(raw.get("id", _next_id) or _next_id)
        except (TypeError, ValueError):
            entry_id = _next_id
        entry = {
            "id": entry_id,
            "timestamp": str(raw.get("timestamp", "") or _now_iso()),
            "action": action,
            "entity": str(raw.get("entity", "") or ""),
            "message": str(raw.get("message", "") or action),
            "detail": dict(raw.get("detail", {}) or {}),
        }
        activity_log.append(entry)
        _next_id = max(_next_id, entry_id + 1)
