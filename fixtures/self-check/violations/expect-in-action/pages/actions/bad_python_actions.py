"""VIOLATION: expect-in-action — assert with space (no parens) in action class.

Python's `assert isinstance(...)` (without surrounding parens) is the idiomatic
assertion form. The expanded pattern catches `assert <expr>` alongside the
existing `assert(` detection.
"""


class BadPythonActions:
    def __init__(self, locators):
        self.locators = locators

    def sign_in(self, email, password):
        assert isinstance(email, str)
        assert isinstance(password, str)
        self.locators.email.fill(email)
        self.locators.password.fill(password)
        self.locators.submit.click()
