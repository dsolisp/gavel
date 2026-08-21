import { test, expect } from '@playwright/test';

test('waits with native retrying assertions', async ({ checkoutPage }) => {
  await checkoutPage.openCart();
  // Native eventual assertion instead of waitForTimeout() — comment mention must not fire.
  // waitForLoadState('networkidle') in comments must not fire.
  await expect(checkoutPage.totalLabel).toBeVisible({ timeout: 5000 });
});

test('load state is clean', async ({ page }) => {
  await page.waitForLoadState('load');
  await page.waitForLoadState('domcontentloaded');
});
