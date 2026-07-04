import { test, expect } from '@playwright/test';

test.describe('@smoke login tests', () => {
  test('@regression should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('@smoke should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible();
  });
});
