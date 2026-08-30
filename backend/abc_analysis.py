"""ABC (Pareto) product analysis.

Analyzes product revenue to classify products into A, B, or C categories
based on Pareto principle (80/20 rule).
"""

from typing import Any, Dict, List

import pandas as pd


def abc_analysis(df: pd.DataFrame, profile) -> List[Dict[str, Any]]:
    """Run ABC analysis on a product revenue DataFrame.

    Returns list of dicts with keys: product, class, units, revenue,
    revenue_pct, cumulative_pct.
    """
    revenue: Dict[str, float] = {product.name: 0.0 for product in profile.products}
    units: Dict[str, int] = {product.name: 0 for product in profile.products}
    if not df.empty:
        for name, rev in df.groupby("product_name")["revenue"].sum().items():
            revenue[name] = float(rev)
        for name, qty in df.groupby("product_name")["quantity"].sum().items():
            units[name] = int(qty)

    ordered = sorted(revenue.items(), key=lambda kv: kv[1], reverse=True)
    total = sum(revenue.values())
    all_equal = len(set(revenue.values())) == 1 and total > 0
    cumulative = 0.0
    result: List[Dict[str, Any]] = []
    for index, (name, rev) in enumerate(ordered):
        cumulative += rev
        pct = (rev / total * 100) if total else 0.0
        cum = (cumulative / total * 100) if total else 0.0
        if total == 0:
            cls = "C"
        elif all_equal:
            cls = "A"
        elif index == 0:
            cls = "A"
        elif cum <= 80:
            cls = "A"
        elif cum <= 95:
            cls = "B"
        else:
            cls = "C"
        result.append(
            {
                "product": name,
                "class": cls,
                "units": units[name],
                "revenue": round(rev, 2),
                "revenue_pct": round(pct, 1),
                "cumulative_pct": round(cum, 1),
            }
        )
    return result


def empty_payload() -> Dict[str, Any]:
    """Return a default empty payload shape."""
    return {
        "generated_at": "",
        "summary": {"total_units": 0, "total_revenue": 0.0, "active_products": 0, "days_with_data": 0},
        "abc": [],
        "velocity": {"top_movers": [], "slow_movers": []},
        "forecasts": [],
    }