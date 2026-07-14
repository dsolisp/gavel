import { expect, test } from '@playwright/test';

test('checkout shows total', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Total' })).toHaveText('$10');
});
