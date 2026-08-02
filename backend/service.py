from typing import Dict, Any, List, Optional

from .analytics import generate_ai_insights, get_dashboard_summary
from .models import BusinessProfile, Expense, Product, SaleEntry

sales_log: List[SaleEntry] = []
latest_profile: Optional[BusinessProfile] = None


def _sales_entries_for_ai() -> List[Dict[str, Any]]:
    return [
        {
            "productName": entry.product_name,
            "quantity": entry.quantity,
            "period": entry.period,
            "entryDate": entry.entry_date,
        }
        for entry in sales_log
    ]


def build_profile_from_form(form_data: Dict[str, Any]) -> BusinessProfile:
    products = [
        Product(
            name=product.get("name", ""),
            category=product.get("category", "Other"),
            selling_price=float(product.get("sellingPrice", 0) or 0),
            cost_price=float(product.get("costPrice", 0) or 0),
            stock_quantity=int(product.get("stockQuantity", 0) or 0),
            reorder_point=int(product.get("reorderPoint", 0) or 0),
        )
        for product in form_data.get("products", [])
    ]

    expenses = [
        Expense(
            key=item["key"],
            label=item["label"],
            amount=float(item.get("amount", 0) or 0),
            enabled=item.get("enabled", True),
        )
        for item in form_data.get("expenses", [])
    ]

    global latest_profile
    sales_log.clear()
    latest_profile = BusinessProfile(
        business_name=form_data.get("businessName", ""),
        business_type=form_data.get("businessType", ""),
        owner_name=form_data.get("ownerName", ""),
        phone_number=form_data.get("phoneNumber", ""),
        location=form_data.get("location", ""),
        monthly_target=float(form_data.get("monthlyTarget", 0) or 0),
        description=form_data.get("description", ""),
        products=products,
        expenses=expenses,
    )
    return latest_profile


def get_sales_summary() -> Dict[str, Any]:
    totals: Dict[str, int] = {}
    product_history: Dict[str, Dict[str, Any]] = {}

    for entry in sales_log:
        totals[entry.product_name] = totals.get(entry.product_name, 0) + entry.quantity
        history = product_history.setdefault(
            entry.product_name,
            {"product_name": entry.product_name, "total_quantity": 0, "entries": []},
        )
        history["total_quantity"] += entry.quantity
        history["entries"].append(
            {
                "product_name": entry.product_name,
                "quantity": entry.quantity,
                "period": entry.period,
                "entry_date": entry.entry_date,
            }
        )

    return {
        "total_entries": len(sales_log),
        "total_units": sum(entry.quantity for entry in sales_log),
        "totals_by_product": totals,
        "product_history": product_history,
        "recent_entries": [
            {
                "product_name": entry.product_name,
                "quantity": entry.quantity,
                "period": entry.period,
                "entry_date": entry.entry_date,
            }
            for entry in reversed(sales_log[-5:])
        ],
    }


def record_sale(sale_data: Dict[str, Any]) -> Dict[str, Any]:
    entry = SaleEntry(
        product_name=sale_data.get("productName", ""),
        quantity=int(sale_data.get("quantity", 1) or 1),
        period=sale_data.get("period", "day"),
        entry_date=sale_data.get("entryDate", ""),
    )
    sales_log.append(entry)
    summary = get_sales_summary()
    ai_insights = get_latest_ai_insights()
    return {"message": "Sales recorded", "sales_summary": summary, "ai_insights": ai_insights}


def build_dashboard_payload(form_data: Dict[str, Any]) -> Dict[str, Any]:
    profile = build_profile_from_form(form_data)
    summary = get_dashboard_summary(profile)
    summary["products"] = [
        {"name": product.name, "category": product.category}
        for product in profile.products
    ]
    summary["sales_summary"] = get_sales_summary()
    summary["ai_insights"] = get_latest_ai_insights()
    return summary


def get_latest_ai_insights() -> Dict[str, Any]:
    if latest_profile is None:
        return {"forecast": {"next_period_units": 0, "trend": "stable", "confidence": "low"}, "alerts": [], "recommendations": []}
    return generate_ai_insights(latest_profile, _sales_entries_for_ai())


def get_chatbot_response(message: str) -> Dict[str, Any]:
    if latest_profile is None:
        return {
            "reply": "Set up your business profile first so I can give you sales and inventory guidance.",
            "insights": {"forecast": {"next_period_units": 0, "trend": "stable", "confidence": "low"}, "alerts": [], "recommendations": []},
        }

    insights = get_latest_ai_insights()
    lowered = (message or "").lower()

    if "forecast" in lowered or "sales" in lowered:
        forecast = insights["forecast"]
        reply = f"Your forecast points to about {forecast['next_period_units']} units for the next period with a {forecast['trend']} trend."
    elif "alert" in lowered or "stock" in lowered:
        alerts = insights["alerts"]
        if alerts:
            reply = "I found new alerts: " + "; ".join(alert["title"] for alert in alerts[:3])
        else:
            reply = "No urgent alerts right now. Your numbers look healthy."
    elif "recommend" in lowered or "advice" in lowered:
        reply = "Here are the best next actions: " + " ".join(insights["recommendations"][:3])
    else:
        reply = "I can help with sales forecasts, stock alerts, and profit recommendations. Ask me about any of those."

    return {"reply": reply, "insights": insights}
