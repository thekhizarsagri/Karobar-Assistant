"""Alert store: serves the AI alerts shown in the Alerts box and tracks
which alerts the user has dismissed so they don't reappear on refresh.

It also holds transient alerts: short-lived, action-driven messages (e.g. a
sale that was rejected because stock was too low). They appear in the Alerts
box alongside the AI alerts until the user clears them with "Clear all".
"""

from typing import Any, Dict, List

from backend.persistence import save_state


dismissed_alerts: List[str] = []
transient_alerts: List[Dict[str, Any]] = []


def alert_key(alert: Dict[str, Any]) -> str:
    return f"{alert['type']}:{alert['title']}"


def add_transient_alert(type_: str, title: str, message: str) -> Dict[str, Any]:
    """Register an action-driven alert (e.g. a rejected sale). No duplicates."""
    alert = {"type": type_, "title": title, "message": message}
    key = alert_key(alert)
    if any(alert_key(existing) == key for existing in transient_alerts):
        return alert
    transient_alerts.append(alert)
    save_state()
    return alert


def get_active_alerts(insights: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return transient + AI alerts minus the ones the user dismissed.

    A dismissal only lasts while an alert is still actively firing. If the
    underlying condition clears (e.g. stock is restocked or the transient
    alert is cleared) the dismissal is forgotten so the alert can fire again
    if the problem returns.
    """
    alerts = [*transient_alerts, *insights.get("alerts", [])]
    active_keys = {alert_key(alert) for alert in alerts}

    if dismissed_alerts and any(key not in active_keys for key in dismissed_alerts):
        dismissed_alerts[:] = [key for key in dismissed_alerts if key in active_keys]
        save_state()

    return [alert for alert in alerts if alert_key(alert) not in dismissed_alerts]


def clear_all(insights: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Dismiss every current alert (transient + AI) so the Alerts box is emptied."""
    for alert in [*transient_alerts, *insights.get("alerts", [])]:
        key = alert_key(alert)
        if key not in dismissed_alerts:
            dismissed_alerts.append(key)
    transient_alerts.clear()
    save_state()
    return get_active_alerts(insights)


def reset_alerts() -> None:
    dismissed_alerts.clear()
    transient_alerts.clear()