from backend.models import BusinessProfile, Expense, Product, SaleEntry, StockEntry


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
            }
            for p in profile.products
        ],
        "expenses": [
            {"key": e.key, "label": e.label, "amount": e.amount, "enabled": e.enabled}
            for e in profile.expenses
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
        )
        for p in data.get("products", [])
    ]
    expenses = [
        Expense(
            key=e["key"],
            label=e.get("label", ""),
            amount=float(e.get("amount", 0) or 0),
            enabled=e.get("enabled", True),
        )
        for e in data.get("expenses", [])
    ]
    return BusinessProfile(
        business_name=data.get("business_name", ""),
        business_type=data.get("business_type", ""),
        owner_name=data.get("owner_name", ""),
        phone_number=data.get("phone_number", ""),
        location=data.get("location", ""),
        description=data.get("description", ""),
        products=products,
        expenses=expenses,
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
