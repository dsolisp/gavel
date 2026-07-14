"""Clean: Python action class without assertions.

Action classes perform interactions and return state; assertions live in specs.
"""


class GoodPythonActions:
    def __init__(self, locators):
        self.locators = locators

    def sign_in(self, email, password):
        self.locators.email.fill(email)
        self.locators.password.fill(password)
        self.locators.submit.click()
