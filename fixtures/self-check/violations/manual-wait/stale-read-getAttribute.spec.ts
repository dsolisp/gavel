import { test } from '@playwright/test';

test('stale-read getAttribute after waitForTimeout', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(800);
  const href = await page.locator('a').getAttribute('href');
});
