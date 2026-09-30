class AliasedLoginPage:
    def __init__(self, locators):
        self.locators = locators

    # 1:1 private alias — should fire private-locator-alias
    def _submit(self):
        return self.locators.submit

    def sign_in(self, email):
        self.locators.email.fill(email)
        self._submit().click()
