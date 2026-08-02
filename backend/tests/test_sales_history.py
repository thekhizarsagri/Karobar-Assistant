import unittest

from backend.service import record_sale, sales_log
from backend.models import BusinessProfile


class SalesHistoryTests(unittest.TestCase):
    def setUp(self):
        sales_log.clear()

    def test_sales_history_groups_entries_by_product(self):
        record_sale({"productName": "Coke", "quantity": 3, "period": "day", "entryDate": "2026-08-01"})
        record_sale({"productName": "Coke", "quantity": 2, "period": "month", "entryDate": "2026-08"})
        record_sale({"productName": "Water", "quantity": 5, "period": "year", "entryDate": "2026"})

        summary = record_sale({"productName": "Coke", "quantity": 1, "period": "year", "entryDate": "2026"})

        self.assertEqual(summary["sales_summary"]["total_entries"], 4)
        self.assertIn("product_history", summary["sales_summary"])
        coke_history = summary["sales_summary"]["product_history"]["Coke"]
        self.assertEqual(coke_history["total_quantity"], 6)
        self.assertEqual(len(coke_history["entries"]), 3)


if __name__ == "__main__":
    unittest.main()
