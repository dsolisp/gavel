import unittest


class CountMessageTests(unittest.TestCase):
    def test_count_with_prose_message(self):
        count = 3
        self.assertEqual(count, 3, "Should be three items.")
