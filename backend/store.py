"""In-memory data store for the demo session."""
from typing import Any, Dict, List, Optional

from backend.models import BusinessProfile, SaleEntry, StockEntry
from backend.notifications import clear_notifications

sales_log: List[SaleEntry] = []
stock_log: List[StockEntry] = []
_current_profile: Optional[BusinessProfile] = None


def set_profile(profile: BusinessProfile) -> None:
    """Replace the active business profile and reset the sales/stock logs."""
    global _current_profile
    sales_log.clear()
    stock_log.clear()
    clear_notifications()
    _current_profile = profile
    for product in profile.products:
        stock_log.append(
            StockEntry(
                product_name=product.name,
                quantity=product.stock_quantity,
                source="form",
                note="Initial stock added in setup form",
                created_at=_now_iso(),
            )
        )


def get_profile() -> Optional[BusinessProfile]:
    """Return the active business profile, or None before setup."""
    return _current_profile


def _now_iso() -> str:
    from datetime import datetime

    return datetime.now().isoformat(timespec="seconds")


def product_order() -> List[str]:
    """Product names in the order they appear in the setup form."""
    profile = _current_profile
    return [] if profile is None else [product.name for product in profile.products]


def products_snapshot() -> List[Dict[str, Any]]:
    """Current product list with live stock values for the frontend."""
    if _current_profile is None:
        return []
    return [
        {
            "name": product.name,
            "category": product.category,
            "sellingPrice": product.selling_price,
            "costPrice": product.cost_price,
            "stockAvailable": product.stock_quantity,
        }
        for product in _current_profile.products
    ]


def sales_entries_for_ai() -> List[Dict[str, Any]]:
    """Flatten the sales log into the shape the AI layer expects."""
    return [
        {
            "productName": entry.product_name,
            "quantity": entry.quantity,
            "period": entry.period,
            "entryDate": entry.entry_date,
        }
        for entry in sales_log
    ]