import { test, expect } from '@playwright/test';

test('redundant waitForTimeout before expect.poll', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(1000);
  await expect.poll(() => page.evaluate(() => window.status)).toBe('ready');
});
