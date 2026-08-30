"""Product demand forecasting and CSV export helpers.

Provides linear-trend + moving-average ensemble forecasts with confidence
intervals and MAPE accuracy scores, plus CSV export for analytics outputs.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

_FORECAST_WINDOW = 14


def _parse_ts(date_str: str) -> pd.Timestamp:
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            return pd.Timestamp(datetime.strptime(date_str, fmt))
        except (ValueError, TypeError):
            continue
    return pd.NaT


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


def forecast_products(df: pd.DataFrame, profile) -> List[Dict[str, Any]]:
    """Generate forecasts for each product in the profile.

    Returns list of dicts with keys: product, next_period_units, lower,
    upper, trend, confidence, mape, history.
    """
    forecasts: List[Dict[str, Any]] = []
    for product in profile.products:
        prod = df[df["product_name"] == product.name]
        forecasts.append(_forecast_series(prod, product.name))
    return forecasts


def _forecast_series(prod: pd.DataFrame, product_name: str) -> Dict[str, Any]:
    base: Dict[str, Any] = {
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
    next_val = max(0, round(float(0.6 * linear_next + 0.4 * moving_avg_next)))

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


def export_dataset(dataset: str) -> str:
    """Return a CSV string for a named dataset from advanced analytics.

    Supported datasets: "abc", "forecasts", "velocity"
    """
    from backend.data_analytics import get_advanced_analytics

    data = get_advanced_analytics()

    import pandas as pd

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