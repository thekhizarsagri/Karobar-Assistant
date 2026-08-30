"""Data helpers and constants for business reports."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.store import sales_log, stock_log

ORDERING_COST = 50.0
HOLDING_RATE = 0.20
TARGET_NET_MARGIN = 0.20
TARGET_TURNOVER = 6.0
MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def _parse_day(date_str: Any) -> Optional[Any]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            return datetime.strptime(str(date_str), fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _sales_rows(profile) -> List[Dict[str, Any]]:
    info = {product.name: (product.selling_price, product.cost_price) for product in profile.products}
    rows: List[Dict[str, Any]] = []
    for entry in sales_log:
        day = _parse_day(entry.entry_date)
        if day is None:
            continue
        selling, cost = info.get(entry.product_name, (0.0, 0.0))
        rows.append(
            {
                "product": entry.product_name,
                "quantity": entry.quantity,
                "day": day,
                "month": day.month,
                "revenue": entry.quantity * selling,
                "cogs": entry.quantity * cost,
            }
        )
    return rows


def _enabled_expenses(profile) -> float:
    return sum(expense.amount for expense in profile.expenses if expense.enabled)


def _avg_inventory_cost(profile) -> float:
    initial: Dict[str, int] = {}
    for entry in stock_log:
        if entry.source == "form":
            initial[entry.product_name] = entry.quantity
    current = 0.0
    initial_value = 0.0
    for product in profile.products:
        current += product.stock_quantity * product.cost_price
        initial_value += initial.get(product.name, 0) * product.cost_price
    if initial_value > 0:
        return (initial_value + current) / 2
    return current


def _stock_health(profile) -> Dict[str, int]:
    ok = reorder = out = 0
    for product in profile.products:
        if product.stock_quantity <= 0:
            out += 1
        elif product.stock_quantity <= product.reorder_point:
            reorder += 1
        else:
            ok += 1
    return {"ok": ok, "reorder": reorder, "out": out}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
