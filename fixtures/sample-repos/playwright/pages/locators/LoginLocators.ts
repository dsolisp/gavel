import type { Page } from '@playwright/test';

// Locator class: every element-targeting expression lives here.
// No assertions. No navigation logic. Just names.
export class LoginLocators {
  constructor(private page: Page) {}

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }

  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  get dashboardHeading() {
    return this.page.getByRole('heading', { name: 'Dashboard' });
  }

  get errorMessage() {
    return this.page.getByText('Invalid credentials');
  }
}
