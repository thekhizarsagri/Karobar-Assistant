from backend.models import BusinessProfile, Expense, ExpenseDeduction, Product, SaleEntry, StockEntry


def _profile_to_dict(profile):
    if profile is None:
        return None
    return {
        "business_name": profile.business_name,
        "business_type": profile.business_type,
        "owner_name": profile.owner_name,
        "phone_number": profile.phone_number,
        "location": profile.location,
        "description": profile.description,
        "products": [
            {
                "name": p.name,
                "category": p.category,
                "selling_price": p.selling_price,
                "cost_price": p.cost_price,
                "stock_quantity": p.stock_quantity,
                "reorder_point": p.reorder_point,
                "sku": p.sku,
                "unit": p.unit,
                "description": p.description,
            }
            for p in profile.products
        ],
        "expenses": [
            {
                "key": e.key,
                "label": e.label,
                "amount": e.amount,
                "enabled": e.enabled,
                "deduction_day": e.deduction_day,
                "deduction_time": e.deduction_time,
                "last_deducted": e.last_deducted,
            }
            for e in profile.expenses
        ],
        "available_balance": profile.available_balance,
        "email": profile.email,
        "username": profile.username,
        "password": profile.password,
        "currency": profile.currency,
        "tax_id": profile.tax_id,
        "expense_deductions": [
            {
                "expense_key": d.expense_key,
                "expense_label": d.expense_label,
                "amount": d.amount,
                "deducted_at": d.deducted_at,
                "balance_before": d.balance_before,
                "balance_after": d.balance_after,
            }
            for d in profile.expense_deductions
        ],
    }


def _profile_from_dict(data):
    if not data:
        return None
    products = [
        Product(
            name=p["name"],
            category=p.get("category", "Other"),
            selling_price=float(p.get("selling_price", 0) or 0),
            cost_price=float(p.get("cost_price", 0) or 0),
            stock_quantity=int(p.get("stock_quantity", 0) or 0),
            reorder_point=int(p.get("reorder_point", 0) or 0),
            sku=p.get("sku", "") or "",
            unit=p.get("unit", "pcs") or "pcs",
            description=p.get("description", "") or "",
        )
        for p in data.get("products", [])
    ]
    expenses = [
        Expense(
            key=e["key"],
            label=e.get("label", ""),
            amount=float(e.get("amount", 0) or 0),
            enabled=e.get("enabled", True),
            deduction_day=int(e.get("deduction_day", 1) or 1),
            deduction_time=e.get("deduction_time", "00:00") or "00:00",
            last_deducted=e.get("last_deducted", "") or "",
        )
        for e in data.get("expenses", [])
    ]
    deductions = [
        ExpenseDeduction(
            expense_key=d["expense_key"],
            expense_label=d.get("expense_label", ""),
            amount=float(d.get("amount", 0) or 0),
            deducted_at=d.get("deducted_at", ""),
            balance_before=float(d.get("balance_before", 0) or 0),
            balance_after=float(d.get("balance_after", 0) or 0),
        )
        for d in data.get("expense_deductions", [])
    ]
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
        products=products,
        expenses=expenses,
        available_balance=float(data.get("available_balance", 0) or 0),
        expense_deductions=deductions,
    )


def _sale_to_dict(entry: SaleEntry) -> dict:
    return {
        "product_name": entry.product_name,
        "quantity": entry.quantity,
        "period": entry.period,
        "entry_date": entry.entry_date,
        "entry_type": entry.entry_type,
        "created_at": entry.created_at,
    }


def _sale_from_dict(data) -> SaleEntry:
    return SaleEntry(
        product_name=data.get("product_name", ""),
        quantity=int(data.get("quantity", 1) or 1),
        period=data.get("period", "day"),
        entry_date=data.get("entry_date", ""),
        entry_type=data.get("entry_type", "auto"),
        created_at=data.get("created_at", ""),
    )


def _stock_to_dict(entry: StockEntry) -> dict:
    return {
        "product_name": entry.product_name,
        "quantity": entry.quantity,
        "source": entry.source,
        "note": entry.note,
        "created_at": entry.created_at,
    }


def _stock_from_dict(data) -> StockEntry:
    return StockEntry(
        product_name=data.get("product_name", ""),
        quantity=int(data.get("quantity", 1) or 1),
        source=data.get("source", "manual"),
        note=data.get("note", ""),
        created_at=data.get("created_at", ""),
    )
