# conftest.py — pytest fixture DI for the sample.
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from pages.actions.login_actions import LoginActions
from pages.locators.login_locators import LoginLocators


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless")
    browser = webdriver.Chrome(options=options)
    yield browser
    browser.quit()


@pytest.fixture
def login_page(driver):
    return LoginActions(driver)


@pytest.fixture
def login_locators(driver):
    return LoginLocators(driver)
