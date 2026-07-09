// Locator class: raw selector expressions are allowed here — selector-leak stays quiet.
import type { Page } from '@playwright/test';

export class ExamplePageLocators {
  constructor(private readonly page: Page) {}

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get confirmButton() {
    return this.page.getByRole('button', { name: 'Confirm' });
  }
}
