"""AI-powered business alerts, recommendations, and profit health."""
from typing import Any, Dict, List, Optional

from backend.forecast import forecast_next_period
from backend.metrics import calculate_profitability
from backend.models import BusinessProfile
from backend.store import get_profile, sales_entries_for_ai

def empty_insights() -> Dict[str, Any]:
    return {
        "forecast": {"next_period_units": 0, "trend": "stable", "confidence": "low"},
        "alerts": [],
        "recommendations": [],
    }


def generate_ai_insights(profile: BusinessProfile, sales_entries: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    metrics = calculate_profitability(profile)
    forecast = forecast_next_period(sales_entries)
    alerts: List[Dict[str, Any]] = []
    recommendations: List[str] = []

    for product in profile.products:
        if product.stock_quantity <= product.reorder_point:
            alerts.append(
                {
                    "type": "stock",
                    "title": f"Low stock for {product.name}",
                    "message": f"Only {product.stock_quantity} units remain and the reorder point is {product.reorder_point}.",
                }
            )
            recommendations.append(f"Reorder {product.name} before it runs out.")

    if metrics["net_profit"] < 0:
        alerts.append(
            {
                "type": "profit",
                "title": "Net profit is negative",
                "message": "Expenses exceed revenue. Review expenses and focus on fast-moving products.",
            }
        )
        recommendations.append("Trim unnecessary expenses and concentrate on the products with the strongest demand.")

    if forecast["next_period_units"] > 0:
        recommendations.append("Push a small promotion on popular products to capture the expected demand.")

    if not alerts:
        alerts.append(
            {
                "type": "info",
                "title": "Business looks steady",
                "message": "No urgent issues were detected. Keep monitoring the dashboard daily.",
            }
        )

    if not recommendations:
        recommendations.append("Keep monitoring sales and stock levels closely.")

    return {
        "forecast": forecast,
        "alerts": alerts,
        "recommendations": recommendations,
        "profitability": metrics,
    }


def get_latest_ai_insights() -> Dict[str, Any]:
    if get_profile() is None:
        return empty_insights()
    return generate_ai_insights(get_profile(), sales_entries_for_ai())