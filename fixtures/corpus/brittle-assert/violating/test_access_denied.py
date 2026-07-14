import unittest


class AccessDeniedTests(unittest.TestCase):
    def test_access_denied_prose(self):
        text = "Access denied."
        self.assertEqual(text, "Access denied.")
