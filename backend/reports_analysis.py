"""Analysis functions for business reports."""
import math
from typing import Any, Dict, List

from backend.reports_helpers import (
    HOLDING_RATE,
    MONTH_NAMES,
    ORDERING_COST,
    TARGET_NET_MARGIN,
    TARGET_TURNOVER,
    _clamp,
)


def _health_score(net_margin: float, stock_health: Dict[str, int], turnover: float) -> Dict[str, Any]:
    profit_score = _clamp(100 * net_margin / TARGET_NET_MARGIN, 0, 100)
    total_products = sum(stock_health.values())
    stock_ratio = (stock_health["ok"] / total_products) if total_products else 0.0
    stock_score = stock_ratio * 100
    turnover_score = _clamp(100 * turnover / TARGET_TURNOVER, 0, 100)

    score = round(0.4 * profit_score + 0.3 * stock_score + 0.3 * turnover_score)
    if score >= 80:
        label = "Excellent"
    elif score >= 60:
        label = "Good"
    elif score >= 40:
        label = "Fair"
    else:
        label = "Needs attention"

    return {
        "score": score,
        "label": label,
        "profit_score": round(profit_score, 1),
        "stock_score": round(stock_score, 1),
        "turnover_score": round(turnover_score, 1),
        "net_margin": round(net_margin, 3),
    }


def _break_even(profile, total_expenses: float, revenue: float, gross_profit: float, units_sold: int) -> Dict[str, Any]:
    cm_ratio = (gross_profit / revenue) if revenue else 0.0
    be_revenue = (total_expenses / cm_ratio) if cm_ratio > 0 else None
    be_units = (total_expenses / (gross_profit / units_sold)) if units_sold > 0 and gross_profit > 0 else None

    products = []
    for product in profile.products:
        contribution = product.selling_price - product.cost_price
        units = (total_expenses / contribution) if contribution > 0 else None
        products.append(
            {
                "product": product.name,
                "contribution": round(contribution, 2),
                "margin_pct": round(contribution / product.selling_price * 100, 1) if product.selling_price > 0 else 0.0,
                "units": round(units) if units is not None else None,
                "revenue": round(units * product.selling_price) if units is not None else None,
            }
        )

    return {
        "total_expenses": round(total_expenses, 2),
        "cm_ratio": round(cm_ratio, 3),
        "revenue": round(be_revenue) if be_revenue is not None else None,
        "units": round(be_units) if be_units is not None else None,
        "products": products,
    }


def _product_demand(product_name: str, sales: List[Dict[str, Any]]) -> float:
    dates = [row["day"] for row in sales if row["product"] == product_name]
    if not dates:
        return 0.0
    span = max(1, (max(dates) - min(dates)).days + 1)
    total = sum(row["quantity"] for row in sales if row["product"] == product_name)
    return total / span


def _eoq(profile, sales: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for product in profile.products:
        daily = _product_demand(product.name, sales)
        annual_demand = daily * 365
        holding_cost = product.cost_price * HOLDING_RATE
        if annual_demand > 0 and holding_cost > 0:
            order_qty = math.sqrt(2 * annual_demand * ORDERING_COST / holding_cost)
            orders_per_year = annual_demand / order_qty
        else:
            order_qty = 0.0
            orders_per_year = 0.0
        result.append(
            {
                "product": product.name,
                "annual_demand": round(annual_demand),
                "cost_price": round(product.cost_price, 2),
                "holding_cost": round(holding_cost, 2),
                "order_qty": round(order_qty),
                "orders_per_year": round(orders_per_year, 1) if orders_per_year else 0.0,
            }
        )
    return result


def _seasonality(sales: List[Dict[str, Any]]) -> Dict[str, Any]:
    monthly_totals: Dict[int, int] = {}
    for row in sales:
        monthly_totals[row["month"]] = monthly_totals.get(row["month"], 0) + row["quantity"]
    total = sum(monthly_totals.values())
    has_data = total > 0
    uniform = total / 12 if total else 0.0
    index = [
        {
            "label": MONTH_NAMES[m],
            "value": round(monthly_totals.get(m + 1, 0) / uniform, 2) if uniform else None,
        }
        for m in range(12)
    ]
    return {"index": index, "has_data": has_data}


def _expense_pareto(profile) -> Dict[str, Any]:
    enabled = [(e.label, e.amount) for e in profile.expenses if e.enabled and e.amount > 0]
    enabled.sort(key=lambda pair: pair[1], reverse=True)
    total = sum(amount for _, amount in enabled)
    cumulative = 0.0
    pareto = []
    for label, amount in enabled:
        cumulative += amount
        pareto.append(
            {
                "label": label,
                "amount": round(amount, 2),
                "pct": round(amount / total * 100, 1) if total else 0.0,
                "cumulative_pct": round(cumulative / total * 100, 1) if total else 0.0,
            }
        )
    return {"total": round(total, 2), "pareto": pareto}
