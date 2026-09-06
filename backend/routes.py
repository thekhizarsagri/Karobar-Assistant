"""API route handlers for the Karobar Assistant backend."""
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from backend.aggregation import get_analytics_data
from backend.data_analytics import export_dataset, get_advanced_analytics
from backend.inventory import get_inventory_data
from backend.reports import get_reports
from backend.alerts import clear_all, get_active_alerts
from backend.dashboard import build_dashboard_payload, build_current_dashboard_payload
from backend.insights import get_latest_ai_insights
from backend.notifications import (
    add_notification,
    are_notifications_enabled,
    clear_notifications,
    get_notifications,
    mark_all_read,
    mark_read,
    toggle_notifications,
)
from backend.sales import clear_product_history, export_history, get_sales_summary, record_sale, remove_sale
from backend.stock import add_stock
from backend.store import reset as reset_store
from backend.schemas import (
    DemoSetupRequest,
    NotificationReadRequest,
    NotificationRequest,
    SaleDeleteRequest,
    SaleEntryRequest,
    StockEntryRequest,
)

router = APIRouter()


@router.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/api/reset")
def reset() -> Dict[str, str]:
    reset_store()
    return {"message": "All data cleared"}


@router.post("/api/dashboard")
def dashboard(request: DemoSetupRequest) -> Dict[str, Any]:
    return build_dashboard_payload(request.model_dump())


@router.get("/api/dashboard")
def current_dashboard() -> Dict[str, Any]:
    return build_current_dashboard_payload()


@router.post("/api/sales")
def sales(request: SaleEntryRequest) -> Dict[str, Any]:
    return record_sale(request.model_dump())


@router.post("/api/sales/delete")
def delete_sale(request: SaleDeleteRequest) -> Dict[str, Any]:
    return remove_sale(request.model_dump())


@router.post("/api/stock")
def stock_endpoint(request: StockEntryRequest) -> Dict[str, Any]:
    result = add_stock(request.productName, request.quantity, mode=request.mode, date=request.date)
    result["sales_summary"] = get_sales_summary()
    return result


@router.get("/api/alerts")
def alerts_endpoint() -> List[Dict[str, Any]]:
    return get_active_alerts(get_latest_ai_insights())


@router.post("/api/alerts/clear")
def clear_alerts_endpoint() -> List[Dict[str, Any]]:
    return clear_all(get_latest_ai_insights())


@router.get("/api/notifications")
def notifications_endpoint() -> Dict[str, Any]:
    return get_notifications()


@router.post("/api/notifications")
def create_notification(request: NotificationRequest) -> Dict[str, Any]:
    add_notification(request.type, request.title, request.message)
    return get_notifications()


@router.post("/api/notifications/read")
def mark_notifications_read(request: NotificationReadRequest | None = None) -> Dict[str, Any]:
    if request is not None and request.id is not None:
        return mark_read(request.id)
    return mark_all_read()


@router.post("/api/notifications/clear")
def clear_notifications_endpoint() -> Dict[str, Any]:
    clear_notifications()
    return get_notifications()


@router.get("/api/notifications/toggle")
def get_notification_toggle() -> Dict[str, Any]:
    return {"enabled": are_notifications_enabled()}


@router.post("/api/notifications/toggle")
def toggle_notification_switch(request: Dict[str, Any]) -> Dict[str, Any]:
    enabled = bool(request.get("enabled", True))
    return toggle_notifications(enabled)


@router.get("/api/analytics")
def analytics() -> Dict[str, Any]:
    return get_analytics_data()


@router.get("/api/inventory")
def inventory(category: str | None = None) -> Dict[str, Any]:
    return get_inventory_data(category)


@router.get("/api/reports")
def reports() -> Dict[str, Any]:
    return get_reports()


@router.post("/api/expenses/schedule")
def update_expense_schedule(request: Dict[str, Any]) -> Dict[str, Any]:
    from backend.store import get_profile, save_state

    profile = get_profile()
    if profile is None:
        return {"error": "no_profile", "message": "No business profile found."}

    schedules = request.get("schedules", [])
    schedule_map = {s["key"]: s for s in schedules}

    for expense in profile.expenses:
        if expense.key in schedule_map:
            s = schedule_map[expense.key]
            expense.deduction_day = int(s.get("deduction_day", 1) or 1)
            expense.deduction_time = s.get("deduction_time", "00:00") or "00:00"
        else:
            expense.deduction_day = 1
            expense.deduction_time = "00:00"

    save_state()
    return {"message": "Expense schedules updated"}


@router.post("/api/expenses")
def add_expense(request: Dict[str, Any]) -> Dict[str, Any]:
    from backend.models import Expense
    from backend.store import get_profile, save_state

    profile = get_profile()
    if profile is None:
        return {"error": "no_profile", "message": "No business profile found."}

    key = request.get("key", "").strip()
    label = request.get("label", "").strip()
    amount = float(request.get("amount", 0) or 0)

    if not key or not label:
        return {"error": "invalid", "message": "Key and label are required."}

    if any(e.key == key for e in profile.expenses):
        return {"error": "duplicate", "message": f"Expense with key '{key}' already exists."}

    expense = Expense(
        key=key,
        label=label,
        amount=max(0, amount),
        enabled=request.get("enabled", True),
        deduction_day=int(request.get("deductionDay", 1) or 1),
        deduction_time=request.get("deductionTime", "00:00") or "00:00",
    )
    profile.expenses.append(expense)
    save_state()
    return {"message": f"Expense '{label}' added"}


@router.put("/api/expenses/{key}")
def update_expense(key: str, request: Dict[str, Any]) -> Dict[str, Any]:
    from backend.store import get_profile, save_state

    profile = get_profile()
    if profile is None:
        return {"error": "no_profile", "message": "No business profile found."}

    expense = next((e for e in profile.expenses if e.key == key), None)
    if expense is None:
        return {"error": "not_found", "message": f"Expense '{key}' not found."}

    if "label" in request:
        expense.label = request["label"].strip()
    if "amount" in request:
        expense.amount = max(0, float(request["amount"] or 0))
    if "enabled" in request:
        expense.enabled = bool(request["enabled"])
    if "deductionDay" in request:
        expense.deduction_day = int(request["deductionDay"] or 1)
    if "deductionTime" in request:
        expense.deduction_time = request["deductionTime"] or "00:00"

    save_state()
    return {"message": f"Expense '{expense.label}' updated"}


@router.delete("/api/expenses/{key}")
def delete_expense(key: str) -> Dict[str, Any]:
    from backend.store import get_profile, save_state

    profile = get_profile()
    if profile is None:
        return {"error": "no_profile", "message": "No business profile found."}

    before = len(profile.expenses)
    profile.expenses = [e for e in profile.expenses if e.key != key]
    if len(profile.expenses) == before:
        return {"error": "not_found", "message": f"Expense '{key}' not found."}

    save_state()
    return {"message": "Expense deleted"}


@router.get("/api/analytics/advanced")
def advanced_analytics() -> Dict[str, Any]:
    return get_advanced_analytics()


@router.get("/api/analytics/export")
def analytics_export(dataset: str = "abc") -> PlainTextResponse:
    csv_data = export_dataset(dataset)
    return PlainTextResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="karobar-{dataset}.csv"'},
    )


@router.get("/api/history/export")
def history_export(dataset: str = "sales", product: str | None = None) -> PlainTextResponse:
    csv_data = export_history(dataset, product)
    filename = f"karobar-history-{dataset}"
    if product:
        filename += f"-{product.replace(' ', '_').lower()}"
    return PlainTextResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
    )


@router.post("/api/history/clear/{product}")
def clear_history_endpoint(product: str) -> Dict[str, Any]:
    return clear_product_history(product)
