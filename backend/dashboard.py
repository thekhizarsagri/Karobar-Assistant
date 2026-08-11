"""Wire the profile, metrics, sales, and insights into one dashboard payload."""
from typing import Any, Dict

from backend.insights import get_latest_ai_insights
from backend.metrics import get_dashboard_summary
from backend.notifications import sync_alerts_from_insights
from backend.profile import build_profile_from_form
from backend.sales import get_sales_summary
from backend.store import products_snapshot


def build_dashboard_payload(form_data: Dict[str, Any]) -> Dict[str, Any]:
    profile = build_profile_from_form(form_data)
    summary = get_dashboard_summary(profile)
    # Include full product data (with stockAvailable) for the frontend
    summary["products"] = products_snapshot()
    summary["expenses"] = [
        {"key": expense.key, "label": expense.label, "amount": expense.amount, "enabled": expense.enabled}
        for expense in profile.expenses
    ]
    summary["sales_summary"] = get_sales_summary()
    insights = get_latest_ai_insights()
    sync_alerts_from_insights(insights)
    summary["ai_insights"] = insights
    return summary