"""Detailed inventory analytics: valuation, health status, and replenishment hints.

This module adds a full stock-overview layer on top of the in-memory store. It
applies classic inventory-management formulas:

* Gross margin percentage
* Average daily demand (units/day from the sales log)
* Safety stock (Z-score * daily demand std * sqrt(lead time))
* Reorder point (ROP) = daily demand * lead time + safety stock
* Order-up-to quantity (S) = daily demand * (lead time + review period) + safety stock
* Suggested reorder = max(0, S - current stock)
* Days of supply = current stock / average daily demand
"""
import math
from datetime import datetime
from typing import Any, Dict

from backend.store import get_profile
from backend.inventory_helpers import (
    DEAD_STOCK_DAYS,
    LEAD_TIME_DAYS,
    REVIEW_PERIOD_DAYS,
    SERVICE_Z,
    _category_breakdown,
    _days_since,
    _demand_stats,
    _last_restock,
    _product_sales,
    _recent_movements,
    _status,
    _summary,
)


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
