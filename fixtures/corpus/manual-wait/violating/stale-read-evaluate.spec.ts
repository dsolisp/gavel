import { test } from '@playwright/test';

test('stale-read after waitForTimeout', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => document.body.innerHTML);
});
