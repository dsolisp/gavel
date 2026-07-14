import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { LoginLocators } from '../locators/LoginLocators';

// VIOLATION FILE: expect-in-action — this action class contains an
// `expect(...)` call. Specs own assertions; actions return state or
// perform interactions. The canonical pattern is in LoginActions.ts
// (no `expect`, no `assert`); this file exists to demonstrate the rule.
export class LoginActionsBad {
  locators: LoginLocators;

  constructor(private page: Page) {
    this.locators = new LoginLocators(page);
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.locators.emailInput.fill(email);
    await this.locators.passwordInput.fill(password);
    // VIOLATION: expect/assert APIs belong in spec files, not action classes.
    expect(email).toContain('@');
    await this.locators.signInButton.click();
  }
}
