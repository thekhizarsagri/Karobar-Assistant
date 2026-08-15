"""Aggregate the sales log into daily, monthly, and yearly views.

The bucketing is performed with a pandas pipeline (resample/groupby) so the
analytics layer reads from a single DataFrame instead of several hand-rolled
dict accumulators. The output shape is unchanged from the original pure-Python
implementation and stays compatible with the existing tests.
"""
from datetime import datetime
from typing import Any, Dict

import pandas as pd

from backend.store import product_order, sales_log

# Accepted date granularities, most specific first. entry_date may be a full
# day "2026-08-10", a month "2026-08", or a plain year "2026".
DATE_FORMATS = ("%Y-%m-%d", "%Y-%m", "%Y")


def _sales_frame() -> pd.DataFrame:
    """Build a tidy DataFrame with one row per sale and parsed date keys.

    Unrecognizable dates are dropped so they are not bucketed into any view,
    matching the previous behaviour.
    """
    rows: list[Dict[str, Any]] = []
    for entry in sales_log:
        date_obj = _parse_date(entry.entry_date)
        if date_obj is None:
            continue
        rows.append(
            {
                "product_name": entry.product_name,
                "quantity": entry.quantity,
                "period": entry.period,
                "day": date_obj.strftime("%Y-%m-%d"),
                "month": date_obj.strftime("%Y-%m"),
                "year": date_obj.strftime("%Y"),
            }
        )
    return pd.DataFrame(rows, columns=["product_name", "quantity", "period", "day", "month", "year"])


def _bucket(df: pd.DataFrame, bucket_col: str, mask: pd.Series) -> Dict[str, Dict[str, int]]:
    """Sum quantities per (bucket, product) and return {bucket: {product: qty}}."""
    sub = df[mask]
    if sub.empty:
        return {}
    grouped = sub.groupby([bucket_col, "product_name"], sort=False)["quantity"].sum()
    result: Dict[str, Dict[str, int]] = {}
    for (bucket_key, product_name), qty in grouped.items():
        result.setdefault(bucket_key, {})[product_name] = int(qty)
    return result


def get_analytics_data() -> Dict[str, Any]:
    df = _sales_frame()

    # A "month" period entry is a monthly figure (monthly + yearly only),
    # a "year" entry is yearly only, everything else also lands in the daily view.
    daily_mask = ~df["period"].isin(["month", "year"])
    monthly_mask = df["period"] != "year"

    daily = _bucket(df, "day", daily_mask)
    monthly = _bucket(df, "month", monthly_mask)
    yearly = _bucket(df, "year", df["year"].notna())

    return {
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly,
        "product_order": product_order(),
    }


def _parse_date(date_str: str):
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            continue
    return None
