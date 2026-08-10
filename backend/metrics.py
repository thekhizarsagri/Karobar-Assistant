"""Profitability metrics and the dashboard summary."""
from typing import Any, Dict

from backend.models import BusinessProfile


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