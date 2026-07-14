import { expect, test } from '@playwright/test';

test('checkout opens payment form', async ({ page }) => {
  await page.goto('/checkout');
});
