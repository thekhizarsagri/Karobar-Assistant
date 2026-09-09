"""Background scheduler for automatic monthly expense deductions.

Checks every 30 seconds for expenses that are due based on their
configured deduction_day and deduction_time. When an expense is due,
it deducts the amount from the available balance and logs the deduction.
"""
import threading
import time
from datetime import datetime

from backend.models import ExpenseDeduction
from backend.persistence import save_state


def _parse_time(time_str: str) -> tuple[int, int]:
    """Parse 'HH:MM' into (hour, minute)."""
    try:
        parts = time_str.split(":")
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        return 0, 0


def _is_expense_due(expense, now: datetime) -> bool:
    """Check if an expense should be deducted at the current time."""
    if not expense.enabled:
        return False
    if expense.amount <= 0:
        return False

    hour, minute = _parse_time(expense.deduction_time)
    return (
        now.day == expense.deduction_day
        and now.hour == hour
        and now.minute == minute
    )


def _already_deducted_this_month(expense, now: datetime) -> bool:
    """Check if this expense was already deducted this month."""
    if not expense.last_deducted:
        return False
    try:
        last = datetime.fromisoformat(expense.last_deducted)
        return last.year == now.year and last.month == now.month
    except (ValueError, TypeError):
        return False


def process_due_expenses():
    """Check all expenses and deduct any that are due right now."""
    from backend.store import get_profile

    profile = get_profile()
    if profile is None:
        return

    now = datetime.now()
    deductions_made = False

    for expense in profile.expenses:
        if _is_expense_due(expense, now) and not _already_deducted_this_month(expense, now):
            balance_before = profile.available_balance
            profile.available_balance -= expense.amount
            expense.last_deducted = now.isoformat(timespec="seconds")

            deduction = ExpenseDeduction(
                expense_key=expense.key,
                expense_label=expense.label,
                amount=expense.amount,
                deducted_at=now.isoformat(timespec="seconds"),
                balance_before=round(balance_before, 2),
                balance_after=round(profile.available_balance, 2),
            )
            profile.expense_deductions.append(deduction)
            deductions_made = True

    if deductions_made:
        save_state()


_scheduler_running = False
_scheduler_thread = None


def _scheduler_loop():
    """Main scheduler loop — checks every 30 seconds."""
    while _scheduler_running:
        try:
            process_due_expenses()
        except Exception:
            import logging
            logging.exception("expense scheduler error")
        time.sleep(30)


def start_expense_scheduler():
    """Start the background expense scheduler thread."""
    global _scheduler_running, _scheduler_thread
    if _scheduler_running:
        return
    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True)
    _scheduler_thread.start()
