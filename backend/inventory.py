"""Detailed inventory analytics: valuation, health status, and replenishment hints.

This module adds a full stock-overview layer on top of the in-memory store. It
applies classic inventory-management formulas:

* Gross margin percentage
* Average daily demand (units/day from the sales log)
* Safety stock (Z-score × daily demand std × sqrt(lead time))
* Reorder point (ROP) = daily demand × lead time + safety stock
* Order-up-to quantity (S) = daily demand × (lead time + review period) + safety stock
* Suggested reorder = max(0, S − current stock)
* Days of supply = current stock / average daily demand
"""
import math
from datetime import datetime
from typing import Any, Dict, List

from backend.store import get_profile, sales_log, stock_log

# Classic (R, S) inventory-policy defaults for a small business.
LEAD_TIME_DAYS = 3      # how long a restock takes
REVIEW_PERIOD_DAYS = 7  # how often stock is checked/replenished
SERVICE_Z = 1.65        # Z-score for a ~95% service level
DEAD_STOCK_DAYS = 30    # no sales for this long -> considered dead stock


def get_inventory_data(category: str | None = None) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return empty_payload()

    items = [_product_row(product) for product in profile.products]
    if category:
        items = [item for item in items if item["category"] == category]
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "summary": _summary(items),
        "items": items,
        "categories": _category_breakdown(items),
        "movements": _recent_movements(),
    }


def empty_payload() -> Dict[str, Any]:
    return {
        "generated_at": "",
        "summary": {
            "total_units": 0,
            "total_cost_value": 0.0,
            "total_retail_value": 0.0,
            "potential_profit": 0.0,
            "total_products": 0,
            "out_of_stock": 0,
            "needs_reorder": 0,
            "healthy": 0,
        },
        "items": [],
        "categories": [],
        "movements": [],
    }


# ---------------------------------------------------------------------------
# Per-product row
# ---------------------------------------------------------------------------

def _product_row(product) -> Dict[str, Any]:
    sales = _product_sales(product.name)
    avg_daily, std_daily = _demand_stats(sales)
    days_since_last_sale = _days_since(sales["last_date"]) if sales["last_date"] else None

    safety_stock = round(SERVICE_Z * std_daily * math.sqrt(LEAD_TIME_DAYS)) if std_daily else 0
    rop_recommended = math.ceil(avg_daily * LEAD_TIME_DAYS + safety_stock)
    order_up_to = math.ceil(avg_daily * (LEAD_TIME_DAYS + REVIEW_PERIOD_DAYS) + safety_stock)

    stock = int(product.stock_quantity)
    cost = float(product.cost_price)
    selling = float(product.selling_price)
    unit_margin = selling - cost
    margin_pct = (unit_margin / selling * 100) if selling > 0 else 0.0

    threshold = int(product.reorder_point) if product.reorder_point > 0 else rop_recommended
    status = _status(stock, threshold)

    return {
        "name": product.name,
        "category": product.category,
        "stock": stock,
        "cost_price": round(cost, 2),
        "selling_price": round(selling, 2),
        "unit_margin": round(unit_margin, 2),
        "margin_pct": round(margin_pct, 1),
        "stock_value_cost": round(stock * cost, 2),
        "stock_value_retail": round(stock * selling, 2),
        "reorder_point": int(product.reorder_point),
        "reorder_point_recommended": rop_recommended,
        "status": status,
        "avg_daily": round(avg_daily, 2),
        "days_of_supply": round(stock / avg_daily, 1) if avg_daily > 0 else None,
        "suggested_reorder": max(0, order_up_to - stock),
        "last_restock": _last_restock(product.name),
        "last_sale": sales["last_date"],
        "days_since_last_sale": days_since_last_sale,
        "dead_stock": days_since_last_sale is not None and days_since_last_sale >= DEAD_STOCK_DAYS,
    }


def _status(stock: int, threshold: int) -> str:
    if stock <= 0:
        return "out"
    if threshold > 0 and stock <= threshold:
        return "reorder"
    return "ok"


# ---------------------------------------------------------------------------
# Demand helpers
# ---------------------------------------------------------------------------

def _product_sales(product_name: str) -> Dict[str, Any]:
    dates: List[Any] = []
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
        total += entry.quantity
    return {
        "total": total,
        "first_date": min(dates) if dates else None,
        "last_date": max(dates) if dates else None,
        "dates": dates,
    }


def _demand_stats(sales: Dict[str, Any]) -> tuple:
    """Return (avg daily units, std dev of daily units)."""
    if not sales["dates"]:
        return 0.0, 0.0
    span = max(1, (sales["last_date"] - sales["first_date"]).days + 1)
    avg = sales["total"] / span
    if span <= 1:
        return avg, 0.0
    daily_by_day: Dict[Any, int] = {}
    for day in sales["dates"]:
        daily_by_day[day] = daily_by_day.get(day, 0) + 1
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


# ---------------------------------------------------------------------------
# Aggregates
# ---------------------------------------------------------------------------

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