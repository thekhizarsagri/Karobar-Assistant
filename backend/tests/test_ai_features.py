import unittest

from backend.analytics import generate_ai_insights
from backend.models import BusinessProfile, Product, Expense


class AIFeaturesTests(unittest.TestCase):
    def test_generate_ai_insights_returns_forecast_and_alerts(self):
        profile = BusinessProfile(
            business_name="Test Shop",
            business_type="Retail",
            owner_name="Owner",
            phone_number="123",
            location="Karachi",
            monthly_target=1000,
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


if __name__ == "__main__":
    unittest.main()
