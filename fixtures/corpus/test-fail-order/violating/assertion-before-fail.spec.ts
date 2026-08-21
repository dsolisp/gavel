import { test } from '@playwright/test';

test('assertion before fail', async ({ page }) => {
  await page.goto('/example');
  await test.expect(page).toHaveTitle(/Example/);
  test.fail();
});
