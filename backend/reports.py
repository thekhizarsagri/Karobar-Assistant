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
import math
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.store import get_profile, sales_log, stock_log

# Estimates used by the classic formulas (tunable assumptions).
ORDERING_COST = 50.0       # cost to place one purchase order (currency units)
HOLDING_RATE = 0.20        # annual carrying cost as a fraction of unit cost
TARGET_NET_MARGIN = 0.20   # net margin that scores 100 on the health metric
TARGET_TURNOVER = 6.0      # inventory turns / year that scores 100
MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


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


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def _parse_day(date_str: Any) -> Optional[Any]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            return datetime.strptime(str(date_str), fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _sales_rows(profile) -> List[Dict[str, Any]]:
    info = {product.name: (product.selling_price, product.cost_price) for product in profile.products}
    rows: List[Dict[str, Any]] = []
    for entry in sales_log:
        day = _parse_day(entry.entry_date)
        if day is None:
            continue
        selling, cost = info.get(entry.product_name, (0.0, 0.0))
        rows.append(
            {
                "product": entry.product_name,
                "quantity": entry.quantity,
                "day": day,
                "month": day.month,
                "revenue": entry.quantity * selling,
                "cogs": entry.quantity * cost,
            }
        )
    return rows


def _enabled_expenses(profile) -> float:
    return sum(expense.amount for expense in profile.expenses if expense.enabled)


def _avg_inventory_cost(profile) -> float:
    initial: Dict[str, int] = {}
    for entry in stock_log:
        if entry.source == "form":
            initial[entry.product_name] = entry.quantity
    current = 0.0
    initial_value = 0.0
    for product in profile.products:
        current += product.stock_quantity * product.cost_price
        initial_value += initial.get(product.name, 0) * product.cost_price
    if initial_value > 0:
        return (initial_value + current) / 2
    return current


def _stock_health(profile) -> Dict[str, int]:
    ok = reorder = out = 0
    for product in profile.products:
        if product.stock_quantity <= 0:
            out += 1
        elif product.stock_quantity <= product.reorder_point:
            reorder += 1
        else:
            ok += 1
    return {"ok": ok, "reorder": reorder, "out": out}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


# ---------------------------------------------------------------------------
# KPI health score
# ---------------------------------------------------------------------------

def _health_score(net_margin: float, stock_health: Dict[str, int], turnover: float) -> Dict[str, Any]:
    profit_score = _clamp(100 * net_margin / TARGET_NET_MARGIN, 0, 100)
    total_products = sum(stock_health.values())
    stock_ratio = (stock_health["ok"] / total_products) if total_products else 0.0
    stock_score = stock_ratio * 100
    turnover_score = _clamp(100 * turnover / TARGET_TURNOVER, 0, 100)

    score = round(0.4 * profit_score + 0.3 * stock_score + 0.3 * turnover_score)
    if score >= 80:
        label = "Excellent"
    elif score >= 60:
        label = "Good"
    elif score >= 40:
        label = "Fair"
    else:
        label = "Needs attention"

    return {
        "score": score,
        "label": label,
        "profit_score": round(profit_score, 1),
        "stock_score": round(stock_score, 1),
        "turnover_score": round(turnover_score, 1),
        "net_margin": round(net_margin, 3),
    }


# ---------------------------------------------------------------------------
# Break-even analysis
# ---------------------------------------------------------------------------

def _break_even(profile, total_expenses: float, revenue: float, gross_profit: float, units_sold: int) -> Dict[str, Any]:
    cm_ratio = (gross_profit / revenue) if revenue else 0.0
    be_revenue = (total_expenses / cm_ratio) if cm_ratio > 0 else None
    be_units = (total_expenses / (gross_profit / units_sold)) if units_sold > 0 and gross_profit > 0 else None

    products = []
    for product in profile.products:
        contribution = product.selling_price - product.cost_price
        units = (total_expenses / contribution) if contribution > 0 else None
        products.append(
            {
                "product": product.name,
                "contribution": round(contribution, 2),
                "margin_pct": round(contribution / product.selling_price * 100, 1) if product.selling_price > 0 else 0.0,
                "units": round(units) if units is not None else None,
                "revenue": round(units * product.selling_price) if units is not None else None,
            }
        )

    return {
        "total_expenses": round(total_expenses, 2),
        "cm_ratio": round(cm_ratio, 3),
        "revenue": round(be_revenue) if be_revenue is not None else None,
        "units": round(be_units) if be_units is not None else None,
        "products": products,
    }


# ---------------------------------------------------------------------------
# Economic Order Quantity
# ---------------------------------------------------------------------------

def _product_demand(product_name: str, sales: List[Dict[str, Any]]) -> float:
    dates = [row["day"] for row in sales if row["product"] == product_name]
    if not dates:
        return 0.0
    span = max(1, (max(dates) - min(dates)).days + 1)
    total = sum(row["quantity"] for row in sales if row["product"] == product_name)
    return total / span


def _eoq(profile, sales: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for product in profile.products:
        daily = _product_demand(product.name, sales)
        annual_demand = daily * 365
        holding_cost = product.cost_price * HOLDING_RATE
        if annual_demand > 0 and holding_cost > 0:
            order_qty = math.sqrt(2 * annual_demand * ORDERING_COST / holding_cost)
            orders_per_year = annual_demand / order_qty
        else:
            order_qty = 0.0
            orders_per_year = 0.0
        result.append(
            {
                "product": product.name,
                "annual_demand": round(annual_demand),
                "cost_price": round(product.cost_price, 2),
                "holding_cost": round(holding_cost, 2),
                "order_qty": round(order_qty),
                "orders_per_year": round(orders_per_year, 1) if orders_per_year else 0.0,
            }
        )
    return result


# ---------------------------------------------------------------------------
# Seasonality index
# ---------------------------------------------------------------------------

def _seasonality(sales: List[Dict[str, Any]]) -> Dict[str, Any]:
    monthly_totals: Dict[int, int] = {}
    for row in sales:
        monthly_totals[row["month"]] = monthly_totals.get(row["month"], 0) + row["quantity"]
    total = sum(monthly_totals.values())
    has_data = total > 0
    uniform = total / 12 if total else 0.0
    index = [
        {
            "label": MONTH_NAMES[m],
            "value": round(monthly_totals.get(m + 1, 0) / uniform, 2) if uniform else None,
        }
        for m in range(12)
    ]
    return {"index": index, "has_data": has_data}


# ---------------------------------------------------------------------------
# Expense Pareto
# ---------------------------------------------------------------------------

def _expense_pareto(profile) -> Dict[str, Any]:
    enabled = [(e.label, e.amount) for e in profile.expenses if e.enabled and e.amount > 0]
    enabled.sort(key=lambda pair: pair[1], reverse=True)
    total = sum(amount for _, amount in enabled)
    cumulative = 0.0
    pareto = []
    for label, amount in enabled:
        cumulative += amount
        pareto.append(
            {
                "label": label,
                "amount": round(amount, 2),
                "pct": round(amount / total * 100, 1) if total else 0.0,
                "cumulative_pct": round(cumulative / total * 100, 1) if total else 0.0,
            }
        )
    return {"total": round(total, 2), "pareto": pareto}