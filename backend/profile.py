"""Build a BusinessProfile from the setup form payload."""
from typing import Any, Dict

from backend.models import BusinessProfile, Expense, Product
from backend.store import set_profile
from backend.utils import cap


def build_profile_from_form(form_data: Dict[str, Any]) -> BusinessProfile:
    products = [
        Product(
            name=product.get("name", ""),
            category=product.get("category", "Other"),
            selling_price=cap(float(product.get("sellingPrice", 0) or 0)),
            cost_price=cap(float(product.get("costPrice", 0) or 0)),
            stock_quantity=cap(int(product.get("stockAvailable", 0) or 0)),
            reorder_point=cap(int(product.get("reorderPoint", 0) or 0)),
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
            amount=cap(float(item.get("amount", 0) or 0)),
            enabled=item.get("enabled", True),
            deduction_day=int(item.get("deductionDay", 1) or 1),
            deduction_time=item.get("deductionTime", "00:00") or "00:00",
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
        available_balance=0.0,
    )
    set_profile(profile)
    return profile