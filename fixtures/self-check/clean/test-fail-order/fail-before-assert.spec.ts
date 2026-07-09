import { test, expect } from '@playwright/test';

test('known regression is marked before asserting', async ({ checkoutPage }) => {
  test.fail(true, 'PROJ-456 cart badge count regression');
  await expect(checkoutPage.cartBadge).toBeVisible();
});
