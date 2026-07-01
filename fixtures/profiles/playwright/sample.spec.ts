import { test, expect } from '@playwright/test';

test('profile fixture uses accessibility-first locators', async ({ page }) => {
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByLabel('Email')).toBeVisible();
});
