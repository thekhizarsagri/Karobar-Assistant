from __future__ import annotations

from typing import Any, Dict, List, Optional

from .models import BusinessProfile

try:
    import numpy as np
except Exception:  # pragma: no cover - optional dependency
    np = None

try:
    import pandas as pd
except Exception:  # pragma: no cover - optional dependency
    pd = None


def calculate_profitability(profile: BusinessProfile) -> Dict[str, float]:
    total_revenue = sum(product.selling_price for product in profile.products)
    total_cost = sum(product.cost_price for product in profile.products)
    total_expenses = sum(expense.amount for expense in profile.expenses if expense.enabled)

    gross_profit = total_revenue - total_cost
    net_profit = gross_profit - total_expenses
    break_even = max(total_expenses, 1)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "gross_profit": round(gross_profit, 2),
        "net_profit": round(net_profit, 2),
        "total_expenses": round(total_expenses, 2),
        "break_even": round(break_even, 2),
    }


def get_dashboard_summary(profile: BusinessProfile) -> Dict[str, object]:
    metrics = calculate_profitability(profile)

    return {
        "business_name": profile.business_name,
        "owner_name": profile.owner_name,
        "status": "Healthy" if metrics["net_profit"] >= 0 else "Needs attention",
        "metrics": metrics,
    }


def _normalize_sales_entries(sales_entries: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for entry in sales_entries or []:
        if not entry:
            continue
        normalized.append(
            {
                "productName": entry.get("productName") or entry.get("product_name") or "",
                "quantity": int(entry.get("quantity", 0) or 0),
                "period": entry.get("period", "day"),
                "entryDate": entry.get("entryDate") or entry.get("entry_date") or "",
            }
        )
    return normalized


def _forecast_next_period_units(sales_entries: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    normalized = _normalize_sales_entries(sales_entries)
    if not normalized:
        return {"next_period_units": 0, "trend": "stable", "confidence": "low"}

    if pd is not None:
        try:
            frame = pd.DataFrame(normalized)
            frame["entryDate"] = pd.to_datetime(frame["entryDate"], errors="coerce")
            frame = frame.dropna(subset=["entryDate"]).sort_values("entryDate")
            if not frame.empty:
                values = frame["quantity"].tail(7).tolist()
                if len(values) >= 2:
                    if np is not None:
                        x = np.arange(1, len(values) + 1)
                        slope, intercept = np.polyfit(x, values, 1)
                        next_value = slope * (len(values) + 1) + intercept
                    else:
                        slope = (values[-1] - values[0]) / max(len(values) - 1, 1)
                        next_value = values[-1] + slope
                    forecast = max(0, round(float(next_value)))
                    trend = "upward" if forecast > values[-1] else "steady" if forecast == values[-1] else "downward"
                    return {"next_period_units": forecast, "trend": trend, "confidence": "high" if len(values) >= 6 else "medium"}
        except Exception:
            pass

    values = [entry["quantity"] for entry in normalized[-7:]]
    if len(values) >= 2:
        slope = (values[-1] - values[0]) / max(len(values) - 1, 1)
        forecast = max(0, round(values[-1] + slope))
        trend = "upward" if forecast > values[-1] else "steady" if forecast == values[-1] else "downward"
        return {"next_period_units": forecast, "trend": trend, "confidence": "medium" if len(values) >= 3 else "low"}

    return {"next_period_units": max(values, default=0), "trend": "stable", "confidence": "low"}


def generate_ai_insights(profile: BusinessProfile, sales_entries: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    metrics = calculate_profitability(profile)
    forecast = _forecast_next_period_units(sales_entries)
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
