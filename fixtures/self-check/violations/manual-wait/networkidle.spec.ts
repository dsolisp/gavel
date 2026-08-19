import { test } from '@playwright/test';

test('waits for network idle', async ({ page }) => {
  await page.goto('/example');
  await page.waitForLoadState('networkidle');
});
