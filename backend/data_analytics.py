"""Advanced data analytics powered by pandas and numpy.

This module is the AI/ML showcase of the project. It turns the raw in-memory
sales log into a tidy pandas DataFrame and then derives:

* ABC (Pareto) product classification from revenue share
* Product velocity (fast movers vs. slow / dead stock)
* Per-product demand forecasts (linear-trend + moving-average ensemble) with
  confidence intervals and a MAPE accuracy score
* CSV export helpers so reports can be downloaded
"""

from datetime import datetime
from typing import Any, Dict

import pandas as pd

from backend.store import get_profile, sales_log

_DATE_FORMATS = ("%Y-%m-%d", "%Y-%m", "%Y")


def _parse_ts(date_str: str) -> pd.Timestamp:
    for fmt in _DATE_FORMATS:
        try:
            return pd.Timestamp(datetime.strptime(date_str, fmt))
        except (ValueError, TypeError):
            continue
    return pd.NaT


def _sales_frame(profile) -> pd.DataFrame:
    price_map = {product.name: product.selling_price for product in profile.products}
    rows: list[dict] = []
    for entry in sales_log:
        ts = _parse_ts(entry.entry_date)
        if ts is pd.NaT:
            continue
        rows.append(
            {
                "product_name": entry.product_name,
                "quantity": entry.quantity,
                "entry_date": ts,
                "revenue": entry.quantity * price_map.get(entry.product_name, 0),
            }
        )
    return pd.DataFrame(rows, columns=["product_name", "quantity", "entry_date", "revenue"])


def _summary_stats(df: pd.DataFrame, profile) -> Dict[str, Any]:
    if df.empty:
        return {"total_units": 0, "total_revenue": 0.0, "active_products": 0, "days_with_data": 0}
    return {
        "total_units": int(df["quantity"].sum()),
        "total_revenue": round(float(df["revenue"].sum()), 2),
        "active_products": int(df["product_name"].nunique()),
        "days_with_data": int(df["entry_date"].dt.normalize().nunique()),
    }


# ABC (Pareto) analysis
from .abc_analysis import abc_analysis  # type: ignore  # noqa: E402
from .abc_analysis import empty_payload as empty_analytics_payload  # type: ignore  # noqa: E402

# Product velocity
from .product_velocity import product_velocity  # type: ignore  # noqa: E402

# Demand forecast and CSV export
from .forecast_export import forecast_products  # type: ignore  # noqa: E402
from .forecast_export import export_dataset  # type: ignore  # noqa: E402


def get_advanced_analytics() -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return empty_analytics_payload()
    df = _sales_frame(profile)
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "summary": _summary_stats(df, profile),
        "abc": abc_analysis(df, profile),
        "velocity": product_velocity(df, profile),
        "forecasts": forecast_products(df, profile),
    }