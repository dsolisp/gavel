import { test } from '@playwright/test';

test.fail('PROJ-123 checkout rounding regression', async ({ checkoutPage }) => {
  await checkoutPage.openCart();
});
