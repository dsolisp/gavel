"""Action class: receives the locator class, owns user workflows.

Spec files own assertions; this module never calls `assert`.
"""
from selenium.webdriver.remote.webdriver import WebDriver

from pages.locators.login_locators import LoginLocators


class LoginActions:
    def __init__(self, driver: WebDriver):
        self.locators = LoginLocators(driver)

    def navigate_to(self, path: str) -> None:
        self.locators.driver.get(f"http://localhost:3000{path}")

    def sign_in(self, email: str, password: str) -> None:
        email_el = self.locators.visible(self.locators.EMAIL)
        password_el = self.locators.visible(self.locators.PASSWORD)
        email_el.clear()
        email_el.send_keys(email)
        password_el.clear()
        password_el.send_keys(password)
        self.locators.visible(self.locators.SIGN_IN).click()
