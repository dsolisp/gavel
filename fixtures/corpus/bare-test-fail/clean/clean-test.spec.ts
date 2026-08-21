import { test } from '@playwright/test';

test('clean test without fail marker', async ({ page }) => {
  await page.goto('/example');
  await test.expect(page).toHaveTitle(/Example/);
});
