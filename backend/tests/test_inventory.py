import unittest

from backend.inventory import get_inventory_data
from backend.profile import build_profile_from_form
from backend.sales import record_sale
from backend.stock import add_stock
from backend.store import sales_log, stock_log


class InventoryTests(unittest.TestCase):
    def setUp(self):
        sales_log.clear()
        stock_log.clear()
        form_data = {
            "businessName": "Test Shop",
            "businessType": "Retail",
            "ownerName": "Owner",
            "phoneNumber": "123",
            "location": "Karachi",
            "description": "Test",
            "products": [
                {"name": "Coke", "category": "Beverages", "sellingPrice": 20, "costPrice": 10, "stockAvailable": 50, "reorderPoint": 10},
                {"name": "Water", "category": "Beverages", "sellingPrice": 5, "costPrice": 2, "stockAvailable": 0, "reorderPoint": 10},
            ],
            "expenses": [],
        }
        build_profile_from_form(form_data)

    def test_payload_shape_and_summary(self):
        payload = get_inventory_data()
        self.assertEqual(payload["summary"]["total_products"], 2)
        self.assertEqual(payload["summary"]["out_of_stock"], 1)
        self.assertEqual(payload["summary"]["total_units"], 50)
        self.assertEqual(payload["summary"]["total_cost_value"], 500.0)
        self.assertEqual(payload["summary"]["total_retail_value"], 1000.0)
        self.assertEqual(payload["summary"]["potential_profit"], 500.0)
        self.assertEqual(len(payload["categories"]), 1)
        self.assertEqual(len(payload["items"]), 2)

    def test_out_of_stock_status_and_margin(self):
        payload = get_inventory_data()
        by_name = {item["name"]: item for item in payload["items"]}
        self.assertEqual(by_name["Water"]["status"], "out")
        self.assertEqual(by_name["Coke"]["status"], "ok")
        self.assertEqual(by_name["Coke"]["margin_pct"], 50.0)
        self.assertEqual(by_name["Coke"]["unit_margin"], 10.0)

    def test_reorder_status_and_suggested_quantity(self):
        record_sale({"productName": "Coke", "quantity": 5, "period": "day", "entryDate": "2026-08-10", "entryType": "auto"})
        payload = get_inventory_data()
        coke = next(item for item in payload["items"] if item["name"] == "Coke")
        self.assertGreater(coke["avg_daily"], 0)
        self.assertIsNotNone(coke["days_of_supply"])
        self.assertGreaterEqual(coke["suggested_reorder"], 0)

    def test_movements_record_add_stock(self):
        add_stock("Coke", 25, mode="oneTime")
        payload = get_inventory_data()
        self.assertEqual(payload["movements"][0]["product"], "Coke")
        self.assertEqual(payload["movements"][0]["quantity"], 25)
        self.assertEqual(payload["movements"][0]["source"], "oneTime")

    def test_empty_payload_when_no_profile(self):
        import backend.store as store_module

        store_module._current_profile = None
        payload = get_inventory_data()
        self.assertEqual(payload["items"], [])
        self.assertEqual(payload["summary"]["total_units"], 0)
        self.assertEqual(payload["categories"], [])
        self.assertEqual(payload["movements"], [])


if __name__ == "__main__":
    unittest.main()