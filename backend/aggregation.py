"""Aggregate the sales log into daily, monthly, and yearly views."""
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict

from backend.store import sales_log

# Accepted date granularities, most specific first. entry_date may be a full
# day "2026-08-10", a month "2026-08", or a plain year "2026".
DATE_FORMATS = ("%Y-%m-%d", "%Y-%m", "%Y")


def get_analytics_data() -> Dict[str, Any]:
    daily_sales: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    monthly_sales: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    yearly_sales: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for entry in sales_log:
        date_obj = _parse_date(entry.entry_date)
        if date_obj is None:
            # Unrecognizable dates cannot be bucketed into any view.
            continue

        month_key = date_obj.strftime("%Y-%m")
        year_key = date_obj.strftime("%Y")

        if entry.period == "month":
            monthly_sales[month_key][entry.product_name] += entry.quantity
            yearly_sales[year_key][entry.product_name] += entry.quantity
        elif entry.period == "year":
            yearly_sales[year_key][entry.product_name] += entry.quantity
        else:
            # day, week, or any other granularity resolves to a concrete day
            day_key = date_obj.strftime("%Y-%m-%d")
            daily_sales[day_key][entry.product_name] += entry.quantity
            monthly_sales[month_key][entry.product_name] += entry.quantity
            yearly_sales[year_key][entry.product_name] += entry.quantity

    return {
        "daily": _to_plain(daily_sales),
        "monthly": _to_plain(monthly_sales),
        "yearly": _to_plain(yearly_sales),
    }


def _parse_date(date_str: str):
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            continue
    return None


def _to_plain(buckets: Dict[str, Dict[str, int]]) -> Dict[str, Dict[str, int]]:
    return {k: dict(v) for k, v in buckets.items()}