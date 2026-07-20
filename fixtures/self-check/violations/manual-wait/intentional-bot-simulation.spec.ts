import { test } from '@playwright/test';

test('intentional bot simulation pause', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(1200);
});
