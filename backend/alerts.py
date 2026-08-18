"""Alert store: serves the AI alerts shown in the Alerts box and tracks
which alerts the user has dismissed so they don't reappear on refresh."""

from typing import Any, Dict, List

from backend.persistence import save_state


dismissed_alerts: List[str] = []


def alert_key(alert: Dict[str, Any]) -> str:
    return f"{alert['type']}:{alert['title']}"


def get_active_alerts(insights: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return generated alerts minus the ones the user dismissed.

    A dismissal only lasts while the alert is still actively firing. If the
    underlying condition clears (e.g. stock is restocked) the dismissal is
    forgotten so the alert can fire again if the problem returns.
    """
    alerts = insights.get("alerts", [])
    active_keys = {alert_key(alert) for alert in alerts}

    if dismissed_alerts and any(key not in active_keys for key in dismissed_alerts):
        dismissed_alerts[:] = [key for key in dismissed_alerts if key in active_keys]
        save_state()

    return [alert for alert in alerts if alert_key(alert) not in dismissed_alerts]


def clear_all(insights: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Dismiss every current alert so the Alerts box is emptied."""
    for alert in insights.get("alerts", []):
        key = alert_key(alert)
        if key not in dismissed_alerts:
            dismissed_alerts.append(key)
    save_state()
    return get_active_alerts(insights)


def reset_alerts() -> None:
    dismissed_alerts.clear()