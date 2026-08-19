"""Wire the profile, metrics, sales, and insights into one dashboard payload."""
from typing import Any, Dict

from backend.metrics import get_dashboard_summary
from backend.profile import build_profile_from_form
from backend.sales import get_sales_summary
from backend.store import get_profile, products_snapshot


def _dashboard_payload(profile) -> Dict[str, Any]:
    summary = get_dashboard_summary(profile)
    # Include full product data (with stockAvailable) for the frontend
    summary["products"] = products_snapshot()
    summary["expenses"] = [
        {"key": expense.key, "label": expense.label, "amount": expense.amount, "enabled": expense.enabled}
        for expense in profile.expenses
    ]
    summary["sales_summary"] = get_sales_summary()
    return summary


def build_dashboard_payload(form_data: Dict[str, Any]) -> Dict[str, Any]:
    profile = build_profile_from_form(form_data)
    return _dashboard_payload(profile)


def build_current_dashboard_payload() -> Dict[str, Any]:
    """Payload for the persisted profile, used to restore the dashboard on reload."""
    profile = get_profile()
    if profile is None:
        return {}
    return _dashboard_payload(profile)