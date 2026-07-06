import { expect, Page } from '@playwright/test';

export class BadExampleActions {
  constructor(private readonly page: Page) {}

  async assertDraftVisible() {
    await expect(this.page.getByRole('button', { name: 'Save' })).toBeVisible();
  }
}
