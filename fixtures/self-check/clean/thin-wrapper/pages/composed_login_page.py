class ComposedLoginPage:
    def __init__(self, locators):
        self.locators = locators

    def sign_in(self, email, password):
        self.locators.email.fill(email)
        self.locators.password.fill(password)
        self.locators.submit_button.click()
