"""Pydantic request schemas for the API."""
import re

from pydantic import BaseModel, field_validator

from backend.utils import cap

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def _password_score(value: str) -> int:
    score = 0
    if len(value) >= 8:
        score += 1
    if len(value) >= 12:
        score += 1
    if re.search(r"[a-z]", value) and re.search(r"[A-Z]", value):
        score += 1
    if re.search(r"\d", value):
        score += 1
    if re.search(r"[^A-Za-z0-9]", value):
        score += 1
    return score


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
        trimmed = str(v or "").strip()
        if not trimmed or not EMAIL_RE.match(trimmed):
            raise ValueError("Enter a valid email ending with a domain, e.g. you@company.com")
        return trimmed

    @field_validator("password")
    @classmethod
    def password_must_be_medium(cls, v: str) -> str:
        value = str(v or "")
        if len(value) < 8 or _password_score(value) < 3:
            raise ValueError("Password must reach at least Medium strength (8+ chars with mixed case, number or symbol).")
        return value

    @field_validator("username")
    @classmethod
    def username_must_not_contain_spaces(cls, v: str) -> str:
        value = str(v or "")
        if value and re.search(r"\s", value):
            raise ValueError("Username cannot contain spaces.")
        return value


class SaleEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None
    entryType: str = "auto"

    def model_post_init(self, __context) -> None:
        self.quantity = cap(self.quantity)


class StockEntryRequest(BaseModel):
    productName: str
    quantity: int = 1
    mode: str = "oneTime"
    dayOfMonth: int | None = None
    timeStr: str | None = None
    date: str | None = None

    def model_post_init(self, __context) -> None:
        self.quantity = cap(self.quantity)


class SaleDeleteRequest(BaseModel):
    productName: str
    quantity: int = 1
    period: str = "day"
    entryDate: str | None = None

    def model_post_init(self, __context) -> None:
        self.quantity = cap(self.quantity)


class NotificationRequest(BaseModel):
    type: str = "info"
    title: str
    message: str


class NotificationReadRequest(BaseModel):
    id: int | None = None


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
        trimmed = str(v or "").strip()
        if trimmed and not EMAIL_RE.match(trimmed):
            raise ValueError("Enter a valid email ending with a domain, e.g. you@company.com")
        return trimmed

    @field_validator("password")
    @classmethod
    def password_must_be_medium(cls, v: str) -> str:
        value = str(v or "")
        if value and (len(value) < 8 or _password_score(value) < 3):
            raise ValueError("Password must reach at least Medium strength (8+ chars with mixed case, number or symbol).")
        return value

    @field_validator("username")
    @classmethod
    def username_must_not_contain_spaces(cls, v: str) -> str:
        value = str(v or "")
        if value and re.search(r"\s", value):
            raise ValueError("Username cannot contain spaces.")
        return value
