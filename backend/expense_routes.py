"""Expense CRUD and scheduling API routes."""
from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.models import Expense
from backend.store import get_profile, save_state

expense_router = APIRouter()


def _error(code: str, message: str, status: int) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": code, "message": message})


@expense_router.post("/api/expenses/schedule")
def update_expense_schedule(request: Dict[str, Any]) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return _error("no_profile", "No business profile found.", 404)

    schedules = request.get("schedules", [])
    schedule_map = {}
    for s in schedules:
        if isinstance(s, dict) and s.get("key"):
            schedule_map[s["key"]] = s

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


@expense_router.post("/api/expenses")
def add_expense(request: Dict[str, Any]) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return _error("no_profile", "No business profile found.", 404)

    key = request.get("key", "").strip()
    label = request.get("label", "").strip()
    amount = float(request.get("amount", 0) or 0)

    if not key or not label:
        return _error("invalid", "Key and label are required.", 400)

    if any(e.key == key for e in profile.expenses):
        return _error("duplicate", f"Expense with key '{key}' already exists.", 409)

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


@expense_router.put("/api/expenses/{key}")
def update_expense(key: str, request: Dict[str, Any]) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return _error("no_profile", "No business profile found.", 404)

    expense = next((e for e in profile.expenses if e.key == key), None)
    if expense is None:
        return _error("not_found", f"Expense '{key}' not found.", 404)

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


@expense_router.delete("/api/expenses/{key}")
def delete_expense(key: str) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return _error("no_profile", "No business profile found.", 404)

    before = len(profile.expenses)
    profile.expenses = [e for e in profile.expenses if e.key != key]
    if len(profile.expenses) == before:
        return _error("not_found", f"Expense '{key}' not found.", 404)

    save_state()
    return {"message": "Expense deleted"}
