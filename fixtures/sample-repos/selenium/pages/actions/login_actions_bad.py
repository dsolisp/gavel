"""VIOLATION FILE: expect-in-action + selector-leak.

This action class demonstrates two rules:
- expect-in-action: `assert` calls belong in spec files, not action classes.
- selector-leak: raw `querySelector(...)` chains belong in locator classes,
  not action classes.

The canonical pattern lives in login_actions.py; this file exists to
demonstrate the rules.
"""
from selenium.webdriver.remote.webdriver import WebDriver

from pages.locators.login_locators import LoginLocators


class LoginActionsBad:
    def __init__(self, driver: WebDriver):
        self.locators = LoginLocators(driver)

    def sign_in(self, email: str, password: str) -> None:
        # expect-in-action — assertion in an action class.
        assert (isinstance(email, str))
        assert (isinstance(password, str))

        # selector-leak — raw querySelector chain in an action/page class.
        self.locators.driver.execute_script(
            "const e = document.querySelector('[role=\"textbox\"][aria-label=\"Email\"]');"
            "e.value = arguments[0];",
            email,
        )
        self.locators.driver.execute_script(
            "const p = document.querySelector('[role=\"textbox\"][aria-label=\"Password\"]');"
            "p.value = arguments[0];",
            password,
        )
        self.locators.visible(self.locators.SIGN_IN).click()
