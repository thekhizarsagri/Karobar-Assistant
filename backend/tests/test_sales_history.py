import unittest

from backend.aggregation import get_analytics_data
from backend.profile import build_profile_from_form
from backend.sales import record_sale
from backend.store import sales_log


class SalesHistoryTests(unittest.TestCase):
    def setUp(self):
        sales_log.clear()
        form_data = {
            "businessName": "Test Business",
            "businessType": "Retail",
            "ownerName": "Test Owner",
            "phoneNumber": "1234567890",
            "location": "Test Location",
            "description": "Test Description",
            "products": [
                {"name": "Coke", "category": "Beverages", "sellingPrice": 10, "costPrice": 5, "stockAvailable": 100, "reorderPoint": 10},
                {"name": "Water", "category": "Beverages", "sellingPrice": 5, "costPrice": 2, "stockAvailable": 100, "reorderPoint": 10},
            ],
            "expenses": [],
        }
        build_profile_from_form(form_data)

    def test_sales_history_groups_entries_by_product(self):
        record_sale({"productName": "Coke", "quantity": 3, "period": "day", "entryDate": "2026-08-01", "entryType": "auto"})
        record_sale({"productName": "Coke", "quantity": 2, "period": "month", "entryDate": "2026-08", "entryType": "manual"})
        record_sale({"productName": "Water", "quantity": 5, "period": "year", "entryDate": "2026", "entryType": "manual"})

        summary = record_sale({"productName": "Coke", "quantity": 1, "period": "year", "entryDate": "2026", "entryType": "manual"})

        self.assertEqual(summary["sales_summary"]["total_entries"], 4)
        self.assertIn("product_history", summary["sales_summary"])
        coke_history = summary["sales_summary"]["product_history"]["Coke"]
        self.assertEqual(coke_history["total_quantity"], 6)
        self.assertEqual(len(coke_history["entries"]), 3)

    def test_analytics_does_not_drop_monthly_quick_sales(self):
        record_sale({"productName": "Coke", "quantity": 30, "period": "month", "entryDate": "2026-08-10", "entryType": "auto"})
        record_sale({"productName": "Water", "quantity": 70, "period": "month", "entryDate": "2026-08", "entryType": "manual"})

        analytics = get_analytics_data()
        self.assertEqual(analytics["monthly"]["2026-08"], {"Coke": 30, "Water": 70})
        self.assertEqual(analytics["yearly"]["2026"], {"Coke": 30, "Water": 70})
        self.assertNotIn("Coke", analytics["daily"].get("2026-08-10", {}))

    def test_analytics_handles_week_period(self):
        record_sale({"productName": "Coke", "quantity": 4, "period": "week", "entryDate": "2026-08-10", "entryType": "manual"})

        analytics = get_analytics_data()
        self.assertEqual(analytics["daily"]["2026-08-10"], {"Coke": 4})
        self.assertEqual(analytics["monthly"]["2026-08"], {"Coke": 4})
        self.assertEqual(analytics["yearly"]["2026"], {"Coke": 4})


if __name__ == "__main__":
    unittest.main()