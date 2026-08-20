import unittest

from backend.alerts import (
    add_transient_alert,
    clear_all,
    dismissed_alerts,
    get_active_alerts,
    transient_alerts,
)
from backend.insights import empty_insights, generate_ai_insights
from backend.models import BusinessProfile, Product, Expense


class AIFeaturesTests(unittest.TestCase):
    def test_generate_ai_insights_returns_forecast_and_alerts(self):
        profile = BusinessProfile(
            business_name="Test Shop",
            business_type="Retail",
            owner_name="Owner",
            phone_number="123",
            location="Karachi",
            description="Test",
            products=[
                Product(name="Coke", category="Drinks", selling_price=60, cost_price=40, stock_quantity=3, reorder_point=5),
            ],
            expenses=[Expense(key="rent", label="Rent", amount=100, enabled=True)],
        )

        sales_entries = [
            {"productName": "Coke", "quantity": 4, "period": "day", "entryDate": "2026-08-01"},
            {"productName": "Coke", "quantity": 6, "period": "day", "entryDate": "2026-08-02"},
            {"productName": "Coke", "quantity": 5, "period": "day", "entryDate": "2026-08-03"},
            {"productName": "Coke", "quantity": 7, "period": "day", "entryDate": "2026-08-04"},
        ]

        insights = generate_ai_insights(profile, sales_entries)

        self.assertIn("forecast", insights)
        self.assertIn("alerts", insights)
        self.assertIn("recommendations", insights)
        self.assertGreaterEqual(len(insights["alerts"]), 1)
        self.assertGreaterEqual(insights["forecast"]["next_period_units"], 0)

    def test_dismissed_low_stock_alert_fires_again_after_restock(self):
        def make_insights(stock: int):
            profile = BusinessProfile(
                business_name="Test Shop",
                business_type="Retail",
                owner_name="Owner",
                phone_number="123",
                location="Karachi",
                description="Test",
                products=[
                    Product(name="Coke", category="Drinks", selling_price=60, cost_price=40, stock_quantity=stock, reorder_point=5),
                ],
                expenses=[Expense(key="rent", label="Rent", amount=100, enabled=True)],
            )
            return generate_ai_insights(profile)

        try:
            dismissed_alerts.clear()
            insights_low = make_insights(0)
            active_low = get_active_alerts(insights_low)
            self.assertTrue(any(a["type"] == "stock" for a in active_low))

            clear_all(insights_low)
            self.assertEqual(len(get_active_alerts(insights_low)), 0)

            insights_restocked = make_insights(100)
            get_active_alerts(insights_restocked)
            self.assertNotIn("stock:Low stock for Coke", dismissed_alerts)

            insights_low_again = make_insights(0)
            active_again = get_active_alerts(insights_low_again)
            self.assertTrue(any(a["type"] == "stock" for a in active_again))
        finally:
            dismissed_alerts.clear()

    def test_transient_alert_shows_in_feed_and_clears(self):
        try:
            dismissed_alerts.clear()
            transient_alerts.clear()
            add_transient_alert("stock", "Not enough stock: Coke", "Only 3 units are available.")

            active = get_active_alerts(empty_insights())
            self.assertTrue(any(a["title"] == "Not enough stock: Coke" for a in active))

            clear_all(empty_insights())
            self.assertEqual(len(get_active_alerts(empty_insights())), 0)
            self.assertEqual(transient_alerts, [])
        finally:
            dismissed_alerts.clear()
            transient_alerts.clear()

    def test_transient_alert_does_not_duplicate(self):
        try:
            dismissed_alerts.clear()
            transient_alerts.clear()
            add_transient_alert("stock", "Not enough stock: Coke", "Only 3 units are available.")
            add_transient_alert("stock", "Not enough stock: Coke", "Only 3 units are available.")
            self.assertEqual(len(transient_alerts), 1)
        finally:
            dismissed_alerts.clear()
            transient_alerts.clear()


if __name__ == "__main__":
    unittest.main()
