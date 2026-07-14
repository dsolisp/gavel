// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run `node scripts/self-check.js fixtures/sample-repos/playwright` to see
// the findings. Do not copy this file into a real suite.

import { test, expect } from '@playwright/test';
import { LoginActions } from '../pages/actions/LoginActions';
import { LoginActionsBad } from '../pages/actions/LoginActionsBad';
import { LoginLocators } from '../pages/locators/LoginLocators';

test.describe('Login (bad)', () => {
  const loginPage = new LoginActions({} as any);
  const loginLocators = new LoginLocators({} as any);
  const badLoginPage = new LoginActionsBad({} as any);

  test.skip('should show error on bad credentials', async () => {
    await loginPage.signIn('wrong@example.test', 'wrong');
  });

  test('valid credentials redirect to dashboard', async ({ page }) => {
    await page.locator('#email').fill('user@example.test');
    await page.locator('#password').fill('pw-1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('alternate sign-in path exercises the bad action', async () => {
    await badLoginPage.signIn('user@example.test', 'pw-1234');
    await expect(page).toBeTruthy();
  });

  test('login form rejects empty email', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error')).toBeVisible();
  });

  test('login form rejects empty password', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('user@example.test');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error')).toBeVisible();
  });

  test('rate limit kicks in after many attempts', async ({ page }) => {
    for (let i = 0; i < 5; i += 1) {
      await page.locator('#email').fill('user@example.test');
      await page.locator('#password').fill(`wrong-${i}`);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(100);
    }
    await expect(page.locator('.rate-limit-error')).toBeVisible();
  });

  test('placeholder for ignore-no-reason', () => {
    expect(1).toBe(1);

    // gavel-ignore

    expect(2).toBe(2);
  });

  // The following tests are intentionally long and step-less so the no-step
  // rule has a finding to report. Real suites should split these into
  // Real suites should split these into smaller, focused tests.

  test('full happy-path journey exercises every input', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('user@example.test');
    await page.locator('#password').fill('pw-1234');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('full error-path journey shows the error state', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('user@example.test');
    await page.locator('#password').fill('wrong');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.error')).toBeVisible();
  });

  test('session persists across page reloads', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('user@example.test');
    await page.locator('#password').fill('pw-1234');
    await page.locator('button[type="submit"]').click();
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('logout returns to the login page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('user@example.test');
    await page.locator('#password').fill('pw-1234');
    await page.locator('button[type="submit"]').click();
    await page.locator('button=Sign out').click();
    await expect(page.locator('h1')).toHaveText('Sign in');
  });
});
