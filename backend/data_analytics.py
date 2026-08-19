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
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from backend.store import get_profile, sales_log

_DATE_FORMATS = ("%Y-%m-%d", "%Y-%m", "%Y")
_FORECAST_WINDOW = 14


def get_advanced_analytics() -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return empty_payload()
    df = _sales_frame(profile)
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "summary": _summary_stats(df, profile),
        "abc": abc_analysis(df, profile),
        "velocity": product_velocity(df, profile),
        "forecasts": forecast_products(df, profile),
    }


def empty_payload() -> Dict[str, Any]:
    return {
        "generated_at": "",
        "summary": {"total_units": 0, "total_revenue": 0.0, "active_products": 0, "days_with_data": 0},
        "abc": [],
        "velocity": {"top_movers": [], "slow_movers": []},
        "forecasts": [],
    }


# ---------------------------------------------------------------------------
# Data preparation
# ---------------------------------------------------------------------------

def _parse_ts(date_str: str):
    for fmt in _DATE_FORMATS:
        try:
            return pd.Timestamp(datetime.strptime(date_str, fmt))
        except (ValueError, TypeError):
            continue
    return pd.NaT


def _sales_frame(profile) -> pd.DataFrame:
    price_map = {product.name: product.selling_price for product in profile.products}
    rows: List[Dict[str, Any]] = []
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


# ---------------------------------------------------------------------------
# ABC (Pareto) analysis
# ---------------------------------------------------------------------------

def abc_analysis(df: pd.DataFrame, profile) -> List[Dict[str, Any]]:
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
            # Every product contributes the same revenue, so there is no
            # Pareto split to make: everything belongs to the top tier.
            cls = "A"
        elif index == 0:
            # The single largest revenue product is always an A, even when it
            # already covers more than the 80% Pareto threshold by itself.
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


# ---------------------------------------------------------------------------
# Product velocity
# ---------------------------------------------------------------------------

def product_velocity(df: pd.DataFrame, profile) -> Dict[str, Any]:
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
    slow_movers = [s for s in slow if s["avg_per_day"] <= (active[0]["avg_per_day"] / 2 if active else 0)] + dead

    return {"top_movers": top_movers, "slow_movers": slow_movers[:5]}


# ---------------------------------------------------------------------------
# Demand forecast
# ---------------------------------------------------------------------------

def forecast_products(df: pd.DataFrame, profile) -> List[Dict[str, Any]]:
    forecasts: List[Dict[str, Any]] = []
    for product in profile.products:
        prod = df[df["product_name"] == product.name]
        forecasts.append(_forecast_series(prod, product.name))
    return forecasts


def _forecast_series(prod: pd.DataFrame, product_name: str) -> Dict[str, Any]:
    base = {
        "product": product_name,
        "next_period_units": 0,
        "lower": 0,
        "upper": 0,
        "trend": "stable",
        "confidence": "low",
        "mape": None,
        "history": [],
    }
    if prod.empty:
        return base

    daily = prod.groupby(prod["entry_date"].dt.normalize())["quantity"].sum().sort_index()
    full_idx = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    values = daily.reindex(full_idx, fill_value=0).to_numpy(dtype=float)
    window = values[-_FORECAST_WINDOW:]

    history = [
        {"date": date_ts.strftime("%Y-%m-%d"), "units": int(v)}
        for date_ts, v in zip(full_idx[-_FORECAST_WINDOW:], window)
    ]
    base["history"] = history

    if len(window) < 2:
        base["next_period_units"] = int(window[-1]) if len(window) else 0
        return base

    x = np.arange(1, len(window) + 1)
    slope, intercept = np.polyfit(x, window, 1)
    linear_next = slope * (len(window) + 1) + intercept
    moving_avg_next = float(np.mean(window[-3:]))
    next_val = 0.6 * linear_next + 0.4 * moving_avg_next
    next_val = max(0, round(float(next_val)))

    residuals = window - (slope * x + intercept)
    std_dev = float(residuals.std()) if len(residuals) > 1 else 0.0
    margin = 1.96 * std_dev
    lower = max(0, round(next_val - margin))
    upper = max(lower, round(next_val + margin))

    last_actual = int(window[-1])
    if next_val > last_actual:
        trend = "upward"
    elif next_val < last_actual:
        trend = "downward"
    else:
        trend = "steady"

    if len(window) >= 10:
        confidence = "high"
    elif len(window) >= 5:
        confidence = "medium"
    else:
        confidence = "low"

    base.update(
        {
            "next_period_units": next_val,
            "lower": lower,
            "upper": upper,
            "trend": trend,
            "confidence": confidence,
            "mape": _holdout_mape(window),
        }
    )
    return base


def _holdout_mape(window: np.ndarray) -> Optional[float]:
    """MAPE of a linear model fitted on all-but-last-2 points, evaluated on the last 2."""
    if len(window) < 4:
        return None
    train = window[:-2]
    test = window[-2:]
    if np.all(train == train[0]):
        return 0.0 if np.all(test == 0) else None
    x_train = np.arange(1, len(train) + 1)
    slope, intercept = np.polyfit(x_train, train, 1)
    x_test = np.arange(len(train) + 1, len(train) + 3)
    preds = np.maximum(slope * x_test + intercept, 0)
    denominator = np.maximum(test, 1)
    mape = float(np.mean(np.abs(test - preds) / denominator) * 100)
    return round(mape, 1)


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

def export_dataset(dataset: str) -> str:
    """Return a CSV string for a named dataset."""
    data = get_advanced_analytics()

    if dataset == "abc":
        frame = pd.DataFrame(data["abc"])
    elif dataset == "forecasts":
        frame = pd.DataFrame(
            [
                {
                    "product": f["product"],
                    "next_period_units": f["next_period_units"],
                    "lower": f["lower"],
                    "upper": f["upper"],
                    "trend": f["trend"],
                    "confidence": f["confidence"],
                    "mape": f["mape"],
                }
                for f in data["forecasts"]
            ]
        )
    elif dataset == "velocity":
        rows = [
            {**m, "group": "top_mover"}
            for m in data["velocity"]["top_movers"]
        ] + [
            {**m, "group": "slow_mover"}
            for m in data["velocity"]["slow_movers"]
        ]
        frame = pd.DataFrame(rows)
    else:
        frame = pd.DataFrame()

    return frame.to_csv(index=False)
