"""Rule-based chatbot replies grounded in current AI insights."""
from typing import Any, Dict

from backend.insights import empty_insights, get_latest_ai_insights
from backend.store import get_profile


def get_chatbot_response(message: str) -> Dict[str, Any]:
    if get_profile() is None:
        return {
            "reply": "Set up your business profile first so I can give you sales and inventory guidance.",
            "insights": empty_insights(),
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