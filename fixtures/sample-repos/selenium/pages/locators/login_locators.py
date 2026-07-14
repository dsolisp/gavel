"""Locator class: every By tuple lives here. No assertions, no navigation."""
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class LoginLocators:
    EMAIL = (By.CSS_SELECTOR, '[role="textbox"][aria-label="Email"]')
    PASSWORD = (By.CSS_SELECTOR, '[role="textbox"][aria-label="Password"]')
    SIGN_IN = (By.CSS_SELECTOR, 'button[role="button"]')
    DASHBOARD = (By.CSS_SELECTOR, 'h1')
    ERROR = (By.XPATH, "//*[contains(text(),'Invalid credentials')]")

    def __init__(self, driver: WebDriver, wait_seconds: int = 10):
        self.driver = driver
        self.wait = WebDriverWait(driver, wait_seconds)

    def visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))
