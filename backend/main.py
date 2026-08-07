from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .service import add_stock, build_dashboard_payload, get_chatbot_response, get_latest_ai_insights, record_sale

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


class StockEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    mode: str = "oneTime"
    dayOfMonth: int | None = None
    timeStr: str | None = None


class ChatbotRequest(BaseModel):
    message: str


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Karobar Assistant backend is running"}


@app.post("/dashboard")
def dashboard(request: DemoSetupRequest) -> Dict[str, Any]:
    payload = request.model_dump()
    return build_dashboard_payload(payload)


@app.post("/sales")
def sales(request: SaleEntryRequest) -> Dict[str, Any]:
    result = record_sale(request.model_dump())
    return result


@app.post("/stock")
def stock_endpoint(request: StockEntryRequest) -> Dict[str, Any]:
    result = add_stock(request.productName, request.quantity)
    result["mode"] = request.mode
    return result


@app.get("/ai-insights")
def ai_insights() -> Dict[str, Any]:
    return get_latest_ai_insights()


@app.post("/chatbot")
def chatbot(request: ChatbotRequest) -> Dict[str, Any]:
    return get_chatbot_response(request.message)
