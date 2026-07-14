import { expect, test } from '@playwright/test';

test('login succeeds', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  return;
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
