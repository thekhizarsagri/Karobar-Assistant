"""Build a BusinessProfile from the setup form payload."""
from typing import Any, Dict

from backend.models import BusinessProfile, Expense, Product
from backend.store import set_profile

TRILLION = 1_000_000_000_000


def _cap(value, limit=TRILLION):
    return max(0, min(value, limit))


def build_profile_from_form(form_data: Dict[str, Any]) -> BusinessProfile:
    products = [
        Product(
            name=product.get("name", ""),
            category=product.get("category", "Other"),
            selling_price=_cap(float(product.get("sellingPrice", 0) or 0)),
            cost_price=_cap(float(product.get("costPrice", 0) or 0)),
            stock_quantity=_cap(int(product.get("stockAvailable", 0) or 0)),
            reorder_point=_cap(int(product.get("reorderPoint", 0) or 0)),
            sku=str(product.get("sku", "")),
            unit=str(product.get("unit", "pcs")),
            description=str(product.get("description", "")),
        )
        for product in form_data.get("products", [])
    ]

    expenses = [
        Expense(
            key=item["key"],
            label=item["label"],
            amount=_cap(float(item.get("amount", 0) or 0)),
            enabled=item.get("enabled", True),
        )
        for item in form_data.get("expenses", [])
    ]

    profile = BusinessProfile(
        business_name=form_data.get("businessName", ""),
        business_type=form_data.get("businessType", ""),
        owner_name=form_data.get("ownerName", ""),
        phone_number=form_data.get("phoneNumber", ""),
        location=form_data.get("location", ""),
        description=form_data.get("description", ""),
        email=str(form_data.get("email", "")),
        username=str(form_data.get("username", "")),
        password=str(form_data.get("password", "")),
        currency=str(form_data.get("currency", "₹")),
        tax_id=str(form_data.get("taxId", "")),
        products=products,
        expenses=expenses,
    )
    set_profile(profile)
    return profile