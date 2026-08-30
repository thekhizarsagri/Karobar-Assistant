"""Business reports: KPI health, GMROI, inventory turnover, break-even,
economic order quantity, a seasonality index, and an expense Pareto.

These are classic retail/inventory formulas applied to the in-memory store:

* GMROI          = gross margin / average inventory cost
* Turnover       = cost of goods sold / average inventory cost
* DIO            = 365 / turnover
* Break-even     = fixed expenses / contribution margin (units & revenue)
* EOQ            = sqrt(2 * annual demand * ordering cost / holding cost)
* Seasonality    = month share vs. a uniform monthly average
* Expense Pareto = expenses ranked by size with a cumulative share
"""
from datetime import datetime
from typing import Any, Dict

from backend.reports_helpers import (
    _avg_inventory_cost,
    _enabled_expenses,
    _sales_rows,
    _stock_health,
)
from backend.reports_analysis import (
    _break_even,
    _eoq,
    _expense_pareto,
    _health_score,
    _seasonality,
)
from backend.store import get_profile


def get_reports() -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return empty_payload()

    sales = _sales_rows(profile)
    revenue = sum(row["revenue"] for row in sales)
    cogs = sum(row["cogs"] for row in sales)
    units_sold = sum(row["quantity"] for row in sales)
    gross_profit = revenue - cogs
    total_expenses = _enabled_expenses(profile)
    net_profit = gross_profit - total_expenses
    net_margin = (net_profit / revenue) if revenue else 0.0

    avg_inventory = _avg_inventory_cost(profile)
    turnover = (cogs / avg_inventory) if avg_inventory else 0.0
    gmroi = (gross_profit / avg_inventory) if avg_inventory else 0.0
    dio = (365 / turnover) if turnover > 0 else None

    stock_health = _stock_health(profile)
    kpi = _health_score(net_margin, stock_health, turnover)

    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "kpi": kpi,
        "financials": {
            "revenue": round(revenue, 2),
            "cogs": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "total_expenses": round(total_expenses, 2),
            "net_margin": round(net_margin, 3),
            "units_sold": int(units_sold),
        },
        "gmroi": {
            "value": round(gmroi, 2),
            "gross_margin": round(gross_profit, 2),
            "avg_inventory_cost": round(avg_inventory, 2),
        },
        "turnover": {
            "ratio": round(turnover, 2),
            "dio": round(dio, 1) if dio is not None else None,
            "cogs": round(cogs, 2),
            "avg_inventory_cost": round(avg_inventory, 2),
        },
        "break_even": _break_even(profile, total_expenses, revenue, gross_profit, units_sold),
        "eoq": _eoq(profile, sales),
        "seasonality": _seasonality(sales),
        "expenses": _expense_pareto(profile),
    }


def empty_payload() -> Dict[str, Any]:
    return {
        "generated_at": "",
        "kpi": {
            "score": 0,
            "label": "Needs attention",
            "profit_score": 0,
            "stock_score": 0,
            "turnover_score": 0,
            "net_margin": 0.0,
        },
        "financials": {
            "revenue": 0.0,
            "cogs": 0.0,
            "gross_profit": 0.0,
            "net_profit": 0.0,
            "total_expenses": 0.0,
            "net_margin": 0.0,
            "units_sold": 0,
        },
        "gmroi": {"value": 0.0, "gross_margin": 0.0, "avg_inventory_cost": 0.0},
        "turnover": {"ratio": 0.0, "dio": None, "cogs": 0.0, "avg_inventory_cost": 0.0},
        "break_even": {
            "total_expenses": 0.0,
            "cm_ratio": 0.0,
            "revenue": None,
            "units": None,
            "products": [],
        },
        "eoq": [],
        "seasonality": {"index": [], "has_data": False},
        "expenses": {"total": 0.0, "pareto": []},
    }
