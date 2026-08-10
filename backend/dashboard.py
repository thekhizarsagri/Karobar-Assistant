"""Wire the profile, metrics, sales, and insights into one dashboard payload."""
from typing import Any, Dict

from backend.insights import get_latest_ai_insights
from backend.metrics import get_dashboard_summary
from backend.profile import build_profile_from_form
from backend.sales import get_sales_summary
from backend.store import products_snapshot


def build_dashboard_payload(form_data: Dict[str, Any]) -> Dict[str, Any]:
    profile = build_profile_from_form(form_data)
    summary = get_dashboard_summary(profile)
    # Include full product data (with stockAvailable) for the frontend
    summary["products"] = products_snapshot()
    summary["sales_summary"] = get_sales_summary()
    summary["ai_insights"] = get_latest_ai_insights()
    return summary