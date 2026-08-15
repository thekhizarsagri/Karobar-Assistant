import unittest

from backend.data_analytics import (
    abc_analysis,
    export_dataset,
    forecast_products,
    get_advanced_analytics,
    product_velocity,
)
from backend.profile import build_profile_from_form
from backend.sales import record_sale
from backend.store import sales_log


class DataAnalyticsTests(unittest.TestCase):
    def setUp(self):
        sales_log.clear()
        self.form_data = {
            "businessName": "Test Shop",
            "businessType": "Retail",
            "ownerName": "Owner",
            "phoneNumber": "123",
            "location": "Karachi",
            "description": "Test",
            "products": [
                {"name": "Premium", "category": "Goods", "sellingPrice": 100, "costPrice": 50, "stockAvailable": 100000, "reorderPoint": 10},
                {"name": "Mid", "category": "Goods", "sellingPrice": 20, "costPrice": 10, "stockAvailable": 100000, "reorderPoint": 10},
                {"name": "Budget", "category": "Goods", "sellingPrice": 5, "costPrice": 2, "stockAvailable": 100000, "reorderPoint": 10},
            ],
            "expenses": [],
        }
        build_profile_from_form(self.form_data)

    def _seed_series(self):
        for day in range(1, 11):
            record_sale({"productName": "Premium", "quantity": 10, "period": "day", "entryDate": f"2026-07-{day:02d}", "entryType": "auto"})
            record_sale({"productName": "Mid", "quantity": 3, "period": "day", "entryDate": f"2026-07-{day:02d}", "entryType": "auto"})
            record_sale({"productName": "Budget", "quantity": 1, "period": "day", "entryDate": f"2026-07-{day:02d}", "entryType": "auto"})
        record_sale({"productName": "Premium", "quantity": 500, "period": "day", "entryDate": "2026-07-12", "entryType": "auto"})

    def test_abc_ranks_products_and_uses_expected_classes(self):
        self._seed_series()
        from backend.store import get_profile

        analysis = abc_analysis(_frame(), get_profile())
        self.assertEqual(len(analysis), 3)
        self.assertEqual(analysis[0]["product"], "Premium")
        self.assertEqual(analysis[0]["class"], "A")
        self.assertEqual(analysis[2]["class"], "C")
        self.assertAlmostEqual(analysis[-1]["cumulative_pct"], 100.0, places=1)

    def test_advanced_analytics_payload_shape(self):
        self._seed_series()
        payload = get_advanced_analytics()
        self.assertIn("abc", payload)
        self.assertIn("velocity", payload)
        self.assertIn("forecasts", payload)
        self.assertEqual(len(payload["forecasts"]), 3)
        self.assertGreater(payload["summary"]["total_units"], 0)

    def test_abc_all_products_get_a_when_values_are_equal(self):
        self.form_data["products"] = [
            {"name": "P1", "category": "Goods", "sellingPrice": 100, "costPrice": 50, "stockAvailable": 100, "reorderPoint": 10},
            {"name": "P2", "category": "Goods", "sellingPrice": 100, "costPrice": 50, "stockAvailable": 100, "reorderPoint": 10},
            {"name": "P3", "category": "Goods", "sellingPrice": 100, "costPrice": 50, "stockAvailable": 100, "reorderPoint": 10},
        ]
        build_profile_from_form(self.form_data)
        from backend.store import get_profile

        for product in ("P1", "P2", "P3"):
            record_sale({"productName": product, "quantity": 5, "period": "day", "entryDate": "2026-07-01", "entryType": "auto"})

        analysis = abc_analysis(_frame(), get_profile())
        self.assertEqual(len(analysis), 3)
        for row in analysis:
            self.assertEqual(row["class"], "A")

    def test_top_mover_is_highest_volume_product(self):
        self._seed_series()
        payload = get_advanced_analytics()
        movers = payload["velocity"]["top_movers"]
        self.assertTrue(movers)
        self.assertEqual(movers[0]["product"], "Premium")

    def test_forecast_bounds_are_sane(self):
        self._seed_series()
        payload = get_advanced_analytics()
        for forecast in payload["forecasts"]:
            self.assertGreaterEqual(forecast["next_period_units"], 0)
            self.assertLessEqual(forecast["lower"], forecast["next_period_units"])
            self.assertGreaterEqual(forecast["upper"], forecast["next_period_units"])
            self.assertIn(forecast["trend"], ("upward", "downward", "steady"))
            self.assertIn(forecast["confidence"], ("high", "medium", "low"))

    def test_csv_export_is_well_formed(self):
        self._seed_series()
        csv_text = export_dataset("abc")
        self.assertTrue(csv_text.startswith("product,class"))
        self.assertIn("Premium", csv_text)
        csv_text = export_dataset("velocity")
        self.assertTrue(csv_text.startswith("product,units"))

    def test_empty_payload_when_no_profile(self):
        import backend.store as store_module

        store_module._current_profile = None
        payload = get_advanced_analytics()
        self.assertEqual(payload["abc"], [])
        self.assertEqual(payload["forecasts"], [])


def _frame():
    from backend.data_analytics import _sales_frame
    from backend.store import get_profile

    return _sales_frame(get_profile())


if __name__ == "__main__":
    unittest.main()
