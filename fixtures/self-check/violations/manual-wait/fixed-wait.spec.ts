import { test } from '@playwright/test';

test('waits manually', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(2000);
});
