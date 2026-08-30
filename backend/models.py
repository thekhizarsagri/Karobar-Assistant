from dataclasses import dataclass, field
from typing import List


@dataclass
class Product:
    name: str
    category: str
    selling_price: float
    cost_price: float
    stock_quantity: int = 0
    reorder_point: int = 0
    sku: str = ""
    unit: str = "pcs"
    description: str = ""


@dataclass
class Expense:
    key: str
    label: str
    amount: float
    enabled: bool = True


@dataclass
class SaleEntry:
    product_name: str
    quantity: int
    period: str
    entry_date: str
    entry_type: str = "auto"
    created_at: str = ""


@dataclass
class StockEntry:
    product_name: str
    quantity: int
    source: str = "manual"
    note: str = ""
    created_at: str = ""


@dataclass
class Supplier:
    name: str
    contact_person: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    payment_terms: str = ""
    created_at: str = ""


@dataclass
class PurchaseOrder:
    id: int
    supplier_name: str
    product_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    status: str = "ordered"
    expected_delivery_date: str = ""
    note: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class BusinessProfile:
    business_name: str
    business_type: str
    owner_name: str
    phone_number: str
    location: str
    description: str
    email: str = ""
    username: str = ""
    password: str = ""
    currency: str = "₹"
    tax_id: str = ""
    products: List[Product] = field(default_factory=list)
    expenses: List[Expense] = field(default_factory=list)
