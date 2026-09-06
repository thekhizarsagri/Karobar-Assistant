"""Profitability metrics and the dashboard summary."""
from typing import Dict

from backend.models import BusinessProfile
from backend.store import sales_log


def calculate_profitability(profile: BusinessProfile) -> Dict[str, float]:
    """Calculate profitability based on actual sales data."""
    price_map = {product.name: (product.selling_price, product.cost_price) for product in profile.products}

    total_revenue = 0.0
    total_cogs = 0.0
    for entry in sales_log:
        selling, cost = price_map.get(entry.product_name, (0.0, 0.0))
        total_revenue += entry.quantity * selling
        total_cogs += entry.quantity * cost

    total_expenses = sum(expense.amount for expense in profile.expenses if expense.enabled)

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    return {
        "gross_profit": round(gross_profit, 2),
        "net_profit": round(net_profit, 2),
        "total_expenses": round(total_expenses, 2),
        "total_revenue": round(total_revenue, 2),
        "total_cogs": round(total_cogs, 2),
        "available_balance": round(profile.available_balance, 2),
    }


def get_dashboard_summary(profile: BusinessProfile) -> Dict[str, object]:
    metrics = calculate_profitability(profile)

    total_monthly = sum(e.amount for e in profile.expenses if e.enabled)
    next_deductions = []
    for e in profile.expenses:
        if e.enabled and e.amount > 0:
            next_deductions.append({
                "key": e.key,
                "label": e.label,
                "amount": e.amount,
                "deduction_day": e.deduction_day,
                "deduction_time": e.deduction_time,
                "last_deducted": e.last_deducted,
            })

    recent_deductions = []
    for d in profile.expense_deductions[-10:]:
        recent_deductions.append({
            "expense_key": d.expense_key,
            "expense_label": d.expense_label,
            "amount": d.amount,
            "deducted_at": d.deducted_at,
            "balance_before": d.balance_before,
            "balance_after": d.balance_after,
        })

    return {
        "business_name": profile.business_name,
        "owner_name": profile.owner_name,
        "status": "Healthy" if metrics["net_profit"] >= 0 else "Needs attention",
        "metrics": metrics,
        "total_monthly_expenses": round(total_monthly, 2),
        "next_deductions": next_deductions,
        "recent_deductions": recent_deductions,
    }