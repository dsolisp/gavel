import { test } from '@playwright/test';
import { BadBillingPage } from '../selector-leak/pages/BadBillingPage';

test('constructs page object directly', async ({ page }) => {
  const billingPage = new BadBillingPage(page);
  await billingPage.clickSave();
});
