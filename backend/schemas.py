"""Pydantic request schemas for the API."""
from pydantic import BaseModel


TRILLION = 1_000_000_000_000


def _cap(value: int, limit: int = TRILLION) -> int:
    return max(0, min(value, limit))


class DemoSetupRequest(BaseModel):
    businessName: str
    businessType: str
    ownerName: str
    phoneNumber: str
    location: str
    description: str
    email: str = ""
    username: str = ""
    password: str = ""
    currency: str = "₹"
    taxId: str = ""
    products: list[dict]
    expenses: list[dict]


class SaleEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None
    entryType: str = "auto"

    def model_post_init(self, __context) -> None:
        self.quantity = _cap(self.quantity)


class StockEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    mode: str = "oneTime"
    dayOfMonth: int | None = None
    timeStr: str | None = None
    date: str | None = None

    def model_post_init(self, __context) -> None:
        self.quantity = _cap(self.quantity)


class SaleDeleteRequest(BaseModel):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None

    def model_post_init(self, __context) -> None:
        self.quantity = _cap(self.quantity)


class NotificationRequest(BaseModel):
    type: str = "info"
    title: str
    message: str


class NotificationReadRequest(BaseModel):
    id: int | None = None
