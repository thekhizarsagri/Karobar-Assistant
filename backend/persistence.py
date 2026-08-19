"""Optional file-based persistence.

Demo mode runs in-memory by default: every time the server starts the
data is fresh, while refreshes during a session keep everything (the
backend process stays alive).

Set `KAROBAR_PERSIST=1` to save state to disk instead. Data is written
to `KAROBAR_DATA_DIR` if set, otherwise `%APPDATA%/KarobarAssistant`
(PyInstaller build) or `<repo>/.karobar-data` (local dev).

`init()` must be called once at app startup (see backend/main.py) before
any data is written. Writes happen automatically from the mutation points
in backend/store.py, backend/sales.py, backend/stock.py and
backend/notifications.py.
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from backend.models import BusinessProfile, Expense, Product, SaleEntry, StockEntry

_ACTIVE = False


def _data_dir() -> Path:
    if os.environ.get("KAROBAR_DATA_DIR"):
        return Path(os.environ["KAROBAR_DATA_DIR"])
    if getattr(sys, "frozen", False) and os.environ.get("APPDATA"):
        return Path(os.environ["APPDATA"]) / "KarobarAssistant"
    return Path(__file__).resolve().parent.parent / ".karobar-data"


def _data_file() -> Path:
    return _data_dir() / "store.json"


def init() -> None:
    if os.environ.get("KAROBAR_PERSIST", "0") != "1":
        return
    global _ACTIVE
    _ACTIVE = True
    _load_from_disk()


def save_state() -> None:
    if not _ACTIVE:
        return
    from backend.alerts import dismissed_alerts
    from backend.notifications import _next_id, notifications
    from backend.store import _current_profile, sales_log, stock_log

    state = {
        "saved_at": datetime.now().isoformat(timespec="seconds"),
        "profile": _profile_to_dict(_current_profile),
        "sales": [_sale_to_dict(e) for e in sales_log],
        "stock": [_stock_to_dict(e) for e in stock_log],
        "notifications": {"items": notifications, "next_id": _next_id},
        "dismissed_alerts": list(dismissed_alerts),
    }
    file_path = _data_file()
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = file_path.with_suffix(".json.tmp")
        tmp_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        tmp_path.replace(file_path)
    except OSError:
        pass


def _load_from_disk() -> None:
    import backend.alerts as alerts_module
    import backend.notifications as notifications_module
    import backend.store as store_module

    file_path = _data_file()
    if not file_path.exists():
        return
    try:
        state = json.loads(file_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    profile = _profile_from_dict(state.get("profile"))
    if profile is not None:
        store_module.sales_log.clear()
        store_module.stock_log.clear()
        store_module._current_profile = profile
        for e in state.get("sales", []):
            store_module.sales_log.append(_sale_from_dict(e))
        for e in state.get("stock", []):
            store_module.stock_log.append(_stock_from_dict(e))

    notif = state.get("notifications") or {}
    notifications_module.notifications.clear()
    notifications_module.notifications.extend(notif.get("items", []))
    notifications_module._next_id = int(notif.get("next_id", 1) or 1)

    alerts_module.dismissed_alerts.clear()
    alerts_module.dismissed_alerts.extend(state.get("dismissed_alerts", []))


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