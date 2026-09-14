"""Conversational business-manager assistant (ChatGPT-style, fully offline).

Single-turn questions are answered from live business data; multi-turn
"do it" tasks (add stock, record a sale, add a product, add an expense,
schedule deductions, open pages) run as slot-filling flows with a
confirmation step before anything is written.

Wire-up: POST /api/chat -> handle_chat_message(session_id, message).
Frontend refreshes its data when the response contains refresh=True and
navigates when it contains a navigate page id.
"""
import ast
import operator
import re
from datetime import datetime
from typing import Any, Dict, List, Tuple

from backend.alerts import get_active_alerts
from backend.insights import get_latest_ai_insights
from backend.metrics import calculate_profitability
from backend.models import Expense
from backend.persistence import save_state
from backend.sales import get_sales_summary, record_sale
from backend.stock import add_stock, get_stock_for_product
from backend.store import add_product as store_add_product
from backend.store import get_profile, products_snapshot
from backend.utils import cap

_sessions: Dict[str, Dict[str, Any]] = {}

NUMBER_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
    "fifty": 50, "hundred": 100, "thousand": 1000,
}

YES = {"yes", "yeah", "yep", "yup", "confirm", "confirmed", "ok", "okay",
       "do it", "go ahead", "proceed", "sure", "han", "jee", "acha"}
NO = {"no", "nope", "cancel", "stop", "abort", "don't", "dont", "nahi", "na"}

NAV_PAGES = {
    "dashboard": ("dashboard", "home", "overview page", "main page"),
    "inventory": ("inventory", "stock page"),
    "sales": ("sales", "sales analytics", "analytics page"),
    "editSales": ("edit sales", "record sales", "adjust sales", "add sales"),
    "history": ("history", "product history"),
    "automation": ("automation",),
    "ai": ("ai", "analytics", "insights", "ai insights", "ai analytics"),
    "forecast": ("forecast", "forecasting", "demand forecast", "demand forecasting", "prediction"),
    "reports": ("report", "reports"),
    "expenses": ("expense", "expenses", "monthly expenses"),
    "settings": ("setting", "settings"),
}


def reset_chat(session_id: str | None = None) -> None:
    """Clear conversation state (called on reset / fresh setup)."""
    if session_id is None:
        _sessions.clear()
    else:
        _sessions.pop(session_id, None)


def _session(session_id: str) -> Dict[str, Any]:
    return _sessions.setdefault(session_id or "default", {"pending": None})


# ── formatting helpers ──────────────────────────────────────────────

def _money(profile, value: float) -> str:
    sym = (profile.currency or "").strip() or "Rs"
    num = float(value or 0)
    return f"{sym}{num:,.2f}"


def _fmt_int(value) -> str:
    return f"{int(value or 0):,}"


def _names(products) -> List[str]:
    return [p.name for p in products]


# ── parsing helpers ─────────────────────────────────────────────────

def _parse_quantity(text: str) -> int | None:
    m = re.search(r"(\d[\d,]*)", text)
    if m:
        try:
            return int(m.group(1).replace(",", ""))
        except ValueError:
            return None
    words = re.findall(r"[a-z]+", text.lower())
    total, current = 0, 0
    found = False
    for w in words:
        if w not in NUMBER_WORDS:
            continue
        found = True
        val = NUMBER_WORDS[w]
        if val in (100, 1000):
            current = max(current, 1) * val
            total += current
            current = 0
        else:
            current += val
    total += current
    if not found:
        if re.search(r"\ba\s+dozen\b", text.lower()):
            return 12
        return None
    return total or None


def _parse_money(text: str) -> float | None:
    cleaned = re.sub(r"(rs\.?|pkr|rupees?|₨|₹|\$)", " ", text.lower())
    m = re.search(r"(\d[\d,]*\.?\d*)", cleaned)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def _parse_day(text: str) -> int | None:
    m = re.search(r"(\d{1,2})\s*(st|nd|rd|th)?", text.lower())
    if not m:
        return None
    day = int(m.group(1))
    return day if 1 <= day <= 28 else None


def _parse_time(text: str) -> str | None:
    t = text.lower()
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", t)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    ampm = m.group(3)
    if ampm:
        if not 1 <= hour <= 12 or minute > 59:
            return None
        if ampm == "pm" and hour != 12:
            hour += 12
        if ampm == "am" and hour == 12:
            hour = 0
    else:
        if hour > 23 or minute > 59:
            return None
    return f"{hour:02d}:{minute:02d}"


def _match_product(text: str, products) -> Tuple[List, bool]:
    """Return (matches, exact). Fuzzy: exact, substring, then token overlap."""
    t = re.sub(r"\b(add|stock|units?|pcs|please|the|of|for|to|sell|sale|record|sold)\b", " ", text.lower())
    t = re.sub(r"\d[\d,]*", " ", t).strip()
    names = [(p.name, p.name.strip().lower()) for p in products]
    for name, low in names:
        if t == low:
            return ([name], True)
    contains = [name for name, low in names if t and (t in low or low in t)]
    if len(contains) == 1:
        return (contains, True)
    if contains:
        return (contains, False)
    tokens = set(re.findall(r"[a-z0-9]+", t))
    scored = []
    for name, low in names:
        overlap = len(tokens & set(re.findall(r"[a-z0-9]+", low)))
        if overlap:
            scored.append((overlap, name))
    scored.sort(reverse=True)
    if not scored:
        return ([], False)
    best = scored[0][0]
    top = [name for score, name in scored if score == best]
    return (top, len(top) == 1)


def _match_expense(text: str, expenses) -> Tuple[List, bool]:
    t = text.strip().lower()
    labels = [(e.label, e.label.strip().lower()) for e in expenses]
    for label, low in labels:
        if t == low or t == low.replace(" ", ""):
            return ([label], True)
    contains = [label for label, low in labels if t and (t in low or low in t)]
    if len(contains) == 1:
        return (contains, True)
    return (contains, False)


def _is_yes(text: str) -> bool:
    t = text.strip().lower()
    return t in YES or t.rstrip(".!") in YES


def _is_no(text: str) -> bool:
    t = text.strip().lower()
    return t in NO or t.rstrip(".!") in NO or t.startswith("cancel")


# ── safe calculator ─────────────────────────────────────────────────

_SAFE_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
             ast.Div: operator.truediv, ast.Pow: operator.pow, ast.USub: operator.neg}


def _safe_eval(expr: str):
    def _node(n):
        if isinstance(n, ast.Expression):
            return _node(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in _SAFE_OPS:
            return _SAFE_OPS[type(n.op)](_node(n.left), _node(n.right))
        if isinstance(n, ast.UnaryOp) and type(n.op) in _SAFE_OPS:
            return _SAFE_OPS[type(n.op)](_node(n.operand))
        raise ValueError("unsupported")
    return _node(ast.parse(expr, mode="eval"))


def _try_calculate(text: str) -> str | None:
    t = text.lower().strip().rstrip("?")
    m = re.match(r"(?:what(?:'s| is)?|calculate|calc)?\s*(\d[\d,.]*)\s*%\s*of\s*(\d[\d,.]*)", t)
    if m:
        try:
            pct = float(m.group(1).replace(",", ""))
            base = float(m.group(2).replace(",", ""))
            return f"{pct:g}% of {base:g} = {base * pct / 100:,.2f}"
        except ValueError:
            return None
    if re.fullmatch(r"[\d\s,.*/+()\-^%]+", t) and re.search(r"\d", t):
        expr = t.replace("^", "**").replace(",", "")
        try:
            result = _safe_eval(expr)
            return f"{expr.strip()} = {result:,.2f}" if isinstance(result, float) else f"{expr.strip()} = {result:,}"
        except Exception:
            return None
    stripped = re.sub(r"^(what'?s|what is|how much is|calculate|calc|solve|evaluate)\s+", "", t).strip()
    if stripped != t and re.fullmatch(r"[\d\s,.*/+()\-^%]+", stripped) and re.search(r"\d", stripped):
        expr = stripped.replace("^", "**").replace(",", "")
        try:
            result = _safe_eval(expr)
            return f"{expr.strip()} = {result:,.2f}" if isinstance(result, float) else f"{expr.strip()} = {result:,}"
        except Exception:
            return None
    return None


# ── intent detection ────────────────────────────────────────────────

def _intent(text: str) -> str:
    t = text.lower()
    if re.search(r"\b(add|increase|plus|restock|top ?up|refill)\b.*\b(stock|inventory|units?|pcs)\b|\b(add|restock)\b.*\b\d+\b.*\b(units?|pcs)\b", t):
        return "add_stock"
    if re.search(r"\b(sell|sold|sale|record).{0,30}\b(sale|sell|sold)\b|\b(sell|sold)\b", t) and not re.search(r"best ?sell|selling|sales (analytics|report|overview|recap|summary|total)", t):
        return "record_sale"
    if re.search(r"\badd\b.{0,30}\bproduct\b|\bnew product\b|\bcreate\b.{0,20}\bproduct\b", t):
        return "add_product"
    if re.search(r"\bschedule\b|\bauto.?deduct", t):
        return "schedule_expense"
    if re.search(r"\badd\b.{0,30}\bexpense\b|\bnew expense\b", t):
        return "add_expense"
    if re.search(r"\bnavigate|open|show|go to|take me|switch to\b", t):
        return "navigate"
    if re.search(r"\bbest ?sell|top.?product|best.?month\b", t):
        return "query_best"
    if re.search(r"\bstock\b|inventory|how many (units|left)|left in", t):
        return "query_stock"
    if re.search(r"\bprofit\b|\bearn\b|margin\b", t):
        return "query_profit"
    if re.search(r"\bexpense\b|\bcost\b|\bspend", t):
        return "query_expenses"
    if re.search(r"\bsale\b|revenue\b|\bsold\b", t):
        return "query_sales"
    if re.search(r"\balert\b|warn|attention|restock|running low|out of stock|needs?\b", t):
        return "query_alerts"
    if re.search(r"\breport\b", t):
        return "query_reports"
    if re.search(r"\bforecast\b|predict|future|next month|demand\b", t):
        return "query_forecast"
    if re.search(r"\bhistory\b", t):
        return "query_history"
    if re.search(r"\b(hello|hi|hey|salam|aoa|good (morning|afternoon|evening))\b", t):
        return "greeting"
    if re.search(r"\bthank|shukriya\b", t):
        return "thanks"
    if re.search(r"\b(bye|goodbye|see you|allah hafiz)\b", t):
        return "bye"
    if re.search(r"\bwho are you|your name|what can you|help\b|\bmenu\b|options\b", t):
        return "help"
    if re.search(r"\bcancel|never ?mind|forget it|stop\b", t):
        return "cancel"
    return "fallback"


# ── query handlers ──────────────────────────────────────────────────

def _query_stock(profile) -> Dict[str, Any]:
    products = profile.products
    total = sum(p.stock_quantity for p in products)
    out = [p.name for p in products if p.stock_quantity <= 0]
    low = sorted([p for p in products if 0 < p.stock_quantity <= 10],
                 key=lambda p: p.stock_quantity)[:5]
    lines = [f"You hold {_fmt_int(total)} units across {len(products)} products."]
    if out:
        lines.append("Out of stock: " + ", ".join(out) + ".")
    if low:
        lines.append("Running low: " + ", ".join(f"{p.name} ({p.stock_quantity})" for p in low) + ".")
    if not out and not low:
        lines.append("Everything is healthily stocked.")
    lines.append("Say 'add stock' and I'll restock anything for you.")
    return {"reply": "\n".join(lines), "suggestions": ["Add stock", "Any alerts?", "Profit summary"]}


def _query_profit(profile) -> Dict[str, Any]:
    m = calculate_profitability(profile)
    tone = "in profit" if m["net_profit"] >= 0 else "in loss"
    reply = (
        f"Revenue { _money(profile, m['total_revenue']) } | COGS { _money(profile, m['total_cogs']) }\n"
        f"Gross profit { _money(profile, m['gross_profit'])} | Expenses { _money(profile, m['total_expenses'])}\n"
        f"Net profit { _money(profile, m['net_profit'])} — you're {tone}."
    )
    return {"reply": reply, "suggestions": ["Expense total", "Sales recap", "Business Reports"]}


def _query_expenses(profile) -> Dict[str, Any]:
    active = [e for e in profile.expenses if e.enabled]
    total = sum(e.amount for e in active)
    lines = [f"Monthly expenses total {_money(profile, total)} across {len(active)} active items:"]
    for e in active[:8]:
        lines.append(f"• {e.label}: {_money(profile, e.amount)}")
    if len(active) > 8:
        lines.append(f"…and {len(active) - 8} more on the Monthly Expenses page.")
    lines.append("Say 'add expense' to add one, or 'schedule' to automate deductions.")
    return {"reply": "\n".join(lines), "suggestions": ["Add expense", "Set schedule", "Profit summary"]}


def _query_sales(profile) -> Dict[str, Any]:
    s = get_sales_summary()
    lines = [f"{_fmt_int(s['total_units'])} units sold in {_fmt_int(s['total_entries'])} entries."]
    hist = s.get("product_history", {})
    if hist:
        top = sorted(hist.items(), key=lambda kv: kv[1]["total_quantity"], reverse=True)[:5]
        lines.append("Top sellers: " + ", ".join(f"{name} ({_fmt_int(v['total_quantity'])})" for name, v in top) + ".")
    lines.append("Say 'record sale' and I'll log one for you.")
    return {"reply": "\n".join(lines), "suggestions": ["Record a sale", "Stock status", "Sales Analytics"]}


def _query_alerts(profile) -> Dict[str, Any]:
    alerts = [a for a in get_active_alerts(get_latest_ai_insights())
              if "steady" not in str(a.get("message", "")).lower()
              and "no urgent" not in str(a.get("message", "")).lower()][:5]
    if not alerts:
        return {"reply": "No urgent alerts — stock is healthy and everything is on track. Nicely managed.",
                "suggestions": ["Stock status", "Profit summary", "Sales recap"]}
    lines = ["Here's what needs your attention:"]
    lines += [f"• {a.get('title', 'Alert')}: {a.get('message', '')}" for a in alerts]
    return {"reply": "\n".join(lines), "suggestions": ["Add stock", "Stock status", "Anything else?"]}


def _query_best(profile) -> Dict[str, Any]:
    from backend.aggregation import get_analytics_data
    data = get_analytics_data()
    monthly = data.get("monthly", {})
    totals: Dict[str, float] = {}
    for per_product in monthly.values():
        for name, qty in (per_product or {}).items():
            totals[name] = totals.get(name, 0) + (qty or 0)
    if not totals:
        return {"reply": "No sales recorded yet — record your first sale and I'll start ranking your best sellers.",
                "suggestions": ["Record a sale", "Add stock", "Sales Analytics"]}
    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)[:3]
    best = ranked[0]
    reply = f"Your best seller is {best[0]} with {_fmt_int(best[1])} units sold."
    if len(ranked) > 1:
        reply += "\nRunner-up: " + ", ".join(f"{n} ({_fmt_int(q)})" for n, q in ranked[1:]) + "."
    return {"reply": reply, "suggestions": ["Sales recap", "Stock status", "Business Reports"]}


def _query_reports(profile) -> Dict[str, Any]:
    from backend.reports import get_reports
    try:
        rep = get_reports()
    except Exception:
        rep = {}
    kpi = (rep or {}).get("kpi", {})
    fin = (rep or {}).get("financials", {})
    lines = []
    if kpi:
        lines.append(f"Business health score: {kpi.get('score', '—')}/100 ({kpi.get('label', '')}).")
    if fin:
        lines.append(f"Revenue { _money(profile, fin.get('revenue', 0))} | Net profit { _money(profile, fin.get('net_profit', 0))}.")
    lines.append("Open Business Reports for GMROI, break-even and replenishment plans.")
    return {"reply": "\n".join(lines), "suggestions": ["Profit summary", "Business Reports", "Forecast"]}


def _query_forecast(profile) -> Dict[str, Any]:
    from backend.aggregation import get_analytics_data
    from backend.forecast import forecast_next_period
    from backend.store import sales_entries_for_ai
    try:
        fc = forecast_next_period(sales_entries_for_ai()) or {}
    except Exception:
        fc = {}
    items = fc.get("items", fc.get("forecast", [])) if isinstance(fc, dict) else []
    lines = []
    if items:
        for it in list(items)[:5]:
            name = it.get("product_name", it.get("name", "?"))
            qty = it.get("forecast_quantity", it.get("quantity", it.get("forecast")))
            lines.append(f"• {name}: ~{_fmt_int(qty)} units next period")
    else:
        monthly = get_analytics_data().get("monthly", {})
        if monthly:
            last = sorted(monthly.keys())[-1]
            tot = sum((monthly[last] or {}).values())
            lines.append(f"Last month moved {_fmt_int(tot)} units — the Forecasting page projects next month per product.")
        else:
            lines.append("Not enough sales history to forecast yet — log some sales first.")
    lines.append("Open Demand Forecasting for the full projection.")
    return {"reply": "\n".join(lines), "suggestions": ["Record a sale", "Stock status", "Demand Forecasting"]}


def _query_history(profile) -> Dict[str, Any]:
    s = get_sales_summary()
    hist = s.get("product_history", {})
    if not hist:
        return {"reply": "No sales history yet. Record a sale and it will show up here and in Product History.",
                "suggestions": ["Record a sale", "Product History"]}
    lines = [f"{len(hist)} products with history:"]
    for name, h in list(hist.items())[:6]:
        lines.append(f"• {name}: {_fmt_int(h['total_quantity'])} sold in {len(h['entries'])} entries")
    lines.append("Open Product History for the full timeline.")
    return {"reply": "\n".join(lines), "suggestions": ["Sales recap", "Product History"]}


# ── action flows ────────────────────────────────────────────────────

def _ask_product(products, extra="") -> Dict[str, Any]:
    names = _names(products)[:8]
    text = "Which product?" + (f" {extra}" if extra else "")
    return {"reply": text, "suggestions": names + ["Cancel"]}


def _start_add_stock(profile, text, sess) -> Dict[str, Any]:
    products = profile.products
    if not products:
        return {"reply": "Your catalog is empty — say 'add product' first and I'll create one.",
                "suggestions": ["Add product", "Cancel"]}
    qty = _parse_quantity(text)
    matches, exact = _match_product(text, products)
    slots: Dict[str, Any] = {}
    if matches and exact:
        slots["product"] = matches[0]
    if qty:
        slots["quantity"] = qty
    if slots.get("product") and slots.get("quantity"):
        sess["pending"] = {"action": "add_stock", "slots": slots, "step": "confirm"}
        return _confirm_add_stock(profile, slots)
    sess["pending"] = {"action": "add_stock", "slots": slots,
                       "step": "quantity" if slots.get("product") else "product"}
    if slots.get("product"):
        return {"reply": f"How many units of {slots['product']} should I add?",
                "suggestions": ["10", "25", "50", "100", "Cancel"]}
    return _ask_product(products)


def _confirm_add_stock(profile, slots) -> Dict[str, Any]:
    return {
        "reply": f"Add {_fmt_int(slots['quantity'])} units to {slots['product']}? Current stock: {_fmt_int(get_stock_for_product(slots['product']))}.",
        "suggestions": ["Confirm", "Cancel"],
    }


def _execute_add_stock(profile, slots) -> Dict[str, Any]:
    qty = cap(int(slots["quantity"]))
    if qty <= 0:
        return {"reply": "Quantity must be at least 1 — how many units should I add?",
                "suggestions": ["10", "25", "50", "Cancel"]}
    result = add_stock(slots["product"], qty, mode="oneTime")
    new_level = result.get("newStock", get_stock_for_product(slots["product"]))
    return {
        "reply": f"Done — added {_fmt_int(qty)} units to {slots['product']}. New stock level: {_fmt_int(new_level)} units.",
        "suggestions": ["Stock status", "Record a sale", "Add stock"],
        "refresh": True,
    }


def _start_record_sale(profile, text, sess) -> Dict[str, Any]:
    products = profile.products
    if not products:
        return {"reply": "Your catalog is empty — say 'add product' first.",
                "suggestions": ["Add product", "Cancel"]}
    qty = _parse_quantity(text)
    matches, exact = _match_product(text, products)
    slots: Dict[str, Any] = {}
    if matches and exact:
        slots["product"] = matches[0]
    if qty:
        slots["quantity"] = qty
    if slots.get("product") and slots.get("quantity"):
        sess["pending"] = {"action": "record_sale", "slots": slots, "step": "confirm"}
        return _confirm_sale(profile, slots)
    sess["pending"] = {"action": "record_sale", "slots": slots,
                       "step": "quantity" if slots.get("product") else "product"}
    if slots.get("product"):
        avail = get_stock_for_product(slots["product"])
        return {"reply": f"How many units of {slots['product']} were sold? ({_fmt_int(avail)} in stock)",
                "suggestions": ["1", "5", "10", "Cancel"]}
    return _ask_product(products, "What did you sell?")


def _confirm_sale(profile, slots) -> Dict[str, Any]:
    avail = get_stock_for_product(slots["product"])
    return {
        "reply": f"Record a sale of {_fmt_int(slots['quantity'])} x {slots['product']}? ({_fmt_int(avail)} in stock)",
        "suggestions": ["Confirm", "Cancel"],
    }


def _execute_sale(profile, slots) -> Dict[str, Any]:
    qty = cap(int(slots["quantity"]))
    if qty <= 0:
        return {"reply": "Quantity must be at least 1 — how many were sold?",
                "suggestions": ["1", "5", "10", "Cancel"]}
    result = record_sale({"productName": slots["product"], "quantity": qty,
                          "period": "day", "entryDate": datetime.now().date().isoformat(),
                          "entryType": "manual"})
    if result.get("error"):
        return {"reply": result.get("message", "Couldn't record that sale.") +
                "\nSay 'add stock' and I'll restock first.",
                "suggestions": ["Add stock", "Stock status", "Cancel"], "refresh": True}
    left = get_stock_for_product(slots["product"])
    return {
        "reply": f"Logged — {_fmt_int(qty)} x {slots['product']} sold. {_fmt_int(left)} units left in stock.",
        "suggestions": ["Sales recap", "Stock status", "Record a sale"],
        "refresh": True,
    }


def _start_add_product(profile, text, sess) -> Dict[str, Any]:
    sess["pending"] = {"action": "add_product", "slots": {}, "step": "name"}
    return {"reply": "Let's create it. What's the product name?", "suggestions": ["Cancel"]}


def _execute_add_product(profile, slots) -> Dict[str, Any]:
    payload = {
        "name": slots["name"], "category": slots.get("category") or "Other",
        "sku": "", "sellingPrice": slots["selling"], "costPrice": slots.get("cost", 0),
        "stockAvailable": slots.get("stock", 0), "reorderPoint": 10,
        "unit": "pcs", "description": "",
    }
    result = store_add_product(payload)
    if result.get("error") == "duplicate_product":
        return {"reply": f"'{slots['name']}' is already in your catalog — pick another name.",
                "suggestions": ["Cancel"]}
    if result.get("error"):
        return {"reply": "Couldn't add that product — please try again.", "suggestions": ["Cancel"]}
    return {
        "reply": f"Done — {slots['name']} is now in your catalog at {_money(profile, slots['selling'])} with {_fmt_int(slots.get('stock', 0))} units in stock.",
        "suggestions": ["Stock status", "Add product", "Inventory"],
        "refresh": True,
    }


def _confirm_add_product(profile, slots) -> Dict[str, Any]:
    return {
        "reply": (f"Create {slots['name']} at {_money(profile, slots['selling'])} "
                  f"(cost {_money(profile, slots.get('cost', 0))}, opening stock {_fmt_int(slots.get('stock', 0))})?",
                  ),
        "suggestions": ["Confirm", "Cancel"],
    }


def _start_add_expense(profile, text, sess) -> Dict[str, Any]:
    amt = _parse_money(text)
    slots: Dict[str, Any] = {}
    if amt and amt > 0:
        slots["amount"] = amt
    sess["pending"] = {"action": "add_expense", "slots": slots,
                       "step": "amount" if not slots.get("amount") else "name"}
    if slots.get("amount"):
        return {"reply": f"What should I call this {_money(profile, amt)} monthly expense?",
                "suggestions": ["Cancel"]}
    return {"reply": "What's the monthly amount for the new expense?",
            "suggestions": ["Cancel"]}


def _confirm_add_expense(profile, slots) -> Dict[str, Any]:
    return {
        "reply": f"Add monthly expense '{slots['name']}' of {_money(profile, slots['amount'])}?",
        "suggestions": ["Confirm", "Cancel"],
    }


def _execute_add_expense(profile, slots) -> Dict[str, Any]:
    base = re.sub(r"[^a-z0-9]+", "_", slots["name"].lower()).strip("_") or "expense"
    key, suffix = base, 2
    existing = {e.key for e in profile.expenses}
    while key in existing:
        key = f"{base}_{suffix}"
        suffix += 1
    profile.expenses.append(Expense(key=key, label=slots["name"],
                                    amount=float(slots["amount"]), enabled=True,
                                    deduction_day=1, deduction_time="09:00"))
    save_state()
    return {
        "reply": f"Done — '{slots['name']}' ({_money(profile, slots['amount'])}/month) added. Say 'schedule' to automate its deduction.",
        "suggestions": ["Set schedule", "Expense total", "Monthly Expenses"],
        "refresh": True,
    }


def _start_schedule(profile, text, sess) -> Dict[str, Any]:
    enabled = [e for e in profile.expenses if e.enabled]
    if not enabled:
        return {"reply": "No active expenses to schedule — say 'add expense' first.",
                "suggestions": ["Add expense", "Cancel"]}
    matches, exact = _match_expense(text, enabled)
    slots: Dict[str, Any] = {}
    if matches and exact:
        slots["expense"] = matches[0]
    day = _parse_day(text)
    if day:
        slots["day"] = day
    tm = _parse_time(text)
    if tm:
        slots["time"] = tm
    if slots.get("expense") and slots.get("day") and slots.get("time"):
        sess["pending"] = {"action": "schedule_expense", "slots": slots, "step": "confirm"}
        return _confirm_schedule(profile, slots)
    step = "expense"
    if slots.get("expense"):
        step = "time" if slots.get("day") else "day"
    sess["pending"] = {"action": "schedule_expense", "slots": slots, "step": step}
    if step == "expense":
        return {"reply": "Which expense should I schedule?",
                "suggestions": [e.label for e in enabled[:6]] + ["Cancel"]}
    if step == "day":
        return {"reply": f"Which day of the month should '{slots['expense']}' deduct?",
                "suggestions": ["1st", "5th", "10th", "15th", "Cancel"]}
    return {"reply": f"What time should '{slots['expense']}' deduct on day {slots['day']}?",
            "suggestions": ["09:00", "12:00", "18:00", "Cancel"]}


def _confirm_schedule(profile, slots) -> Dict[str, Any]:
    return {
        "reply": f"Schedule '{slots['expense']}' for day {slots['day']} at {slots['time']} every month?",
        "suggestions": ["Confirm", "Cancel"],
    }


def _execute_schedule(profile, slots) -> Dict[str, Any]:
    exp = next((e for e in profile.expenses if e.label == slots["expense"]), None)
    if exp is None:
        return {"reply": "That expense no longer exists.", "suggestions": ["Expense total", "Cancel"]}
    exp.deduction_day = int(slots["day"])
    exp.deduction_time = slots["time"]
    save_state()
    return {
        "reply": f"Done — '{exp.label}' deducts on day {exp.deduction_day} at {exp.deduction_time} every month.",
        "suggestions": ["Expense total", "Monthly Expenses"],
        "refresh": True,
    }


# ── pending-flow continuation ───────────────────────────────────────

def _continue_pending(profile, text, sess) -> Dict[str, Any] | None:
    pending = sess.get("pending")
    if not pending:
        return None
    action, slots, step = pending["action"], pending["slots"], pending["step"]

    if step == "confirm":
        if _is_yes(text):
            sess["pending"] = None
            return _execute(action, profile, slots)
        if _is_no(text):
            sess["pending"] = None
            return {"reply": "Cancelled — nothing was changed.", "suggestions": ["Help", "Stock status"]}
        sess["pending"] = None  # new topic — drop the stale confirmation
        return None

    if _is_no(text):
        sess["pending"] = None
        return {"reply": "Cancelled — nothing was changed.", "suggestions": ["Help", "Stock status"]}

    if action == "add_stock":
        if step == "product":
            matches, exact = _match_product(text, profile.products)
            if not matches:
                return _ask_product(profile.products, "I couldn't find that — pick from your catalog:")
            if not exact:
                sess["pending"] = {"action": "add_stock", "slots": slots, "step": "choose_product"}
                sess["pending"]["candidates"] = matches[:6]
                return {"reply": f"Which one did you mean: {', '.join(matches[:6])}?",
                        "suggestions": matches[:6] + ["Cancel"]}
            slots["product"] = matches[0]
            pending["step"] = "quantity"
            return {"reply": f"How many units of {matches[0]} should I add?",
                    "suggestions": ["10", "25", "50", "100", "Cancel"]}
        if step == "choose_product":
            matches, exact = _match_product(text, profile.products)
            cands = pending.get("candidates", [])
            pick = next((c for c in cands if c.lower() in text.lower() or text.lower() in c.lower()), None)
            if pick is None and matches and exact:
                pick = matches[0]
            if pick is None:
                return {"reply": f"Pick one: {', '.join(cands)}.", "suggestions": cands + ["Cancel"]}
            slots["product"] = pick
            pending["step"] = "quantity"
            return {"reply": f"How many units of {pick} should I add?",
                    "suggestions": ["10", "25", "50", "100", "Cancel"]}
        if step == "quantity":
            qty = _parse_quantity(text)
            if not qty or qty <= 0:
                return {"reply": "I need a number above zero — how many units?",
                        "suggestions": ["10", "25", "50", "Cancel"]}
            slots["quantity"] = qty
            pending["step"] = "confirm"
            return _confirm_add_stock(profile, slots)

    if action == "record_sale":
        if step == "product":
            matches, exact = _match_product(text, profile.products)
            if not matches:
                return _ask_product(profile.products, "I couldn't find that. What did you sell?")
            if not exact:
                pending["step"] = "choose_product"
                pending["candidates"] = matches[:6]
                return {"reply": f"Which one: {', '.join(matches[:6])}?",
                        "suggestions": matches[:6] + ["Cancel"]}
            slots["product"] = matches[0]
            pending["step"] = "quantity"
            avail = get_stock_for_product(matches[0])
            return {"reply": f"How many units of {matches[0]} were sold? ({_fmt_int(avail)} in stock)",
                    "suggestions": ["1", "5", "10", "Cancel"]}
        if step == "choose_product":
            cands = pending.get("candidates", [])
            pick = next((c for c in cands if c.lower() in text.lower() or text.lower() in c.lower()), None)
            if pick is None:
                return {"reply": f"Pick one: {', '.join(cands)}.", "suggestions": cands + ["Cancel"]}
            slots["product"] = pick
            pending["step"] = "quantity"
            avail = get_stock_for_product(pick)
            return {"reply": f"How many units of {pick} were sold? ({_fmt_int(avail)} in stock)",
                    "suggestions": ["1", "5", "10", "Cancel"]}
        if step == "quantity":
            qty = _parse_quantity(text)
            if not qty or qty <= 0:
                return {"reply": "I need a number above zero — how many were sold?",
                        "suggestions": ["1", "5", "10", "Cancel"]}
            avail = get_stock_for_product(slots["product"])
            if qty > avail:
                return {"reply": f"Only {_fmt_int(avail)} units of {slots['product']} in stock — sell {_fmt_int(avail)} or fewer, or say 'add stock' first.",
                        "suggestions": ["Add stock", "Cancel"]}
            slots["quantity"] = qty
            pending["step"] = "confirm"
            return _confirm_sale(profile, slots)

    if action == "add_product":
        if step == "name":
            name = text.strip().strip("\"'")[:60]
            if not name or len(name) < 2:
                return {"reply": "Give me a proper product name (at least 2 characters).",
                        "suggestions": ["Cancel"]}
            if any(p.name.strip().lower() == name.lower() for p in profile.products):
                return {"reply": f"'{name}' is already in your catalog — pick another name.",
                        "suggestions": ["Cancel"]}
            slots["name"] = name
            pending["step"] = "selling"
            return {"reply": f"What's the selling price of {name}?", "suggestions": ["Cancel"]}
        if step == "selling":
            amt = _parse_money(text)
            if not amt or amt <= 0:
                return {"reply": "Selling price must be above zero — what price?",
                        "suggestions": ["Cancel"]}
            slots["selling"] = amt
            pending["step"] = "cost"
            return {"reply": f"And the cost price? (type 0 if none)",
                    "suggestions": ["0", "Cancel"]}
        if step == "cost":
            amt = _parse_money(text)
            if amt is None or amt < 0:
                return {"reply": "Give me a number for the cost price (0 is fine).",
                        "suggestions": ["0", "Cancel"]}
            slots["cost"] = amt
            pending["step"] = "stock"
            return {"reply": "Opening stock quantity?", "suggestions": ["0", "10", "50", "Cancel"]}
        if step == "stock":
            qty = _parse_quantity(text)
            if qty is None or qty < 0:
                return {"reply": "Give me a number for the opening stock (0 is fine).",
                        "suggestions": ["0", "10", "50", "Cancel"]}
            slots["stock"] = qty
            pending["step"] = "confirm"
            return _confirm_add_product(profile, slots)

    if action == "add_expense":
        if step == "amount":
            amt = _parse_money(text)
            if not amt or amt <= 0:
                return {"reply": "Amount must be above zero — what's the monthly amount?",
                        "suggestions": ["Cancel"]}
            slots["amount"] = amt
            pending["step"] = "name"
            return {"reply": f"What should I call this {_money(profile, amt)} monthly expense?",
                    "suggestions": ["Cancel"]}
        if step == "name":
            name = text.strip().strip("\"'")[:60]
            if not name or len(name) < 2:
                return {"reply": "Give me a proper expense name.", "suggestions": ["Cancel"]}
            if any(e.label.strip().lower() == name.lower() for e in profile.expenses):
                return {"reply": f"'{name}' already exists — pick another name.", "suggestions": ["Cancel"]}
            slots["name"] = name
            pending["step"] = "confirm"
            return _confirm_add_expense(profile, slots)

    if action == "schedule_expense":
        enabled = [e for e in profile.expenses if e.enabled]
        if step == "expense":
            matches, exact = _match_expense(text, enabled)
            if not matches:
                return {"reply": "I couldn't find that expense. Which one?",
                        "suggestions": [e.label for e in enabled[:6]] + ["Cancel"]}
            if not exact:
                pending["candidates"] = matches[:6]
                pending["step"] = "choose_expense"
                return {"reply": f"Which one: {', '.join(matches[:6])}?",
                        "suggestions": matches[:6] + ["Cancel"]}
            slots["expense"] = matches[0]
            pending["step"] = "day"
            return {"reply": f"Which day of the month should '{matches[0]}' deduct?",
                    "suggestions": ["1st", "5th", "10th", "15th", "Cancel"]}
        if step == "choose_expense":
            cands = pending.get("candidates", [])
            pick = next((c for c in cands if c.lower() in text.lower() or text.lower() in c.lower()), None)
            if pick is None:
                return {"reply": f"Pick one: {', '.join(cands)}.", "suggestions": cands + ["Cancel"]}
            slots["expense"] = pick
            pending["step"] = "day"
            return {"reply": f"Which day of the month should '{pick}' deduct?",
                    "suggestions": ["1st", "5th", "10th", "15th", "Cancel"]}
        if step == "day":
            day = _parse_day(text)
            if not day:
                return {"reply": "Pick a day between 1 and 28.",
                        "suggestions": ["1st", "5th", "10th", "15th", "Cancel"]}
            slots["day"] = day
            pending["step"] = "time"
            return {"reply": f"What time should '{slots['expense']}' deduct on day {day}?",
                    "suggestions": ["09:00", "12:00", "18:00", "Cancel"]}
        if step == "time":
            tm = _parse_time(text)
            if not tm:
                return {"reply": "Give me a time like 9am or 14:30.",
                        "suggestions": ["09:00", "12:00", "18:00", "Cancel"]}
            slots["time"] = tm
            pending["step"] = "confirm"
            return _confirm_schedule(profile, slots)

    sess["pending"] = None
    return None


def _execute(action: str, profile, slots: Dict[str, Any]) -> Dict[str, Any]:
    if action == "add_stock":
        return _execute_add_stock(profile, slots)
    if action == "record_sale":
        return _execute_sale(profile, slots)
    if action == "add_product":
        return _execute_add_product(profile, slots)
    if action == "add_expense":
        return _execute_add_expense(profile, slots)
    if action == "schedule_expense":
        return _execute_schedule(profile, slots)
    return {"reply": "That action expired — let's start over. What do you need?",
            "suggestions": ["Help"]}


# ── main entry ──────────────────────────────────────────────────────

HELP_TEXT = (
    "Here's what I can do, boss:\n"
    "• Answer anything about stock, sales, profit, expenses, alerts, reports and forecasts\n"
    "• Do tasks: 'add stock', 'record sale', 'add product', 'add expense', 'schedule deductions'\n"
    "• Open pages: 'open inventory', 'show reports', 'go to expenses'\n"
    "• Quick math: 'what is 15% of 20000'\n"
    "Just say the word."
)
HELP_SUGGESTIONS = ["Stock status", "Add stock", "Record a sale", "Profit summary",
                    "Add expense", "Business Reports"]


def handle_chat_message(session_id: str, message: str) -> Dict[str, Any]:
    profile = get_profile()
    if profile is None:
        return {"reply": "No business set up yet — complete the setup form first, then I'll be at your service.",
                "suggestions": []}
    text = (message or "").strip()
    if not text:
        return {"reply": "I'm listening — ask me anything about your business.",
                "suggestions": HELP_SUGGESTIONS[:4]}
    if len(text) > 500:
        text = text[:500]
    sess = _session(session_id or "default")

    continued = _continue_pending(profile, text, sess)
    if continued is not None:
        return continued

    intent = _intent(text)

    if intent == "cancel":
        return {"reply": "Nothing pending — what can I do for you?",
                "suggestions": HELP_SUGGESTIONS[:4]}
    if intent == "greeting":
        owner = (profile.owner_name or "").strip()
        first = owner.split()[0] if owner else "boss"
        total = sum(p.stock_quantity for p in profile.products)
        return {
            "reply": (f"Hello {first}! {len(profile.products)} products, {_fmt_int(total)} units in stock. "
                      f"Give me an order — or ask me anything."),
            "suggestions": ["Stock status", "Add stock", "Profit summary", "Any alerts?"],
        }
    if intent == "thanks":
        return {"reply": "Anytime, boss. Keeping this business sharp is my whole job.",
                "suggestions": ["Stock status", "Sales recap", "Anything else?"]}
    if intent == "bye":
        return {"reply": "Signing off. I'll keep an eye on the numbers while you're away.",
                "suggestions": ["Stock status"]}
    if intent == "help":
        return {"reply": HELP_TEXT, "suggestions": HELP_SUGGESTIONS}
    if intent == "add_stock":
        return _start_add_stock(profile, text, sess)
    if intent == "record_sale":
        return _start_record_sale(profile, text, sess)
    if intent == "add_product":
        return _start_add_product(profile, text, sess)
    if intent == "add_expense":
        return _start_add_expense(profile, text, sess)
    if intent == "schedule_expense":
        return _start_schedule(profile, text, sess)
    if intent == "navigate":
        t = text.lower()
        for page, keys in NAV_PAGES.items():
            if any(k in t for k in keys):
                label = page if page != "ai" else "Analytics"
                return {"reply": f"Opening {label} for you.",
                        "suggestions": ["Stock status", "Help"], "navigate": page}
        return {"reply": "Which page — dashboard, inventory, sales, expenses, reports, forecast, history, automation, analytics or settings?",
                "suggestions": ["Dashboard", "Inventory", "Expenses", "Reports"]}
    if intent == "query_stock":
        return _query_stock(profile)
    if intent == "query_profit":
        return _query_profit(profile)
    if intent == "query_expenses":
        return _query_expenses(profile)
    if intent == "query_sales":
        return _query_sales(profile)
    if intent == "query_alerts":
        return _query_alerts(profile)
    if intent == "query_best":
        return _query_best(profile)
    if intent == "query_reports":
        return _query_reports(profile)
    if intent == "query_forecast":
        return _query_forecast(profile)
    if intent == "query_history":
        return _query_history(profile)

    calc = _try_calculate(text)
    if calc:
        return {"reply": calc, "suggestions": ["Profit summary", "Add stock", "Help"]}
    return {
        "reply": ("I want to get that exactly right — I can answer anything about your stock, sales, "
                  "profit, expenses, alerts, reports and forecasts, and I can do tasks like adding stock, "
                  "recording sales, adding products or expenses, and scheduling deductions.\n"
                  "Try rephrasing, or pick one:"),
        "suggestions": HELP_SUGGESTIONS[:4],
    }
