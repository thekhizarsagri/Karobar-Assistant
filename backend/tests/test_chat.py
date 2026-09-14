import unittest

from backend.chat import handle_chat_message, reset_chat
from backend.profile import build_profile_from_form
from backend.stock import get_stock_for_product
from backend.store import get_profile, sales_log, stock_log


def _seed():
    sales_log.clear()
    stock_log.clear()
    reset_chat()
    build_profile_from_form({
        "businessName": "Test Business",
        "businessType": "Retail",
        "ownerName": "Test Owner",
        "phoneNumber": "1234567890",
        "location": "Test Location",
        "description": "Test Description",
        "products": [
            {"name": "Coke", "category": "Beverages", "sellingPrice": 10, "costPrice": 5, "stockAvailable": 100, "reorderPoint": 10},
            {"name": "Water", "category": "Beverages", "sellingPrice": 5, "costPrice": 2, "stockAvailable": 3, "reorderPoint": 10},
        ],
        "expenses": [
            {"key": "rent", "label": "Rent", "amount": 50, "deductionDay": 1, "deductionTime": "09:00"},
        ],
    })


class ChatTests(unittest.TestCase):
    def setUp(self):
        _seed()
        self.sid = "test-session"

    def say(self, text, sid=None):
        return handle_chat_message(sid or self.sid, text)

    def test_greeting_uses_owner_name(self):
        res = self.say("hello")
        self.assertIn("Test", res["reply"])
        self.assertTrue(res["suggestions"])

    def test_stock_query_reports_levels(self):
        res = self.say("what is my stock status?")
        self.assertIn("103", res["reply"])
        self.assertIn("Water", res["reply"])

    def test_add_stock_full_flow(self):
        res = self.say("add stock")
        self.assertIn("Which product", res["reply"])
        res = self.say("Coke")
        self.assertIn("How many", res["reply"])
        res = self.say("25")
        self.assertIn("Confirm", res["suggestions"])
        res = self.say("yes")
        self.assertIn("Done", res["reply"])
        self.assertTrue(res.get("refresh"))
        self.assertEqual(get_stock_for_product("Coke"), 125)

    def test_add_stock_single_shot_to_confirm(self):
        res = self.say("add 10 units of water stock")
        self.assertIn("Confirm", res["suggestions"])
        res = self.say("confirm")
        self.assertIn("Done", res["reply"])
        self.assertEqual(get_stock_for_product("Water"), 13)

    def test_add_stock_unknown_product_then_pick(self):
        res = self.say("add stock")
        res = self.say("Pepsi")
        self.assertIn("couldn't find", res["reply"])
        res = self.say("Coke")
        self.assertIn("How many", res["reply"])
        res = self.say("5")
        res = self.say("no")
        self.assertIn("Cancelled", res["reply"])
        self.assertEqual(get_stock_for_product("Coke"), 100)

    def test_record_sale_flow_with_guard(self):
        res = self.say("record a sale")
        res = self.say("Water")
        res = self.say("10")
        self.assertIn("Only 3 units", res["reply"])
        res = self.say("2")
        res = self.say("yes")
        self.assertIn("Logged", res["reply"])
        self.assertEqual(get_stock_for_product("Water"), 1)

    def test_add_expense_flow(self):
        res = self.say("add expense")
        res = self.say("1200")
        res = self.say("Internet")
        res = self.say("yes")
        self.assertIn("Done", res["reply"])
        labels = [e.label for e in get_profile().expenses]
        self.assertIn("Internet", labels)

    def test_schedule_flow(self):
        res = self.say("schedule deductions")
        res = self.say("Rent")
        res = self.say("5th")
        res = self.say("6pm")
        self.assertIn("Confirm", res["suggestions"])
        res = self.say("confirm")
        self.assertIn("day 5 at 18:00", res["reply"])
        rent = next(e for e in get_profile().expenses if e.label == "Rent")
        self.assertEqual(rent.deduction_day, 5)

    def test_add_product_flow_and_duplicate(self):
        res = self.say("add product")
        res = self.say("Juice")
        res = self.say("20")
        res = self.say("12")
        res = self.say("30")
        res = self.say("yes")
        self.assertIn("Done", res["reply"])
        self.assertIn("Juice", [p.name for p in get_profile().products])
        res = self.say("add product")
        res = self.say("Coke")
        self.assertIn("already in your catalog", res["reply"])

    def test_cancel_aborts_flow(self):
        self.say("add stock")
        res = self.say("cancel")
        self.assertIn("Cancelled", res["reply"])

    def test_navigate(self):
        res = self.say("open monthly expenses")
        self.assertEqual(res.get("navigate"), "expenses")

    def test_calculator(self):
        res = self.say("what is 15% of 20000")
        self.assertIn("3,000", res["reply"])

    def test_fallback_has_suggestions(self):
        res = self.say("blablah xyzzy")
        self.assertTrue(res["suggestions"])
        self.assertIn("stock", res["reply"].lower())

    def test_no_profile(self):
        from backend.store import reset as reset_store
        reset_store()
        res = self.say("hello", sid="no-profile-session")
        self.assertIn("No business", res["reply"])


if __name__ == "__main__":
    unittest.main()
