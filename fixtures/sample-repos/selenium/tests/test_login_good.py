"""Login tests — Constitution-compliant.

Patterns: pytest fixture DI, factory data, native waits inside the action
class, plain `assert` in the spec. Each logical step is grouped with a
commented header (pytest has no `test.step`; the comment is the marker).
"""
from factories import UserFactory


def test_valid_credentials_redirect_to_dashboard(driver, login_page, login_locators):
    user = UserFactory.create(role="trader")

    # Step: navigate to login
    login_page.navigate_to("/login")

    # Step: sign in with factory credentials
    login_page.sign_in(user.email, user.password)

    # Step: verify dashboard is visible
    assert login_locators.visible(login_locators.DASHBOARD).text == "Dashboard"


def test_invalid_credentials_show_error(driver, login_page, login_locators):
    # Step: navigate to login
    login_page.navigate_to("/login")

    # Step: submit wrong credentials
    login_page.sign_in("wrong@example.test", "wrongpass")

    # Step: verify error message appears
    assert login_locators.visible(login_locators.ERROR).is_displayed()
