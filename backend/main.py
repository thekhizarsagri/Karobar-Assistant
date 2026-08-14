from typing import Dict, Any, List
from contextlib import asynccontextmanager
from pathlib import Path
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.aggregation import get_analytics_data
from backend.alerts import clear_all, get_active_alerts
from backend.dashboard import build_dashboard_payload, build_current_dashboard_payload
from backend.insights import get_latest_ai_insights
from backend.notifications import (
    add_notification,
    clear_notifications,
    get_notifications,
    mark_all_read,
    mark_read,
)
from backend.persistence import init as init_persistence
from backend.sales import get_sales_summary, record_sale
from backend.stock import add_stock
from backend.store import reset as reset_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_persistence()
    yield


app = FastAPI(title="Karobar Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _frontend_dist_dir() -> Path | None:
    """Locate the built frontend (used by desktop/production deployments)."""
    candidates: List[Path] = []
    if getattr(sys, "frozen", False) and getattr(sys, "_MEIPASS", None):
        candidates.append(Path(sys._MEIPASS) / "frontend_dist")
    if os.environ.get("KAROBAR_FRONTEND_DIR"):
        candidates.append(Path(os.environ["KAROBAR_FRONTEND_DIR"]))
    candidates.append(Path(__file__).resolve().parent.parent / "frontend" / "dist")
    for candidate in candidates:
        if (candidate / "index.html").exists():
            return candidate
    return None


def _index_file() -> Path | None:
    dist = _frontend_dist_dir()
    if dist is None:
        return None
    return dist / "index.html"


def _serve_index():
    index_file = _index_file()
    if index_file is None:
        return {"message": "Karobar Assistant backend is running. Frontend not built yet."}
    return FileResponse(index_file)


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
    date: str | None = None


class NotificationRequest(BaseModel):
    type: str = "info"
    title: str
    message: str


class NotificationReadRequest(BaseModel):
    id: int | None = None


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/reset")
def reset() -> Dict[str, str]:
    reset_store()
    return {"message": "All data cleared"}


@app.get("/")
def root():
    return _serve_index()


# After API routes are registered, mount the built frontend assets and
# fall back to index.html for SPA routes (/dashboard, /setup, ...).
_dist_dir = _frontend_dist_dir()
if _dist_dir is not None and (_dist_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=_dist_dir / "assets"), name="assets")


@app.post("/api/dashboard")
def dashboard(request: DemoSetupRequest) -> Dict[str, Any]:
    return build_dashboard_payload(request.model_dump())


@app.get("/api/dashboard")
def current_dashboard() -> Dict[str, Any]:
    return build_current_dashboard_payload()


@app.post("/api/sales")
def sales(request: SaleEntryRequest) -> Dict[str, Any]:
    return record_sale(request.model_dump())


@app.post("/api/stock")
def stock_endpoint(request: StockEntryRequest) -> Dict[str, Any]:
    result = add_stock(request.productName, request.quantity, mode=request.mode, date=request.date)
    result["sales_summary"] = get_sales_summary()
    return result


@app.get("/api/ai-insights")
def ai_insights() -> Dict[str, Any]:
    return get_latest_ai_insights()


@app.get("/api/alerts")
def alerts_endpoint() -> List[Dict[str, Any]]:
    return get_active_alerts(get_latest_ai_insights())


@app.post("/api/alerts/clear")
def clear_alerts_endpoint() -> List[Dict[str, Any]]:
    return clear_all(get_latest_ai_insights())


@app.get("/api/notifications")
def notifications_endpoint() -> Dict[str, Any]:
    return get_notifications()


@app.post("/api/notifications")
def create_notification(request: NotificationRequest) -> Dict[str, Any]:
    add_notification(request.type, request.title, request.message)
    return get_notifications()


@app.post("/api/notifications/read")
def mark_notifications_read(request: NotificationReadRequest | None = None) -> Dict[str, Any]:
    if request is not None and request.id is not None:
        return mark_read(request.id)
    return mark_all_read()


@app.post("/api/notifications/clear")
def clear_notifications_endpoint() -> Dict[str, Any]:
    clear_notifications()
    return get_notifications()


@app.get("/api/analytics")
def analytics() -> Dict[str, Any]:
    return get_analytics_data()


# SPA fallback: must be the last registered route so it never shadows /api.
@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):
    if full_path.startswith("api/"):
        return {"message": "Not found"}
    dist = _frontend_dist_dir()
    if dist is not None:
        file_path = (dist / full_path).resolve()
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = _index_file()
        if index_file is not None:
            return FileResponse(index_file)
    return {"message": "Karobar Assistant backend is running. Frontend not built yet."}