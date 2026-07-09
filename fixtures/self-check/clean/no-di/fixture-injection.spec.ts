import { test } from '@playwright/test';

test('uses injected page object', async ({ checkoutPage }) => {
  // Page object arrives via fixture DI; constructing plain built-ins is fine.
  const params = new URLSearchParams({ tab: 'orders' });
  await checkoutPage.openTab(params.toString());
});
