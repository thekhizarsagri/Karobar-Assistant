"""In-memory data store for the demo session."""
from typing import Any, Dict, List, Optional

from backend.models import BusinessProfile, SaleEntry

sales_log: List[SaleEntry] = []
_current_profile: Optional[BusinessProfile] = None


def set_profile(profile: BusinessProfile) -> None:
    """Replace the active business profile and reset the sales log."""
    global _current_profile
    sales_log.clear()
    _current_profile = profile


def get_profile() -> Optional[BusinessProfile]:
    """Return the active business profile, or None before setup."""
    return _current_profile


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