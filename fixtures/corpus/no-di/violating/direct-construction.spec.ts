import { test, type Page } from '@playwright/test';

class BadExamplePage {
  constructor(private readonly page: Page) {}

  async clickSave() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}

test('constructs page object directly', async ({ page }) => {
  const examplePage = new BadExamplePage(page);
  await examplePage.clickSave();
});
