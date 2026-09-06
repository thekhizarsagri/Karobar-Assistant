"""Shared constants and utility helpers used across backend modules."""
from datetime import datetime
from typing import Optional

import pandas as pd

TRILLION = 1_000_000_000_000

DATE_FORMATS = ("%Y-%m-%d", "%Y-%m", "%Y")


def cap(value, limit=TRILLION):
    return max(0, min(value, limit))


def parse_date(date_str: str) -> Optional[datetime]:
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            continue
    return None


def parse_ts(date_str: str) -> pd.Timestamp:
    for fmt in DATE_FORMATS:
        try:
            return pd.Timestamp(datetime.strptime(date_str, fmt))
        except (ValueError, TypeError):
            continue
    return pd.NaT
