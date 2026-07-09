import type { Page } from '@playwright/test';
import { LoginLocators } from '../locators/LoginLocators';

// Action class: receives a locator class, owns user workflows.
// Specs own assertions; actions return state or perform interactions.
export class LoginActions {
  locators: LoginLocators;

  constructor(private page: Page) {
    this.locators = new LoginLocators(page);
  }

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.locators.emailInput.fill(email);
    await this.locators.passwordInput.fill(password);
    await this.locators.signInButton.click();
  }
}
