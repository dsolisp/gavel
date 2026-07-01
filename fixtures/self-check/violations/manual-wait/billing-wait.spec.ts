import { test } from '@playwright/test';

test('waits manually', async ({ page }) => {
  await page.goto('/billing');
  await page.waitForTimeout(2000);
});
