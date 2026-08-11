from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.aggregation import get_analytics_data
from backend.chatbot import get_chatbot_response
from backend.dashboard import build_dashboard_payload
from backend.insights import get_latest_ai_insights
from backend.notifications import (
    add_notification,
    clear_notifications,
    get_notifications,
    mark_all_read,
    mark_read,
)
from backend.sales import get_sales_summary, record_sale
from backend.stock import add_stock

app = FastAPI(title="Karobar Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DemoSetupRequest(BaseModel):
    businessName: str
    businessType: str
    ownerName: str
    phoneNumber: str
    location: str
    description: str
    products: list[dict]
    expenses: list[dict]


class SaleEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None
    entryType: str = "auto"


class StockEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    mode: str = "oneTime"
    dayOfMonth: int | None = None
    timeStr: str | None = None


class ChatbotRequest(BaseModel):
    message: str


class NotificationRequest(BaseModel):
    type: str = "info"
    title: str
    message: str


class NotificationReadRequest(BaseModel):
    id: int | None = None


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Karobar Assistant backend is running"}


@app.post("/dashboard")
def dashboard(request: DemoSetupRequest) -> Dict[str, Any]:
    return build_dashboard_payload(request.model_dump())


@app.post("/sales")
def sales(request: SaleEntryRequest) -> Dict[str, Any]:
    return record_sale(request.model_dump())


@app.post("/stock")
def stock_endpoint(request: StockEntryRequest) -> Dict[str, Any]:
    result = add_stock(request.productName, request.quantity, mode=request.mode)
    result["sales_summary"] = get_sales_summary()
    return result


@app.get("/ai-insights")
def ai_insights() -> Dict[str, Any]:
    return get_latest_ai_insights()


@app.get("/notifications")
def notifications_endpoint() -> Dict[str, Any]:
    return get_notifications()


@app.post("/notifications")
def create_notification(request: NotificationRequest) -> Dict[str, Any]:
    add_notification(request.type, request.title, request.message)
    return get_notifications()


@app.post("/notifications/read")
def mark_notifications_read(request: NotificationReadRequest | None = None) -> Dict[str, Any]:
    if request is not None and request.id is not None:
        return mark_read(request.id)
    return mark_all_read()


@app.post("/notifications/clear")
def clear_notifications_endpoint() -> Dict[str, Any]:
    clear_notifications()
    return get_notifications()


@app.get("/analytics")
def analytics() -> Dict[str, Any]:
    return get_analytics_data()


@app.post("/chatbot")
def chatbot(request: ChatbotRequest) -> Dict[str, Any]:
    return get_chatbot_response(request.message)