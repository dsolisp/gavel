import { test } from '@playwright/test';

test('intentional wait is suppressed with reason', async ({ page }) => {
  await page.goto('/example');
  await page.waitForTimeout(500); // gavel-ignore: manual-wait — third-party widget load pulse; no observable ready state
});
