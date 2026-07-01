import { Page } from '@playwright/test';

export class BadBillingPage {
  constructor(private readonly page: Page) {}

  async clickSave() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}
