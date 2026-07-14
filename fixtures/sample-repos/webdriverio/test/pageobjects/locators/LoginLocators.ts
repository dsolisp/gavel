// Locator class: getter-based locators, one per element.
// No assertions, no navigation logic.
export class LoginLocators {
  get emailInput() {
    return $('[role="textbox"][aria-label="Email"]');
  }

  get passwordInput() {
    return $('[role="textbox"][aria-label="Password"]');
  }

  get signInButton() {
    return $('button[role="button"]');
  }

  get dashboardHeading() {
    return $('h1');
  }

  get errorMessage() {
    return $('//*[contains(text(),"Invalid credentials")]');
  }
}
