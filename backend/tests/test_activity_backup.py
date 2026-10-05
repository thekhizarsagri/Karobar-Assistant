import unittest

from backend.activity import MAX_ENTRIES, activity_log, clear_activity, get_activity, log_action
from backend.backup import export_backup, restore_backup
from backend.profile import build_profile_from_form
from backend.sales import record_sale
from backend.stock import add_stock
from backend.store import add_product, reset as reset_store, sales_log, stock_log


def _setup():
    reset_store()
    clear_activity()
    sales_log.clear()
    stock_log.clear()
    form_data = {
        "businessName": "Audit Shop",
        "businessType": "Retail",
        "ownerName": "Owner",
        "phoneNumber": "123",
        "location": "Lahore",
        "description": "Test",
        "products": [
            {"name": "Rice", "category": "Grocery", "sellingPrice": 100, "costPrice": 70, "stockAvailable": 50, "reorderPoint": 5},
        ],
        "expenses": [],
    }
    build_profile_from_form(form_data)
    clear_activity()  # drop the business.setup entry for isolated tests


class ActivityBackupTests(unittest.TestCase):
    def setUp(self):
        _setup()

    def test_sale_and_stock_append_human_readable_entries(self):
        record_sale({"productName": "Rice", "quantity": 3, "period": "day", "entryDate": "2026-09-22", "entryType": "manual"})
        add_stock("Rice", 10, mode="oneTime")
        actions = [e["action"] for e in activity_log]
        self.assertIn("sale.recorded", actions)
        self.assertIn("stock.added", actions)
        sale_entry = next(e for e in activity_log if e["action"] == "sale.recorded")
        self.assertIn("Rice", sale_entry["message"])
        self.assertIn("3", sale_entry["message"])

    def test_failed_sale_logs_nothing(self):
        result = record_sale({"productName": "Rice", "quantity": 9999, "period": "day", "entryDate": "2026-09-22"})
        self.assertIn("error", result)
        self.assertEqual(len(activity_log), 0)

    def test_add_product_logs(self):
        add_product({"name": "Sugar", "sellingPrice": 80, "costPrice": 60, "stockAvailable": 20})
        self.assertTrue(any(e["action"] == "product.added" and e["entity"] == "Sugar" for e in activity_log))

    def test_activity_filter_and_limit(self):
        log_action("sale.recorded", "Rice", "Sold Rice")
        log_action("stock.added", "Rice", "Added Rice")
        log_action("expense.added", "Rent", "Added Rent")
        filtered = get_activity(limit=10, action_filter="sale")
        self.assertTrue(all(e["action"].startswith("sale") for e in filtered["items"]))
        self.assertEqual(len(filtered["items"]), 1)
        limited = get_activity(limit=2)
        self.assertEqual(len(limited["items"]), 2)
        # newest first
        self.assertEqual(limited["items"][0]["action"], "expense.added")

    def test_log_is_capped(self):
        for i in range(MAX_ENTRIES + 20):
            log_action("sale.recorded", f"P{i}", f"Sale {i}")
        self.assertEqual(len(activity_log), MAX_ENTRIES)
        self.assertEqual(get_activity(limit=MAX_ENTRIES)["total"], MAX_ENTRIES)

    def test_backup_export_restore_roundtrip(self):
        record_sale({"productName": "Rice", "quantity": 2, "period": "day", "entryDate": "2026-09-22"})
        backup = export_backup()
        self.assertEqual(backup["version"], 1)
        self.assertIn("state", backup)
        self.assertTrue(any(e["action"] == "sale.recorded" for e in backup["state"]["activity"]))

        # wipe then restore
        reset_store()
        self.assertEqual(len(sales_log), 0)
        result = restore_backup(backup)
        self.assertTrue(result.get("restored"))
        self.assertEqual(len(sales_log), 1)
        self.assertTrue(any(e["action"] == "system.restored" for e in activity_log))

    def test_restore_rejects_bad_version_atomically(self):
        record_sale({"productName": "Rice", "quantity": 2, "period": "day", "entryDate": "2026-09-22"})
        before_sales = len(sales_log)
        result = restore_backup({"version": 999, "state": {}})
        self.assertIn("error", result)
        self.assertEqual(len(sales_log), before_sales)  # untouched

    def test_restore_rejects_missing_profile(self):
        result = restore_backup({"version": 1, "state": {"profile": None, "sales": [], "stock": []}})
        self.assertIn("error", result)


if __name__ == "__main__":
    unittest.main()
