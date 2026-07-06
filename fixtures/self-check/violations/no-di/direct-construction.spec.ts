import { test } from '@playwright/test';
import { BadExamplePage } from '../selector-leak/pages/BadExamplePage';

test('constructs page object directly', async ({ page }) => {
  const examplePage = new BadExamplePage(page);
  await examplePage.clickSave();
});
