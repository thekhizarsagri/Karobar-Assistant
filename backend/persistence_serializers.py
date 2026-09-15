"""Dataclass <-> dict converters for file persistence."""
from dataclasses import asdict

from backend.models import BusinessProfile, Expense, ExpenseDeduction, Product, SaleEntry, StockEntry


def _profile_to_dict(profile):
    return None if profile is None else asdict(profile)


def _profile_from_dict(data):
    if not data:
        return None
    return BusinessProfile(
        business_name=data.get("business_name", ""),
        business_type=data.get("business_type", ""),
        owner_name=data.get("owner_name", ""),
        phone_number=data.get("phone_number", ""),
        location=data.get("location", ""),
        description=data.get("description", ""),
        email=data.get("email", "") or "",
        username=data.get("username", "") or "",
        password=data.get("password", "") or "",
        currency=data.get("currency", "₹") or "₹",
        tax_id=data.get("tax_id", "") or "",
        products=[_product_from_dict(p) for p in data.get("products", [])],
        expenses=[_expense_from_dict(e) for e in data.get("expenses", [])],
        available_balance=float(data.get("available_balance", 0) or 0),
        expense_deductions=[_deduction_from_dict(d) for d in data.get("expense_deductions", [])],
    )


def _product_from_dict(p) -> Product:
    return Product(
        name=p.get("name", ""),
        category=p.get("category", "Other") or "Other",
        selling_price=float(p.get("selling_price", 0) or 0),
        cost_price=float(p.get("cost_price", 0) or 0),
        stock_quantity=int(p.get("stock_quantity", 0) or 0),
        reorder_point=int(p.get("reorder_point", 0) or 0),
        sku=p.get("sku", "") or "",
        unit=p.get("unit", "pcs") or "pcs",
        description=p.get("description", "") or "",
    )


def _expense_from_dict(e) -> Expense:
    return Expense(
        key=e.get("key", ""),
        label=e.get("label", "") or "",
        amount=float(e.get("amount", 0) or 0),
        enabled=e.get("enabled", True),
        deduction_day=int(e.get("deduction_day", 1) or 1),
        deduction_time=e.get("deduction_time", "00:00") or "00:00",
        last_deducted=e.get("last_deducted", "") or "",
    )


def _deduction_from_dict(d) -> ExpenseDeduction:
    return ExpenseDeduction(
        expense_key=d.get("expense_key", ""),
        expense_label=d.get("expense_label", "") or "",
        amount=float(d.get("amount", 0) or 0),
        deducted_at=d.get("deducted_at", "") or "",
        balance_before=float(d.get("balance_before", 0) or 0),
        balance_after=float(d.get("balance_after", 0) or 0),
    )


def _sale_to_dict(entry: SaleEntry) -> dict:
    return asdict(entry)


def _sale_from_dict(data) -> SaleEntry:
    return SaleEntry(
        product_name=data.get("product_name", ""),
        quantity=int(data.get("quantity", 1) or 1),
        period=data.get("period", "day") or "day",
        entry_date=data.get("entry_date", "") or "",
        entry_type=data.get("entry_type", "auto") or "auto",
        created_at=data.get("created_at", "") or "",
    )


def _stock_to_dict(entry: StockEntry) -> dict:
    return asdict(entry)


def _stock_from_dict(data) -> StockEntry:
    return StockEntry(
        product_name=data.get("product_name", ""),
        quantity=int(data.get("quantity", 1) or 1),
        source=data.get("source", "manual") or "manual",
        note=data.get("note", "") or "",
        created_at=data.get("created_at", "") or "",
    )
