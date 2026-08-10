"""Build a BusinessProfile from the setup form payload."""
from typing import Any, Dict

from backend.models import BusinessProfile, Expense, Product
from backend.store import set_profile


def build_profile_from_form(form_data: Dict[str, Any]) -> BusinessProfile:
    products = [
        Product(
            name=product.get("name", ""),
            category=product.get("category", "Other"),
            selling_price=float(product.get("sellingPrice", 0) or 0),
            cost_price=float(product.get("costPrice", 0) or 0),
            stock_quantity=int(product.get("stockAvailable", 0) or 0),
            reorder_point=int(product.get("reorderPoint", 0) or 0),
        )
        for product in form_data.get("products", [])
    ]

    expenses = [
        Expense(
            key=item["key"],
            label=item["label"],
            amount=float(item.get("amount", 0) or 0),
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
        products=products,
        expenses=expenses,
    )
    set_profile(profile)
    return profile