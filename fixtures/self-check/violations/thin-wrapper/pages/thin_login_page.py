class ThinLoginPage:
    def __init__(self, locators):
        self.locators = locators

    # callSites <= 1 — should flag delete
    def submit(self):
        self.locators.submit_button.click()
