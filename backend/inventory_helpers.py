import math
from datetime import datetime
from typing import Any, Dict, List

from backend.store import sales_log, stock_log

LEAD_TIME_DAYS = 3
REVIEW_PERIOD_DAYS = 7
SERVICE_Z = 1.65
DEAD_STOCK_DAYS = 30


def _status(stock: int, threshold: int) -> str:
    if stock <= 0:
        return "out"
    if threshold > 0 and stock <= threshold:
        return "reorder"
    return "ok"


def _product_sales(product_name: str) -> Dict[str, Any]:
    dates: List[Any] = []
    quantities: List[int] = []
    total = 0
    for entry in sales_log:
        if entry.product_name != product_name:
            continue
        try:
            day = datetime.strptime(entry.entry_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            try:
                day = datetime.strptime(entry.entry_date, "%Y-%m").date()
            except (ValueError, TypeError):
                continue
        dates.append(day)
        quantities.append(entry.quantity)
        total += entry.quantity
    return {
        "total": total,
        "first_date": min(dates) if dates else None,
        "last_date": max(dates) if dates else None,
        "dates": dates,
        "quantities": quantities,
    }


def _demand_stats(sales: Dict[str, Any]) -> tuple:
    if not sales["dates"]:
        return 0.0, 0.0
    span = max(1, (sales["last_date"] - sales["first_date"]).days + 1)
    avg = sales["total"] / span
    if span <= 1:
        return avg, 0.0
    daily_by_day: Dict[Any, int] = {}
    for day, qty in zip(sales["dates"], sales["quantities"]):
        daily_by_day[day] = daily_by_day.get(day, 0) + qty
    daily_values = list(daily_by_day.values())
    mean = sum(daily_values) / len(daily_values)
    variance = sum((v - mean) ** 2 for v in daily_values) / len(daily_values)
    return avg, math.sqrt(variance)


def _days_since(date) -> int:
    return (datetime.now().date() - date).days


def _last_restock(product_name: str) -> str | None:
    for entry in reversed(stock_log):
        if entry.product_name == product_name:
            return entry.created_at
    return None


def _summary(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_units = sum(item["stock"] for item in items)
    total_cost = sum(item["stock_value_cost"] for item in items)
    total_retail = sum(item["stock_value_retail"] for item in items)
    return {
        "total_units": int(total_units),
        "total_cost_value": round(total_cost, 2),
        "total_retail_value": round(total_retail, 2),
        "potential_profit": round(total_retail - total_cost, 2),
        "total_products": len(items),
        "out_of_stock": sum(1 for item in items if item["status"] == "out"),
        "needs_reorder": sum(1 for item in items if item["status"] == "reorder"),
        "healthy": sum(1 for item in items if item["status"] == "ok"),
    }


def _category_breakdown(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[str, Dict[str, Any]] = {}
    for item in items:
        entry = grouped.setdefault(
            item["category"] or "Other",
            {"category": item["category"] or "Other", "products": 0, "units": 0, "cost_value": 0.0, "retail_value": 0.0},
        )
        entry["products"] += 1
        entry["units"] += item["stock"]
        entry["cost_value"] += item["stock_value_cost"]
        entry["retail_value"] += item["stock_value_retail"]
    return [
        {
            "category": entry["category"],
            "products": entry["products"],
            "units": entry["units"],
            "cost_value": round(entry["cost_value"], 2),
            "retail_value": round(entry["retail_value"], 2),
        }
        for entry in sorted(grouped.values(), key=lambda c: c["retail_value"], reverse=True)
    ]


def _recent_movements(limit: int = 12) -> List[Dict[str, Any]]:
    rows = [
        {
            "product": entry.product_name,
            "quantity": entry.quantity,
            "source": entry.source,
            "note": entry.note,
            "created_at": entry.created_at,
        }
        for entry in reversed(stock_log)
    ]
    return rows[:limit]
