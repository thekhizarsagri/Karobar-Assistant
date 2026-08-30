"""Product velocity analysis.

Determines fast movers, slow movers, and dead stock from product sales data.
"""

from typing import Any, Dict, List

import pandas as pd


def product_velocity(df: pd.DataFrame, profile) -> Dict[str, Any]:
    """Compute top-mover and slow-mover lists from a product-level DataFrame.

    Returns dict with keys: top_movers (list), slow_movers (list).
    Each item has: product, units, avg_per_day, last_sale, days_since_last_sale.
    """
    from datetime import datetime

    stats: List[Dict[str, Any]] = []
    now = pd.Timestamp(datetime.now().date())

    for product in profile.products:
        prod = df[df["product_name"] == product.name]
        if prod.empty:
            stats.append(
                {
                    "product": product.name,
                    "units": 0,
                    "avg_per_day": 0.0,
                    "last_sale": None,
                    "days_since_last_sale": None,
                }
            )
            continue
        daily = prod.groupby(prod["entry_date"].dt.normalize())["quantity"].sum()
        span_days = max(1, (daily.index.max() - daily.index.min()).days + 1)
        last_sale = daily.index.max()
        stats.append(
            {
                "product": product.name,
                "units": int(daily.sum()),
                "avg_per_day": round(float(daily.sum() / span_days), 2),
                "last_sale": last_sale.strftime("%Y-%m-%d"),
                "days_since_last_sale": (now - last_sale).days,
            }
        )

    active = [s for s in stats if s["units"] > 0]
    top_movers = sorted(active, key=lambda s: s["avg_per_day"], reverse=True)[:5]

    dead = [s for s in stats if s["units"] == 0]
    slow = sorted(active, key=lambda s: s["avg_per_day"])[:5]
    slow_movers = [
        s for s in slow if s["avg_per_day"] <= (active[0]["avg_per_day"] / 2 if active else 0)
    ] + dead

    return {"top_movers": top_movers, "slow_movers": slow_movers[:5]}