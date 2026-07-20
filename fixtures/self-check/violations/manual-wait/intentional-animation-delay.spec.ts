import { test } from '@playwright/test';

test('intentional animation delay', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(300);
});
