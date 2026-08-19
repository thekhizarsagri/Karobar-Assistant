"""Sales recording and history summaries."""
import csv
import io
from datetime import datetime
from typing import Any, Dict

from backend.models import SaleEntry
from backend.persistence import save_state
from backend.stock import get_stock_for_product, update_stock_quantity
from backend.store import product_order, products_snapshot, sales_log, stock_log


def get_sales_summary() -> Dict[str, Any]:
    product_history: Dict[str, Dict[str, Any]] = {}
    stock_history: Dict[str, list] = {}

    for entry in sales_log:
        history = product_history.setdefault(
            entry.product_name,
            {"product_name": entry.product_name, "total_quantity": 0, "entries": []},
        )
        history["total_quantity"] += entry.quantity
        history["entries"].append(_entry_payload(entry))

    for entry in stock_log:
        stock_history.setdefault(entry.product_name, []).append(
            {
                "quantity": entry.quantity,
                "source": entry.source,
                "note": entry.note,
                "created_at": entry.created_at,
            }
        )

    return {
        "total_entries": len(sales_log),
        "total_units": sum(entry.quantity for entry in sales_log),
        "product_history": product_history,
        "stock_history": stock_history,
        "product_order": product_order(),
    }


def record_sale(sale_data: Dict[str, Any]) -> Dict[str, Any]:
    product_name = sale_data.get("productName", "")
    quantity = int(sale_data.get("quantity", 1) or 1)
    entry_type = sale_data.get("entryType", "auto")

    current_stock = get_stock_for_product(product_name)

    if current_stock == 0:
        return {
            "error": "out_of_stock",
            "message": f"No stock available for {product_name}. Please add stock first.",
            "products": products_snapshot(),
        }

    if quantity > current_stock:
        return {
            "error": "insufficient_stock",
            "message": f"Not enough stock for {product_name}. You tried to sell {quantity} but only {current_stock} unit{'s are' if current_stock != 1 else ' is'} available.",
            "available": current_stock,
            "requested": quantity,
            "products": products_snapshot(),
        }

    entry = SaleEntry(
        product_name=product_name,
        quantity=quantity,
        period=sale_data.get("period", "day"),
        entry_date=sale_data.get("entryDate", ""),
        entry_type=entry_type,
        created_at=datetime.now().isoformat(timespec="seconds"),
    )
    sales_log.append(entry)
    update_stock_quantity(product_name, -quantity)
    save_state()

    return {
        "message": "Sales recorded",
        "sales_summary": get_sales_summary(),
        "products": products_snapshot(),
    }


def _entry_payload(entry: SaleEntry) -> Dict[str, Any]:
    return {
        "product_name": entry.product_name,
        "quantity": entry.quantity,
        "period": entry.period,
        "entry_date": entry.entry_date,
        "entry_type": entry.entry_type,
        "created_at": entry.created_at,
    }


def export_history(dataset: str = "sales", product_name: str | None = None) -> str:
    """Return a CSV string of the sales or stock history log.

    When `product_name` is given, only entries for that product are exported.
    """
    if dataset == "stock":
        entries = [
            entry
            for entry in stock_log
            if product_name is None or entry.product_name == product_name
        ]
        rows = [
            {
                "product_name": entry.product_name,
                "quantity": entry.quantity,
                "source": entry.source,
                "note": entry.note,
                "created_at": entry.created_at,
            }
            for entry in entries
        ]
    else:
        entries = [
            entry
            for entry in sales_log
            if product_name is None or entry.product_name == product_name
        ]
        rows = [_entry_payload(entry) for entry in entries]

    buffer = io.StringIO()
    if rows:
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    return buffer.getvalue()