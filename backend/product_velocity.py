"""Product velocity analysis.

Determines fast movers, slow movers, and dead stock from product sales data.
"""

from datetime import datetime
from typing import Any, Dict, List

import pandas as pd


def product_velocity(df: pd.DataFrame, profile) -> Dict[str, Any]:
    """Compute top-mover and slow-mover lists from a product-level DataFrame.

    Returns dict with keys: top_movers (list), slow_movers (list).
    Each item has: product, units, avg_per_day, last_sale, days_since_last_sale.
    """
    now = pd.Timestamp(datetime.now().date())
    stats = [_product_stat(df, product.name, now) for product in profile.products]

    active = sorted((s for s in stats if s["units"] > 0), key=lambda s: s["avg_per_day"], reverse=True)
    dead = [s for s in stats if s["units"] == 0]
    threshold = active[0]["avg_per_day"] / 2 if active else 0
    slow = [s for s in reversed(active) if s["avg_per_day"] <= threshold] + dead
    return {"top_movers": active[:5], "slow_movers": slow[:5]}


def _product_stat(df: pd.DataFrame, name: str, now: pd.Timestamp) -> Dict[str, Any]:
    prod = df[df["product_name"] == name]
    if prod.empty:
        return {"product": name, "units": 0, "avg_per_day": 0.0, "last_sale": None, "days_since_last_sale": None}
    daily = prod.groupby(prod["entry_date"].dt.normalize())["quantity"].sum()
    span_days = max(1, (daily.index.max() - daily.index.min()).days + 1)
    last_sale = daily.index.max()
    return {
        "product": name,
        "units": int(daily.sum()),
        "avg_per_day": round(float(daily.sum() / span_days), 2),
        "last_sale": last_sale.strftime("%Y-%m-%d"),
        "days_since_last_sale": (now - last_sale).days,
    }