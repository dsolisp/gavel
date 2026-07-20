import { test } from '@playwright/test';

test('redundant waitForTimeout', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(2000);
  await page.waitForSelector('[data-testid="result"]', { timeout: 5000 });
});
