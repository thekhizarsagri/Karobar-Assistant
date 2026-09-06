"""Expense CRUD and scheduling API routes."""
from typing import Any, Dict

from fastapi import APIRouter

from backend.models import Expense
from backend.store import get_profile, save_state

expense_router = APIRouter()


@expense_router.post("/api/expenses/schedule")
def update_expense_schedule(request: Dict[str, Any]) -> Dict[str, Any]:
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


@expense_router.post("/api/expenses")
def add_expense(request: Dict[str, Any]) -> Dict[str, Any]:
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


@expense_router.put("/api/expenses/{key}")
def update_expense(key: str, request: Dict[str, Any]) -> Dict[str, Any]:
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


@expense_router.delete("/api/expenses/{key}")
def delete_expense(key: str) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return {"error": "no_profile", "message": "No business profile found."}

    before = len(profile.expenses)
    profile.expenses = [e for e in profile.expenses if e.key != key]
    if len(profile.expenses) == before:
        return {"error": "not_found", "message": f"Expense '{key}' not found."}

    save_state()
    return {"message": "Expense deleted"}
