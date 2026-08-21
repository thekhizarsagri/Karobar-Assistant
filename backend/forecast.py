"""Lightweight sales forecast for the next period."""
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


def forecast_next_period(sales_entries: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    normalized = _normalize_sales_entries(sales_entries)
    if not normalized:
        return {"next_period_units": 0, "trend": "stable", "confidence": "low"}

    frame = pd.DataFrame(normalized)
    frame["entryDate"] = pd.to_datetime(frame["entryDate"], errors="coerce")
    frame = frame.dropna(subset=["entryDate"]).sort_values("entryDate")
    if not frame.empty:
        values = frame["quantity"].tail(7).tolist()
        if len(values) >= 2:
            return _linear_forecast(values)

    values = [entry["quantity"] for entry in normalized[-7:]]
    if len(values) >= 2:
        return _linear_forecast(values)

    return {"next_period_units": max(values, default=0), "trend": "stable", "confidence": "low"}


def _normalize_sales_entries(sales_entries: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for entry in sales_entries or []:
        if not entry:
            continue
        normalized.append(
            {
                "productName": entry.get("productName") or entry.get("product_name") or "",
                "quantity": int(entry.get("quantity", 0) or 0),
                "period": entry.get("period", "day"),
                "entryDate": entry.get("entryDate") or entry.get("entry_date") or "",
            }
        )
    return normalized


def _linear_forecast(values: List[int]) -> Dict[str, Any]:
    """Simple linear regression over the last few values."""
    x = np.arange(1, len(values) + 1)
    slope, intercept = np.polyfit(x, values, 1)
    next_value = slope * (len(values) + 1) + intercept
    confidence = "high" if len(values) >= 6 else "medium"

    forecast = max(0, round(float(next_value)))
    if forecast > values[-1]:
        trend = "upward"
    elif forecast == values[-1]:
        trend = "steady"
    else:
        trend = "downward"
    return {"next_period_units": forecast, "trend": trend, "confidence": confidence}