import unittest

from backend.profile import build_profile_from_form
from backend.reports import get_reports
from backend.sales import record_sale
from backend.store import sales_log


class ReportsTests(unittest.TestCase):
    def setUp(self):
        sales_log.clear()
        form_data = {
            "businessName": "Test Shop",
            "businessType": "Retail",
            "ownerName": "Owner",
            "phoneNumber": "123",
            "location": "Karachi",
            "description": "Test",
            "products": [
                {"name": "Cola", "category": "Drinks", "sellingPrice": 20, "costPrice": 10, "stockAvailable": 1000, "reorderPoint": 10},
                {"name": "Chips", "category": "Snacks", "sellingPrice": 10, "costPrice": 5, "stockAvailable": 1000, "reorderPoint": 5},
            ],
            "expenses": [
                {"key": "rent", "label": "Rent", "amount": 200, "enabled": True},
                {"key": "power", "label": "Power", "amount": 100, "enabled": True},
            ],
        }
        build_profile_from_form(form_data)

    def _seed_sales(self):
        for day in range(1, 21):
            record_sale({"productName": "Cola", "quantity": 5, "period": "day", "entryDate": f"2026-07-{day:02d}", "entryType": "auto"})
            record_sale({"productName": "Chips", "quantity": 3, "period": "day", "entryDate": f"2026-07-{day:02d}", "entryType": "auto"})

    def test_payload_shape(self):
        self._seed_sales()
        payload = get_reports()
        self.assertIn("kpi", payload)
        self.assertIn("gmroi", payload)
        self.assertIn("turnover", payload)
        self.assertIn("break_even", payload)
        self.assertIn("eoq", payload)
        self.assertIn("seasonality", payload)
        self.assertIn("expenses", payload)
        self.assertEqual(len(payload["eoq"]), 2)
        self.assertEqual(len(payload["seasonality"]["index"]), 12)
        self.assertTrue(payload["seasonality"]["has_data"])

    def test_financials_from_actual_sales(self):
        self._seed_sales()
        financials = get_reports()["financials"]
        # 20 days: Cola 5*20 units *20 + Chips 3*20 units *10
        self.assertEqual(financials["revenue"], (100 * 20) + (60 * 10))
        self.assertEqual(financials["cogs"], (100 * 10) + (60 * 5))
        self.assertEqual(financials["gross_profit"], 1300)
        self.assertEqual(financials["total_expenses"], 300)
        self.assertEqual(financials["net_profit"], 1000)

    def test_gmroi_and_turnover_are_positive(self):
        self._seed_sales()
        payload = get_reports()
        self.assertGreater(payload["gmroi"]["value"], 0)
        self.assertGreater(payload["turnover"]["ratio"], 0)
        self.assertIsNotNone(payload["turnover"]["dio"])

    def test_break_even_present_and_per_product(self):
        self._seed_sales()
        break_even = get_reports()["break_even"]
        self.assertEqual(len(break_even["products"]), 2)
        self.assertGreater(break_even["cm_ratio"], 0)
        self.assertIsNotNone(break_even["revenue"])
        cola = next(p for p in break_even["products"] if p["product"] == "Cola")
        self.assertEqual(cola["contribution"], 10)
        self.assertIsNotNone(cola["units"])

    def test_eoq_greater_than_zero_for_selling_product(self):
        self._seed_sales()
        payload = get_reports()
        cola = next(e for e in payload["eoq"] if e["product"] == "Cola")
        self.assertGreater(cola["annual_demand"], 0)
        self.assertGreater(cola["order_qty"], 0)

    def test_expense_pareto_sorted(self):
        self._seed_sales()
        pareto = get_reports()["expenses"]["pareto"]
        self.assertEqual(len(pareto), 2)
        self.assertEqual(pareto[0]["label"], "Rent")
        self.assertAlmostEqual(pareto[-1]["cumulative_pct"], 100.0, places=1)

    def test_empty_payload_when_no_profile(self):
        import backend.store as store_module

        store_module._current_profile = None
        payload = get_reports()
        self.assertEqual(payload["kpi"]["score"], 0)
        self.assertEqual(payload["eoq"], [])
        self.assertEqual(payload["seasonality"]["index"], [])


if __name__ == "__main__":
    unittest.main()