import { test, expect } from '@playwright/test';

test('waits with native retrying assertions', async ({ checkoutPage }) => {
  await checkoutPage.openCart();
  // Native eventual assertion instead of waitForTimeout() — comment mention must not fire.
  await expect(checkoutPage.totalLabel).toBeVisible({ timeout: 5000 });
});
