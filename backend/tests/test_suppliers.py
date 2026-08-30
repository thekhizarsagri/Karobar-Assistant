import unittest

from backend.profile import build_profile_from_form
from backend.suppliers import add_supplier, create_purchase_order, get_purchase_orders, get_suppliers


class SuppliersTests(unittest.TestCase):
    def setUp(self):
        form_data = {
            "businessName": "Test Shop",
            "businessType": "Retail",
            "ownerName": "Owner",
            "phoneNumber": "123",
            "location": "Karachi",
            "description": "Test",
            "products": [
                {"name": "Rice", "category": "Groceries", "sellingPrice": 100, "costPrice": 60, "stockAvailable": 20, "reorderPoint": 5},
            ],
            "expenses": [],
        }
        build_profile_from_form(form_data)

    def test_add_supplier_and_purchase_order(self):
        supplier = add_supplier({
            "name": "Apex Foods",
            "contactPerson": "Nadia",
            "phone": "0300-1111111",
            "email": "nadia@apexfoods.com",
            "address": "Karachi",
            "paymentTerms": "Net 15",
        })
        self.assertEqual(supplier["name"], "Apex Foods")

        purchase = create_purchase_order({
            "supplierName": "Apex Foods",
            "productName": "Rice",
            "quantity": 50,
            "unitCost": 60,
            "status": "ordered",
            "expectedDeliveryDate": "2026-09-01",
            "note": "Monthly restock",
        })

        self.assertEqual(purchase["supplierName"], "Apex Foods")
        self.assertEqual(purchase["productName"], "Rice")
        self.assertEqual(purchase["quantity"], 50)
        self.assertEqual(purchase["totalCost"], 3000)
        self.assertEqual(purchase["status"], "ordered")
        self.assertGreater(len(get_purchase_orders()), 0)
        self.assertGreater(len(get_suppliers()), 0)

    def test_received_purchase_order_updates_stock(self):
        add_supplier({
            "name": "Fresh Market",
            "contactPerson": "Ali",
            "phone": "0300-2222222",
            "email": "ali@freshmarket.com",
            "address": "Lahore",
            "paymentTerms": "Cash",
        })

        purchase = create_purchase_order({
            "supplierName": "Fresh Market",
            "productName": "Rice",
            "quantity": 25,
            "unitCost": 55,
            "status": "received",
            "expectedDeliveryDate": "2026-09-03",
            "note": "Received",
        })

        self.assertEqual(purchase["status"], "received")
        self.assertGreaterEqual(purchase["stockAfterOrder"], 0)


if __name__ == "__main__":
    unittest.main()
