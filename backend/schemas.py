"""Pydantic request schemas for the API."""
import re

from pydantic import BaseModel, field_validator

from backend.utils import cap

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def _password_score(value: str) -> int:
    return sum([
        len(value) >= 8,
        len(value) >= 12,
        bool(re.search(r"[a-z]", value) and re.search(r"[A-Z]", value)),
        bool(re.search(r"\d", value)),
        bool(re.search(r"[^A-Za-z0-9]", value)),
    ])


def _check_email(v: str, required: bool) -> str:
    trimmed = str(v or "").strip()
    if (required or trimmed) and not EMAIL_RE.match(trimmed):
        raise ValueError("Enter a valid email ending with a domain, e.g. you@company.com")
    return trimmed


def _check_password(v: str, required: bool) -> str:
    value = str(v or "")
    if (required or value) and (len(value) < 8 or _password_score(value) < 3):
        raise ValueError("Password must reach at least Medium strength (8+ chars with mixed case, number or symbol).")
    return value


def _check_username(v: str) -> str:
    value = str(v or "")
    if value and re.search(r"\s", value):
        raise ValueError("Username cannot contain spaces.")
    return value


class CappedQuantityMixin(BaseModel):
    def model_post_init(self, __context) -> None:
        self.quantity = cap(self.quantity)


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

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        return _check_email(v, required=True)

    @field_validator("password")
    @classmethod
    def password_must_be_medium(cls, v: str) -> str:
        return _check_password(v, required=True)

    @field_validator("username")
    @classmethod
    def username_must_not_contain_spaces(cls, v: str) -> str:
        return _check_username(v)


class SaleEntryRequest(CappedQuantityMixin):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None
    entryType: str = "auto"


class StockEntryRequest(CappedQuantityMixin):
    productName: str
    quantity: int = 1
    mode: str = "oneTime"
    dayOfMonth: int | None = None
    timeStr: str | None = None
    date: str | None = None


class SaleDeleteRequest(CappedQuantityMixin):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None


class ProductAddRequest(BaseModel):
    name: str = ""
    category: str = "Other"
    sku: str = ""
    sellingPrice: float | str = 0
    costPrice: float | str = 0
    stockAvailable: float | str = 0
    reorderPoint: float | str = 10
    unit: str = "pcs"
    description: str = ""


class NotificationRequest(BaseModel):
    type: str = "info"
    title: str
    message: str


class NotificationReadRequest(BaseModel):
    id: int | None = None


class ChatRequest(BaseModel):
    session_id: str = "default"
    message: str = ""


class UpdateProfileRequest(BaseModel):
    ownerName: str = ""
    username: str = ""
    email: str = ""
    password: str = ""
    businessName: str = ""
    businessType: str = ""
    phoneNumber: str = ""
    location: str = ""
    description: str = ""
    currency: str = "₹"
    taxId: str = ""

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        return _check_email(v, required=False)

    @field_validator("password")
    @classmethod
    def password_must_be_medium(cls, v: str) -> str:
        return _check_password(v, required=False)

    @field_validator("username")
    @classmethod
    def username_must_not_contain_spaces(cls, v: str) -> str:
        return _check_username(v)
