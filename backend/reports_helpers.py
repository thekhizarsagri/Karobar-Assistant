"""Data helpers and constants for business reports."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.store import sales_log, stock_log
from backend.utils import parse_date

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
    result = parse_date(str(date_str))
    return result.date() if result else None


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
    initial = {e.product_name: e.quantity for e in stock_log if e.source == "form"}
    current = sum(p.stock_quantity * p.cost_price for p in profile.products)
    initial_value = sum(initial.get(p.name, 0) * p.cost_price for p in profile.products)
    return (initial_value + current) / 2 if initial_value > 0 else current


def _stock_health(profile) -> Dict[str, int]:
    health = {"ok": 0, "reorder": 0, "out": 0}
    for product in profile.products:
        if product.stock_quantity <= 0:
            health["out"] += 1
        elif product.stock_quantity <= product.reorder_point:
            health["reorder"] += 1
        else:
            health["ok"] += 1
    return health


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
