import { expect, Page } from '@playwright/test';

export class LoginActions {
  constructor(private page: Page) {}
  async submit() {
    expect(this.page).toHaveURL(/dashboard/);
  }
}
