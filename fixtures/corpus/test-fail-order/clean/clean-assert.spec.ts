import { test } from '@playwright/test';

test('clean test with assertion', async ({ page }) => {
  await page.goto('/example');
  await test.expect(page).toHaveTitle(/Example/);
});
