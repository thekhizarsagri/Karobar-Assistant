"""Stock management: read, adjust, and add inventory for products."""
from typing import Any, Dict

from backend.models import StockEntry
from backend.store import get_profile, products_snapshot, stock_log


def get_profile_products():
    """Products of the active profile, or an empty list."""
    profile = get_profile()
    return [] if profile is None else profile.products


def get_stock_for_product(product_name: str) -> int:
    """Return current stock for a product, or -1 if not found."""
    for product in get_profile_products():
        if product.name == product_name:
            return product.stock_quantity
    return -1


def update_stock_quantity(product_name: str, delta: int) -> int:
    """Add `delta` units (negative = sale) clamped to >= 0. Returns new level, -1 if not found."""
    for product in get_profile_products():
        if product.name == product_name:
            product.stock_quantity = max(0, product.stock_quantity + delta)
            return product.stock_quantity
    return -1


def add_stock(product_name: str, quantity: int, mode: str = "oneTime") -> Dict[str, Any]:
    """Add stock for a product, log the event, and return an updated snapshot."""
    new_level = update_stock_quantity(product_name, quantity)
    from datetime import datetime

    stock_log.append(
        StockEntry(
            product_name=product_name,
            quantity=quantity,
            source=mode,
            note="Stock added via add-stock feature",
            created_at=datetime.now().isoformat(timespec="seconds"),
        )
    )
    return {
        "message": f"Stock updated for {product_name}",
        "productName": product_name,
        "newStock": new_level,
        "mode": mode,
        "products": products_snapshot(),
    }