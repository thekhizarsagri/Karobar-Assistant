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

from backend.models import BusinessProfile, Expense, Product, PurchaseOrder, SaleEntry, StockEntry, Supplier
from backend.persistence_serializers import (
    _profile_from_dict,
    _profile_to_dict,
    _sale_from_dict,
    _sale_to_dict,
    _stock_from_dict,
    _stock_to_dict,
)

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
    from backend.alerts import dismissed_alerts, transient_alerts
    from backend.notifications import _next_id, notifications
    from backend.store import _current_profile, purchase_orders, sales_log, stock_log, supplier_list

    state = {
        "saved_at": datetime.now().isoformat(timespec="seconds"),
        "profile": _profile_to_dict(_current_profile),
        "sales": [_sale_to_dict(e) for e in sales_log],
        "stock": [_stock_to_dict(e) for e in stock_log],
        "suppliers": [_supplier_to_dict(s) for s in supplier_list],
        "purchase_orders": [_purchase_order_to_dict(p) for p in purchase_orders],
        "notifications": {"items": notifications, "next_id": _next_id},
        "dismissed_alerts": list(dismissed_alerts),
        "transient_alerts": [dict(alert) for alert in transient_alerts],
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
        store_module.supplier_list.clear()
        store_module.purchase_orders.clear()
        store_module._current_profile = profile
        for e in state.get("sales", []):
            store_module.sales_log.append(_sale_from_dict(e))
        for e in state.get("stock", []):
            store_module.stock_log.append(_stock_from_dict(e))
        for s in state.get("suppliers", []):
            store_module.supplier_list.append(_supplier_from_dict(s))
        for po in state.get("purchase_orders", []):
            store_module.purchase_orders.append(_purchase_order_from_dict(po))

    notif = state.get("notifications") or {}
    notifications_module.notifications.clear()
    notifications_module.notifications.extend(notif.get("items", []))
    notifications_module._next_id = int(notif.get("next_id", 1) or 1)

    alerts_module.dismissed_alerts.clear()
    alerts_module.dismissed_alerts.extend(state.get("dismissed_alerts", []))

    alerts_module.transient_alerts.clear()
    alerts_module.transient_alerts.extend(state.get("transient_alerts", []))


def _supplier_to_dict(supplier: Supplier) -> dict:
    return {
        "name": supplier.name,
        "contact_person": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "payment_terms": supplier.payment_terms,
        "created_at": supplier.created_at,
    }


def _supplier_from_dict(data) -> Supplier:
    return Supplier(
        name=data.get("name", ""),
        contact_person=data.get("contact_person", ""),
        phone=data.get("phone", ""),
        email=data.get("email", ""),
        address=data.get("address", ""),
        payment_terms=data.get("payment_terms", ""),
        created_at=data.get("created_at", ""),
    )


def _purchase_order_to_dict(order: PurchaseOrder) -> dict:
    return {
        "id": order.id,
        "supplier_name": order.supplier_name,
        "product_name": order.product_name,
        "quantity": order.quantity,
        "unit_cost": order.unit_cost,
        "total_cost": order.total_cost,
        "status": order.status,
        "expected_delivery_date": order.expected_delivery_date,
        "note": order.note,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def _purchase_order_from_dict(data) -> PurchaseOrder:
    return PurchaseOrder(
        id=int(data.get("id", 1) or 1),
        supplier_name=data.get("supplier_name", ""),
        product_name=data.get("product_name", ""),
        quantity=int(data.get("quantity", 0) or 0),
        unit_cost=float(data.get("unit_cost", 0) or 0),
        total_cost=float(data.get("total_cost", 0) or 0),
        status=data.get("status", "ordered"),
        expected_delivery_date=data.get("expected_delivery_date", ""),
        note=data.get("note", ""),
        created_at=data.get("created_at", ""),
        updated_at=data.get("updated_at", ""),
    )
