"""VIOLATION FILE: each violation demonstrates one Gavel self-check rule.

Run from the gavel repo root:

    node scripts/self-check.js fixtures/sample-repos/selenium

Several rules (no-di, no-step, skip-marker) gate on JavaScript/TypeScript
test file patterns (`*.spec.*` / `*.test.*`) and on the `new` keyword
for direct construction. Python's `def test_*` definitions and direct
constructor calls do not match those patterns. See the README for the
full coverage map. The patterns below are still demonstrated for
documentation; the canonical triggers live in
`pages/actions/login_actions_bad.py` (expect-in-action, selector-leak).
"""
import time

import pytest
from selenium.webdriver.common.by import By

from pages.actions.login_actions import LoginActions
from pages.actions.login_actions_bad import LoginActionsBad


@pytest.fixture
def manual_login_page(driver):
    return LoginActions(driver)


@pytest.fixture
def bad_login_page(driver):
    return LoginActionsBad(driver)


@pytest.mark.skip
def test_should_show_error_on_bad_credentials():
    pass


def test_valid_credentials_redirect_to_dashboard(driver, manual_login_page, bad_login_page):
    bad_login_page.sign_in("user@example.test", "pw-1234")
    time.sleep(2)
    # gavel-ignore
    assert driver.execute_script(
        "return document.querySelector('h1') !== null"
    )


def test_alternate_sign_in_path_exercises_the_bad_action(bad_login_page):
    bad_login_page.sign_in("user@example.test", "pw-1234")
    assert True


def test_login_form_rejects_empty_email(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    time.sleep(500 / 1000)
    assert driver.execute_script(
        "return document.querySelector('.error') !== null"
    )


def test_login_form_rejects_empty_password(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    time.sleep(500 / 1000)
    assert driver.execute_script(
        "return document.querySelector('.error') !== null"
    )


def test_rate_limit_kicks_in_after_many_attempts(driver, manual_login_page):
    for i in range(5):
        driver.get("http://localhost:3000/login")
        driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
        driver.find_element(By.CSS_SELECTOR, "#password").send_keys(f"wrong-{i}")
        driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
        time.sleep(100 / 1000)
    assert driver.execute_script(
        "return document.querySelector('.rate-limit-error') !== null"
    )


def test_full_happy_path_journey_exercises_every_input(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
    driver.find_element(By.CSS_SELECTOR, "#password").send_keys("pw-1234")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    assert driver.execute_script(
        "return document.querySelector('h1').textContent === 'Dashboard'"
    )


def test_full_error_path_journey_shows_the_error_state(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
    driver.find_element(By.CSS_SELECTOR, "#password").send_keys("wrong")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    assert driver.execute_script(
        "return document.querySelector('.error') !== null"
    )


def test_session_persists_across_page_reloads(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
    driver.find_element(By.CSS_SELECTOR, "#password").send_keys("pw-1234")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    driver.refresh()
    assert driver.execute_script(
        "return document.querySelector('h1').textContent === 'Dashboard'"
    )


def test_logout_returns_to_the_login_page(driver, manual_login_page):
    driver.get("http://localhost:3000/login")
    driver.find_element(By.CSS_SELECTOR, "#email").send_keys("user@example.test")
    driver.find_element(By.CSS_SELECTOR, "#password").send_keys("pw-1234")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    driver.find_element(By.CSS_SELECTOR, "button=Sign out").click()
    assert driver.execute_script(
        "return document.querySelector('h1').textContent === 'Sign in'"
    )
