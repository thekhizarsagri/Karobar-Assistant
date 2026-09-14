"""In-memory data store for the demo session."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.alerts import reset_alerts
from backend.models import BusinessProfile, Product, SaleEntry, StockEntry
from backend.notifications import clear_notifications
from backend.persistence import save_state
from backend.utils import cap

sales_log: List[SaleEntry] = []
stock_log: List[StockEntry] = []
_current_profile: Optional[BusinessProfile] = None


def set_profile(profile: BusinessProfile) -> None:
    """Replace the active business profile and reset the sales/stock logs."""
    global _current_profile
    sales_log.clear()
    stock_log.clear()
    clear_notifications()
    reset_alerts()
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
    save_state()


def get_profile() -> Optional[BusinessProfile]:
    """Return the active business profile, or None before setup."""
    return _current_profile


def update_profile(fields: Dict[str, Any]) -> Optional[BusinessProfile]:
    """Update specific fields on the active profile without clearing sales/stock."""
    global _current_profile
    if _current_profile is None:
        return None
    field_map = {
        "ownerName": "owner_name",
        "username": "username",
        "email": "email",
        "password": "password",
        "businessName": "business_name",
        "businessType": "business_type",
        "phoneNumber": "phone_number",
        "location": "location",
        "description": "description",
        "currency": "currency",
        "taxId": "tax_id",
    }
    for key, attr in field_map.items():
        if key in fields:
            setattr(_current_profile, attr, fields[key])
    save_state()
    return _current_profile


def reset() -> None:
    """Clear all business data (profile, sales, stock, notifications)."""
    global _current_profile
    sales_log.clear()
    stock_log.clear()
    clear_notifications()
    reset_alerts()
    _current_profile = None
    save_state()


def _to_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: Any) -> int:
    try:
        return int(float(value or 0))
    except (TypeError, ValueError):
        return 0


def add_product(fields: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new product to the active profile.

    Returns {"product": name} on success, or {"error": code} where code is
    one of: no_profile, name_required, duplicate_product, invalid_price.
    The initial stock is logged with source "form" so it counts as the
    starting baseline (same as setup-form products), not a stock change.
    """
    global _current_profile
    if _current_profile is None:
        return {"error": "no_profile"}
    name = str(fields.get("name", "")).strip()
    if not name:
        return {"error": "name_required"}
    if any(p.name.strip().lower() == name.lower() for p in _current_profile.products):
        return {"error": "duplicate_product"}
    selling_price = cap(_to_float(fields.get("sellingPrice")))
    if selling_price <= 0:
        return {"error": "invalid_price"}
    stock_quantity = cap(_to_int(fields.get("stockAvailable")))
    product = Product(
        name=name,
        category=str(fields.get("category", "Other") or "Other"),
        selling_price=selling_price,
        cost_price=cap(_to_float(fields.get("costPrice"))),
        stock_quantity=stock_quantity,
        reorder_point=cap(_to_int(fields.get("reorderPoint", 10))),
        sku=str(fields.get("sku", "") or ""),
        unit=str(fields.get("unit", "pcs") or "pcs"),
        description=str(fields.get("description", "") or ""),
    )
    _current_profile.products.append(product)
    stock_log.append(
        StockEntry(
            product_name=name,
            quantity=stock_quantity,
            source="form",
            note="Product added from inventory",
            created_at=_now_iso(),
        )
    )
    save_state()
    return {"product": name}


def _now_iso() -> str:
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
            "sku": product.sku,
            "unit": product.unit,
            "description": product.description,
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