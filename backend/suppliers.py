from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from backend.models import PurchaseOrder, Supplier
from backend.persistence import save_state
from backend.stock import update_stock_quantity
from backend.store import get_profile, purchase_orders, supplier_list


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def add_supplier(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a supplier record or update it if the same name already exists."""
    name = (payload.get("name") or "").strip()
    if not name:
        raise ValueError("Supplier name is required")

    for supplier in supplier_list:
        if supplier.name.lower() == name.lower():
            supplier.contact_person = payload.get("contactPerson", supplier.contact_person)
            supplier.phone = payload.get("phone", supplier.phone)
            supplier.email = payload.get("email", supplier.email)
            supplier.address = payload.get("address", supplier.address)
            supplier.payment_terms = payload.get("paymentTerms", supplier.payment_terms)
            supplier.created_at = supplier.created_at or _now_iso()
            save_state()
            return {
                "id": supplier.name,
                "name": supplier.name,
                "contactPerson": supplier.contact_person,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "paymentTerms": supplier.payment_terms,
            }

    supplier = Supplier(
        name=name,
        contact_person=payload.get("contactPerson", ""),
        phone=payload.get("phone", ""),
        email=payload.get("email", ""),
        address=payload.get("address", ""),
        payment_terms=payload.get("paymentTerms", ""),
        created_at=_now_iso(),
    )
    supplier_list.append(supplier)
    save_state()
    return {
        "id": supplier.name,
        "name": supplier.name,
        "contactPerson": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "paymentTerms": supplier.payment_terms,
    }


def get_suppliers() -> List[Dict[str, Any]]:
    return [
        {
            "id": supplier.name,
            "name": supplier.name,
            "contactPerson": supplier.contact_person,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
            "paymentTerms": supplier.payment_terms,
            "createdAt": supplier.created_at,
        }
        for supplier in supplier_list
    ]


def get_supplier_by_name(name: str) -> Supplier | None:
    for supplier in supplier_list:
        if supplier.name.lower() == name.lower():
            return supplier
    return None


def create_purchase_order(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a purchase order and optionally add stock if the order is received."""
    supplier_name = (payload.get("supplierName") or "").strip()
    product_name = (payload.get("productName") or "").strip()
    quantity = int(payload.get("quantity", 0) or 0)
    unit_cost = float(payload.get("unitCost", 0) or 0)
    status = (payload.get("status") or "ordered").strip() or "ordered"

    if not supplier_name or not product_name:
        raise ValueError("Supplier and product are required")
    if quantity <= 0:
        raise ValueError("Purchase quantity must be greater than zero")

    order_id = (max((po.id for po in purchase_orders), default=0) + 1) if purchase_orders else 1
    created_at = _now_iso()
    total_cost = quantity * unit_cost
    order = PurchaseOrder(
        id=order_id,
        supplier_name=supplier_name,
        product_name=product_name,
        quantity=quantity,
        unit_cost=unit_cost,
        total_cost=total_cost,
        status=status,
        expected_delivery_date=str(payload.get("expectedDeliveryDate") or ""),
        note=str(payload.get("note") or ""),
        created_at=created_at,
        updated_at=created_at,
    )
    purchase_orders.append(order)

    stock_after = None
    if status.lower() == "received":
        stock_after = update_stock_quantity(product_name, quantity)
        if stock_after >= 0:
            order.updated_at = _now_iso()

    save_state()
    return {
        "id": order.id,
        "supplierName": order.supplier_name,
        "productName": order.product_name,
        "quantity": order.quantity,
        "unitCost": order.unit_cost,
        "totalCost": order.total_cost,
        "status": order.status,
        "expectedDeliveryDate": order.expected_delivery_date,
        "note": order.note,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at,
        "stockAfterOrder": stock_after,
    }


def get_purchase_orders() -> List[Dict[str, Any]]:
    return [
        {
            "id": order.id,
            "supplierName": order.supplier_name,
            "productName": order.product_name,
            "quantity": order.quantity,
            "unitCost": order.unit_cost,
            "totalCost": order.total_cost,
            "status": order.status,
            "expectedDeliveryDate": order.expected_delivery_date,
            "note": order.note,
            "createdAt": order.created_at,
            "updatedAt": order.updated_at,
        }
        for order in purchase_orders
    ]


def get_purchase_order_summary() -> Dict[str, Any]:
    total_open = sum(order.total_cost for order in purchase_orders if order.status.lower() in {"ordered", "pending", "in_transit"})
    total_received = sum(order.total_cost for order in purchase_orders if order.status.lower() == "received")
    return {
        "totalOpenOrders": len([order for order in purchase_orders if order.status.lower() in {"ordered", "pending", "in_transit"}]),
        "totalReceivedOrders": len([order for order in purchase_orders if order.status.lower() == "received"]),
        "amountOutstanding": total_open,
        "amountReceived": total_received,
        "orders": get_purchase_orders(),
    }
