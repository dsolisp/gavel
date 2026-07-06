import { test } from '@playwright/test';

test.fail('missing ticket reference', async ({ page }) => {
  await page.goto('/example');
});
